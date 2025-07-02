const mongoose = require("mongoose");
const Client = require("../models/Client");
const User = require("../models/User");
const FeeChalan = require("../models/FeeChalan");
const bcrypt = require("bcryptjs");
const Student = require("../models/Student");
const Teacher = require("../models/Teacher");
const Subject = require("../models/Subject");
const Supervisor = require("../models/Supervisor");
const SalaryInvoice = require("../models/SalaryInvoice");
const StaffAttendance = require("../models/StaffAttendance");
const Schedule = require("../models/Schedule");
const { validationResult } = require("express-validator");
const {
  getNextStaffId,
  getNextClientId,
  getNextStudentNumber,
  getNextGlobalStudentId,
} = require("../helpers/idGenerators");
const moment = require("moment-timezone");

const parseManualDate = (str) => {
  if (!str || typeof str !== "string") return null;

  const [day, month, year] = str.split("-");
  if (!day || !month || !year) return null;
  return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
};

async function handleStudentStatusScheduleUpdates(
  studentUserId,
  newStatus,
  previousStatus,
  updatedById,
  currentTime = new Date()
) {
  let schedulesUpdated = 0;
  let classesDeleted = 0;
  let schedulesReactivated = 0;
  let newSchedulesCreated = 0;

  const allSchedulesForStudent = await Schedule.find({
    students: { $in: [studentUserId] },
  });

  const totalSchedulesFound = allSchedulesForStudent.length;

  if (
    ["freeze", "drop", "completed"].includes(newStatus) &&
    !["freeze", "drop", "completed"].includes(previousStatus)
  ) {
    const recurringSchedules = await Schedule.find({
      students: { $in: [studentUserId] },
      isRecurring: true,
    });

    for (const schedule of recurringSchedules) {
      await Schedule.findByIdAndUpdate(schedule._id, {
        $set: {
          isRecurring: false,
          updatedBy: updatedById,
        },
      });
      schedulesUpdated++;
    }

    const uniqueSubjects = [
      ...new Set(
        allSchedulesForStudent.map((schedule) => schedule.subject.toString())
      ),
    ];

    for (const subjectId of uniqueSubjects) {
      const lastScheduleForSubject = await Schedule.findOne({
        students: { $in: [studentUserId] },
        subject: subjectId,
        classDate: { $gte: currentTime },
        status: "scheduled",
        sessionStatus: "pending",
      })
        .sort({ classDate: 1 })
        .limit(1);

      if (lastScheduleForSubject) {
        await Schedule.findByIdAndDelete(lastScheduleForSubject._id);
        classesDeleted++;
      }
    }
  }

  if (
    ["regular", "trial"].includes(newStatus) &&
    ["freeze", "drop", "completed"].includes(previousStatus)
  ) {
    const inactiveSchedules = await Schedule.find({
      students: { $in: [studentUserId] },
      isRecurring: false,
    });

    for (const schedule of inactiveSchedules) {
      await Schedule.findByIdAndUpdate(schedule._id, {
        $set: {
          isRecurring: true,
          updatedBy: updatedById,
        },
      });
      schedulesReactivated++;

      let nextScheduleFound = false;
      const nextDate = new Date(currentTime);

      if (schedule.recurrencePattern === "weekdays") {
        do {
          nextDate.setDate(nextDate.getDate() + 1);
        } while (nextDate.getDay() === 0 || nextDate.getDay() === 6);
        nextScheduleFound = true;
      } else if (
        schedule.recurrencePattern === "custom" &&
        schedule.customDays?.length > 0
      ) {
        const daysMap = {
          Sunday: 0,
          Monday: 1,
          Tuesday: 2,
          Wednesday: 3,
          Thursday: 4,
          Friday: 5,
          Saturday: 6,
        };

        const customDayNumbers = schedule.customDays
          .map((day) => daysMap[day])
          .sort();

        let daysToAdd = 1;
        while (!nextScheduleFound && daysToAdd <= 7) {
          const checkDate = new Date(currentTime);
          checkDate.setDate(checkDate.getDate() + daysToAdd);
          const checkDay = checkDate.getDay();

          if (customDayNumbers.includes(checkDay)) {
            nextDate.setDate(currentTime.getDate() + daysToAdd);
            nextScheduleFound = true;
            break;
          }
          daysToAdd++;
        }
      } else if (schedule.recurrencePattern === "weekly") {
        const scheduleDayOfWeek = new Date(schedule.classDate).getDay();
        const currentDayOfWeek = nextDate.getDay();
        let daysToAdd = (scheduleDayOfWeek - currentDayOfWeek + 7) % 7;
        if (daysToAdd === 0) daysToAdd = 7;
        nextDate.setDate(nextDate.getDate() + daysToAdd);
        nextScheduleFound = true;
      }

      if (nextScheduleFound) {
        const existingSchedule = await Schedule.findOne({
          students: { $in: schedule.students },
          teacherId: schedule.teacherId,
          subject: schedule.subject,
          classDate: nextDate,
          startTime: schedule.startTime,
          endTime: schedule.endTime,
        });

        if (!existingSchedule) {
          const newSchedule = new Schedule({
            students: schedule.students,
            studentNames: schedule.studentNames,
            teacher: schedule.teacher,
            teacherId: schedule.teacherId,
            teacherName: schedule.teacherName,
            subject: schedule.subject,
            subjectName: schedule.subjectName,
            subjectType: schedule.subjectType,
            day: [
              "Sunday",
              "Monday",
              "Tuesday",
              "Wednesday",
              "Thursday",
              "Friday",
              "Saturday",
            ][nextDate.getDay()],
            startTime: schedule.startTime,
            endTime: schedule.endTime,
            classDate: nextDate,
            status: "scheduled",
            sessionStatus: "pending",
            isRecurring: true,
            recurrencePattern: schedule.recurrencePattern,
            customDays: schedule.customDays,
            recurrenceParentId: schedule.recurrenceParentId || schedule._id,
            scheduledDuration: schedule.scheduledDuration,
            createdBy: schedule.createdBy,
            updatedBy: updatedById,
          });

          await newSchedule.save();
          newSchedulesCreated++;
        }
      }
    }
  }

  return {
    schedulesUpdated,
    classesDeleted,
    schedulesReactivated,
    newSchedulesCreated,
    totalSchedulesFound,
    statusChange: `${previousStatus} → ${newStatus}`,
  };
}

async function handleClientStatusScheduleUpdates(
  clientUserId,
  newStatus,
  previousStatus,
  updatedById,
  currentTime = new Date()
) {
  let totalStudentsAffected = 0;
  let totalSchedulesUpdated = 0;
  let totalClassesDeleted = 0;
  let totalSchedulesReactivated = 0;
  let totalNewSchedulesCreated = 0;
  const studentUpdates = [];

  try {
    const clientStudents = await Student.find({ client: clientUserId });
    totalStudentsAffected = clientStudents.length;

    if (totalStudentsAffected === 0) {
      return {
        totalStudentsAffected: 0,
        totalSchedulesUpdated: 0,
        totalClassesDeleted: 0,
        totalSchedulesReactivated: 0,
        totalNewSchedulesCreated: 0,
        statusChange: `${previousStatus} → ${newStatus}`,
        studentUpdates: [],
      };
    }

    const studentUserIds = clientStudents.map((student) => student.user);

    if (
      ["freeze", "drop", "completed"].includes(newStatus) &&
      !["freeze", "drop", "completed"].includes(previousStatus)
    ) {
      const recurringSchedules = await Schedule.find({
        students: { $in: studentUserIds },
        isRecurring: true,
      });

      for (const schedule of recurringSchedules) {
        await Schedule.findByIdAndUpdate(schedule._id, {
          $set: {
            isRecurring: false,
            updatedBy: updatedById,
          },
        });
        totalSchedulesUpdated++;
      }

      for (const student of clientStudents) {
        const studentUserId = student.user;
        let studentSchedulesUpdated = 0;
        let studentClassesDeleted = 0;
        const allSchedulesForStudent = await Schedule.find({
          students: { $in: [studentUserId] },
        });
        const uniqueSubjects = [
          ...new Set(
            allSchedulesForStudent.map((schedule) =>
              schedule.subject.toString()
            )
          ),
        ];

        for (const subjectId of uniqueSubjects) {
          const lastScheduleForSubject = await Schedule.findOne({
            students: { $in: [studentUserId] },
            subject: subjectId,
            classDate: { $gte: currentTime },
            status: "scheduled",
            sessionStatus: "pending",
          })
            .sort({ classDate: 1 })
            .limit(1);

          if (lastScheduleForSubject) {
            await Schedule.findByIdAndDelete(lastScheduleForSubject._id);
            studentClassesDeleted++;
            totalClassesDeleted++;
          }
        }

        studentUpdates.push({
          studentId: studentUserId,
          studentName: student.name,
          schedulesUpdated: studentSchedulesUpdated,
          classesDeleted: studentClassesDeleted,
        });
      }
    }

    if (
      ["regular", "trial"].includes(newStatus) &&
      ["freeze", "drop", "completed"].includes(previousStatus)
    ) {
      for (const student of clientStudents) {
        const studentUserId = student.user;
        let studentSchedulesReactivated = 0;
        let studentNewSchedulesCreated = 0;

        const inactiveSchedules = await Schedule.find({
          students: { $in: [studentUserId] },
          isRecurring: false,
        });

        for (const schedule of inactiveSchedules) {
          await Schedule.findByIdAndUpdate(schedule._id, {
            $set: {
              isRecurring: true,
              updatedBy: updatedById,
            },
          });
          studentSchedulesReactivated++;
          totalSchedulesReactivated++;

          let nextScheduleFound = false;
          const nextDate = new Date(currentTime);

          if (schedule.recurrencePattern === "weekdays") {
            do {
              nextDate.setDate(nextDate.getDate() + 1);
            } while (nextDate.getDay() === 0 || nextDate.getDay() === 6);
            nextScheduleFound = true;
          } else if (
            schedule.recurrencePattern === "custom" &&
            schedule.customDays?.length > 0
          ) {
            const daysMap = {
              Sunday: 0,
              Monday: 1,
              Tuesday: 2,
              Wednesday: 3,
              Thursday: 4,
              Friday: 5,
              Saturday: 6,
            };

            const customDayNumbers = schedule.customDays
              .map((day) => daysMap[day])
              .sort();

            let daysToAdd = 1;
            while (!nextScheduleFound && daysToAdd <= 7) {
              const checkDate = new Date(currentTime);
              checkDate.setDate(checkDate.getDate() + daysToAdd);
              const checkDay = checkDate.getDay();

              if (customDayNumbers.includes(checkDay)) {
                nextDate.setDate(currentTime.getDate() + daysToAdd);
                nextScheduleFound = true;
                break;
              }
              daysToAdd++;
            }
          } else if (schedule.recurrencePattern === "weekly") {
            const scheduleDayOfWeek = new Date(schedule.classDate).getDay();
            const currentDayOfWeek = nextDate.getDay();
            let daysToAdd = (scheduleDayOfWeek - currentDayOfWeek + 7) % 7;
            if (daysToAdd === 0) daysToAdd = 7;
            nextDate.setDate(nextDate.getDate() + daysToAdd);
            nextScheduleFound = true;
          }
          if (nextScheduleFound) {
            const existingSchedule = await Schedule.findOne({
              students: { $in: schedule.students },
              teacherId: schedule.teacherId,
              subject: schedule.subject,
              classDate: nextDate,
              startTime: schedule.startTime,
              endTime: schedule.endTime,
            });

            if (!existingSchedule) {
              const newSchedule = new Schedule({
                students: schedule.students,
                studentNames: schedule.studentNames,
                teacher: schedule.teacher,
                teacherId: schedule.teacherId,
                teacherName: schedule.teacherName,
                subject: schedule.subject,
                subjectName: schedule.subjectName,
                subjectType: schedule.subjectType,
                day: [
                  "Sunday",
                  "Monday",
                  "Tuesday",
                  "Wednesday",
                  "Thursday",
                  "Friday",
                  "Saturday",
                ][nextDate.getDay()],
                startTime: schedule.startTime,
                endTime: schedule.endTime,
                classDate: nextDate,
                status: "scheduled",
                sessionStatus: "pending",
                isRecurring: true,
                recurrencePattern: schedule.recurrencePattern,
                customDays: schedule.customDays,
                recurrenceParentId: schedule.recurrenceParentId || schedule._id,
                scheduledDuration: schedule.scheduledDuration,
                createdBy: schedule.createdBy,
                updatedBy: updatedById,
              });

              await newSchedule.save();
              studentNewSchedulesCreated++;
              totalNewSchedulesCreated++;
            }
          }
        }

        studentUpdates.push({
          studentId: studentUserId,
          studentName: student.name,
          schedulesReactivated: studentSchedulesReactivated,
          newSchedulesCreated: studentNewSchedulesCreated,
        });
      }
    }

    return {
      totalStudentsAffected,
      totalSchedulesUpdated,
      totalClassesDeleted,
      totalSchedulesReactivated,
      totalNewSchedulesCreated,
      statusChange: `${previousStatus} → ${newStatus}`,
      studentUpdates,
    };
  } catch (error) {
    console.error("❌ Error in handleClientStatusScheduleUpdates:", error);
    throw error;
  }
}

function shouldDeleteClass(schedule, currentTime = new Date()) {
  if (schedule.classEndedAt) {
    return false;
  }

  if (
    schedule.sessionStatus === "completed" ||
    schedule.sessionStatus === "in_progress"
  ) {
    return false;
  }

  if (schedule.classStartedAt) {
    return false;
  }

  const now = new Date(currentTime);
  const classDate = new Date(schedule.classDate);
  const [endHour, endMinute] = schedule.endTime.split(":");
  const scheduledEndTime = new Date(classDate);
  scheduledEndTime.setHours(parseInt(endHour), parseInt(endMinute), 0, 0);

  if (now > scheduledEndTime) {
    return false;
  }

  return true;
}

exports.addUser = async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ msg: "Access denied. Admins only." });
  }

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, email, password, gender, phoneNumber, role, ...rest } =
    req.body;
  if (rest.referredByClientUserId && rest.referredOnDate) {
    const parsedDate = parseManualDate(rest.referredOnDate);
    if (!parsedDate) {
      return res.status(400).json({
        msg: "Invalid referral date format. Use DD-MM-YYYY",
      });
    }
  }
  if (!name) {
    return res.status(400).json({ msg: "Name is required" });
  }

  if (!gender) {
    return res.status(400).json({ msg: "Gender is required" });
  }
  if (role !== "student") {
    if (!email) {
      return res.status(400).json({ msg: "Email is required" });
    }
    if (!password) {
      return res.status(400).json({ msg: "Password is required" });
    }
  }

  try {
    if (role !== "student") {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res
          .status(400)
          .json({ msg: "User with this email already exists" });
      }
    }

    const hashedPassword =
      role !== "student" ? await bcrypt.hash(password, 10) : null;

    let staffId = null;
    if (
      [
        "teacher_quran",
        "teacher_subjects",
        "supervisor_quran",
        "supervisor_subjects",
        "admin",
      ].includes(role)
    ) {
      staffId = await getNextStaffId();
    }

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      gender,
      role,
      phoneNumber,
      createdBy: req.user.id,
      profilePicture: rest.profilePicture || null,
      ...(staffId && { staffId }),
    });

    let newStudent = null;
    let newTeacher = null;
    let newSupervisor = null;
    let newClient = null;
    let client = null;

    if (
      ["student", "teacher_quran", "teacher_subjects"].includes(role) &&
      rest.subjects?.length
    ) {
      const areValidSubjectIds = rest.subjects.every((id) =>
        mongoose.Types.ObjectId.isValid(id)
      );
      if (!areValidSubjectIds) {
        return res
          .status(400)
          .json({ msg: "One or more subject IDs are invalid format." });
      }

      const validSubjects = await Subject.find({ _id: { $in: rest.subjects } });
      if (validSubjects.length !== rest.subjects.length) {
        return res
          .status(400)
          .json({ msg: "One or more subject IDs do not exist in database." });
      }

      rest.subjects = validSubjects.map((subj) => ({
        _id: subj._id,
        name: subj.name,
      }));
    }

    try {
      await newUser.save();
      if (role === "client") {
        const clientId = await getNextClientId();
        if (!clientId) {
          await User.findByIdAndDelete(newUser._id);
          return res.status(500).json({ msg: "Failed to generate client ID" });
        }
        let referredByClient = null;
        let referredOn = null;
        if (rest.referredByClientUserId) {
          const referringClient = await Client.findOne({
            user: rest.referredByClientUserId,
          }).populate("user", "name");

          if (referringClient) {
            referredByClient = {
              _id: referringClient._id,
              name: referringClient.clientName || referringClient.user?.name,
            };

            try {
              referredOn = rest.referredOnDate
                ? parseManualDate(rest.referredOnDate)
                : new Date();

              if (!referredOn) {
                throw new Error("Invalid date format");
              }
              referringClient.totalReferrals =
                (referringClient.totalReferrals || 0) + 1;
              referringClient.referralRecords =
                referringClient.referralRecords || [];
              referringClient.referralRecords.push({
                referredClientId: newUser._id,
                referredOn: referredOn,
              });
              await referringClient.save();
            } catch (error) {
              console.error("Date parsing error:", error);
              return res.status(400).json({
                msg: "Invalid referral date format. Use DD-MM-YYYY",
              });
            }
          }
        }

        let referralHandledBy = null;
        if (rest.referralHandledByUserId) {
          const referrer = await User.findById(rest.referralHandledByUserId);
          if (referrer) {
            referralHandledBy = {
              _id: referrer._id,
              name: referrer.name,
              role: referrer.role,
            };
            referrer.totalReferrals = (referrer.totalReferrals || 0) + 1;
            await referrer.save();
          }
        }

        const currentDate = new Date();
        const initialStatus = rest.status || "trial";
        const statusDateHistory = {
          trial: [],
          regular: [],
          drop: [],
          freeze: [],
          completed: [],
        };
        if (initialStatus === "freeze") {
          statusDateHistory.freeze.push({
            date: currentDate,
            endDate: null,
            addedBy: req.user.id,
            endedBy: null,
          });
          if (rest.freezeEndDate) {
            statusDateHistory.freeze[
              statusDateHistory.freeze.length - 1
            ].endDate = new Date(rest.freezeEndDate);
            statusDateHistory.freeze[
              statusDateHistory.freeze.length - 1
            ].endedBy = req.user.id;

            if (new Date(rest.freezeEndDate) > currentDate) {
              const afterFreezeStatus = "regular";
              statusDateHistory[afterFreezeStatus] =
                statusDateHistory[afterFreezeStatus] || [];
              statusDateHistory[afterFreezeStatus].push({
                date: new Date(rest.freezeEndDate),
                addedBy: req.user.id,
                scheduledBy: req.user.id,
                scheduledAt: currentDate,
              });
            }
          }
        }
        newClient = new Client({
          user: newUser._id,
          clientId,
          clientName: name,
          contactNo: rest.contactNo,
          shift: rest.shift || "morning",
          country: rest.country,
          state: rest.state,
          remarks: rest.remarks,
          referredByClient,
          referralHandledBy,
          referredBy: rest.referredBy,
          referralRecords: referredOn
            ? [
                {
                  referredClientId: newUser._id,
                  referredOn: referredOn,
                },
              ]
            : [],
          registrationDate: currentDate,
          status: initialStatus,
          statusDates: {
            trial: {
              date: initialStatus === "trial" ? currentDate : null,
              addedBy: initialStatus === "trial" ? req.user.id : null,
            },
            regular: {
              date: initialStatus === "regular" ? currentDate : null,
              addedBy: initialStatus === "regular" ? req.user.id : null,
            },
            drop: {
              date: initialStatus === "drop" ? currentDate : null,
              addedBy: initialStatus === "drop" ? req.user.id : null,
            },
            freeze: {
              date: initialStatus === "freeze" ? currentDate : null,
              addedBy: initialStatus === "freeze" ? req.user.id : null,
            },
            completed: {
              date: initialStatus === "completed" ? currentDate : null,
              addedBy: initialStatus === "completed" ? req.user.id : null,
            },
          },
          statusDateHistory,
          numberOfStudents: 0,
          totalFee: rest.totalFee || 0,
          currency: rest.currency || "PKR",
          students: [],
          createdBy: req.user.id,
        });

        await newClient.save();
      }

      if (role === "teacher_quran" || role === "teacher_subjects") {
        if (!rest.manager || !mongoose.Types.ObjectId.isValid(rest.manager)) {
          await User.findByIdAndDelete(newUser._id);
          return res.status(400).json({ msg: "Valid manager ID is required" });
        }
        const manager = await User.findById(rest.manager);
        if (
          !manager ||
          !["admin", "supervisor_quran", "supervisor_subjects"].includes(
            manager.role
          )
        ) {
          await User.findByIdAndDelete(newUser._id);
          return res
            .status(400)
            .json({ msg: "Manager must be an admin or supervisor" });
        }

        const department = role.includes("quran") ? "quran" : "subjects";

        if (rest.availability) {
          const validDays = [
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
            "Sunday",
          ];

          if (rest.availability.days) {
            const invalidDays = rest.availability.days.filter(
              (day) => !validDays.includes(day)
            );
            if (invalidDays.length > 0) {
              await User.findByIdAndDelete(newUser._id);
              return res.status(400).json({
                msg: `Invalid days provided: ${invalidDays.join(", ")}`,
              });
            }
          }
        }

        newTeacher = new Teacher({
          user: newUser._id,
          name,
          fatherName: rest.fatherName,
          department,
          dateOfBirth: rest.dateOfBirth,
          qualification: rest.qualification,
          joiningDate: rest.joiningDate || new Date(),
          manager: manager._id,
          managerName: manager.name,
          expertise: rest.expertise || [],
          subjects: rest.subjects || [],
          salary: rest.salary,
          availability: {
            days: rest.availability?.days || [],
            startTime: rest.availability?.startTime,
            endTime: rest.availability?.endTime,
          },
          isActive: true,
          shift: rest.shift,
          cnicNumber: rest.cnicNumber,
          religion: rest.religion,
          attendance: [],
          salaryHistory: [],
        });

        await newTeacher.save();
        await newTeacher.populate("manager", "name role");
      }
      if (role === "supervisor_quran" || role === "supervisor_subjects") {
        if (!rest.manager || !mongoose.Types.ObjectId.isValid(rest.manager)) {
          await User.findByIdAndDelete(newUser._id);
          return res.status(400).json({ msg: "Valid manager ID is required" });
        }
        const manager = await User.findById(rest.manager);
        if (
          !manager ||
          !["admin", "supervisor_quran", "supervisor_subjects"].includes(
            manager.role
          )
        ) {
          await User.findByIdAndDelete(newUser._id);
          return res
            .status(400)
            .json({ msg: "Manager must be an admin or supervisor" });
        }

        const department = role.includes("quran") ? "quran" : "subjects";
        if (rest.availability) {
          const validDays = [
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
            "Sunday",
          ];

          if (rest.availability.days) {
            const invalidDays = rest.availability.days.filter(
              (day) => !validDays.includes(day)
            );
            if (invalidDays.length > 0) {
              await User.findByIdAndDelete(newUser._id);
              return res.status(400).json({
                msg: `Invalid days provided: ${invalidDays.join(", ")}`,
              });
            }
          }
        }
        newSupervisor = new Supervisor({
          user: newUser._id,
          name,
          department,
          manager: manager._id,
          managerName: manager.name,
          ...rest,
          availability: {
            days: rest.availability?.days || [],
            startTime: rest.availability?.startTime,
            endTime: rest.availability?.endTime,
          },
        });

        await newSupervisor.save();
        await newSupervisor.populate("manager", "name role");
      }

      if (role === "student") {
        if (!rest.dateOfBirth || !rest.grade || !rest.clientId) {
          await User.findByIdAndDelete(newUser._id);
          return res.status(400).json({
            msg: "Date of birth, grade and client ID are required",
          });
        }

        const clientUser = await User.findById(rest.clientId);
        if (!clientUser || clientUser.role !== "client") {
          await User.findByIdAndDelete(newUser._id);
          return res
            .status(400)
            .json({ msg: "Client user not found or not a client" });
        }

        const client = await Client.findOne({ user: clientUser._id });
        if (!client) {
          await User.findByIdAndDelete(newUser._id);
          return res.status(400).json({ msg: "Client profile not found" });
        }

        let subjectsWithTeachers = [];

        if (rest.subjects?.length) {
          const subjects = await Subject.find({ _id: { $in: rest.subjects } });
          if (subjects.length !== rest.subjects.length) {
            await User.findByIdAndDelete(newUser._id);
            return res
              .status(400)
              .json({ msg: "One or more subjects not found" });
          }

          if (rest.assignedTeachers?.length) {
            if (rest.assignedTeachers.length !== subjects.length) {
              await User.findByIdAndDelete(newUser._id);
              return res.status(400).json({
                msg: "Number of teachers must match number of subjects",
              });
            }

            const uniqueTeacherIds = [...new Set(rest.assignedTeachers)];
            const teachers = await User.find({
              _id: { $in: uniqueTeacherIds },
              role: { $in: ["teacher_quran", "teacher_subjects"] },
            });

            if (teachers.length !== uniqueTeacherIds.length) {
              await User.findByIdAndDelete(newUser._id);
              return res.status(400).json({
                msg: "One or more teachers not found or are not teachers",
              });
            }
            for (let i = 0; i < subjects.length; i++) {
              const subject = subjects[i];
              const assignedTeacherId = rest.assignedTeachers[i];

              const assignedTeacher = teachers.find(
                (teacher) => teacher._id.toString() === assignedTeacherId
              );

              if (!assignedTeacher) {
                await User.findByIdAndDelete(newUser._id);
                return res.status(400).json({
                  msg: `Teacher with ID ${assignedTeacherId} not found for subject ${subject.name}`,
                });
              }

              const canTeachSubject =
                (subject.type === "quran" &&
                  assignedTeacher.role === "teacher_quran") ||
                (subject.type === "subjects" &&
                  assignedTeacher.role === "teacher_subjects");

              if (!canTeachSubject) {
                await User.findByIdAndDelete(newUser._id);
                return res.status(400).json({
                  msg: `Teacher ${assignedTeacher.name} cannot teach ${subject.name} (type: ${subject.type})`,
                });
              }

              subjectsWithTeachers.push({
                teacher: {
                  _id: assignedTeacher._id,
                  name: assignedTeacher.name,
                },
                subject: {
                  _id: subject._id,
                  name: subject.name,
                },
                startDate: new Date(),
                assignedBy: req.user.id,
                assignedAt: new Date(),
              });
            }
          }
        }

        const studentNumber = await getNextStudentNumber(client._id);
        const globalStudentId = await getNextGlobalStudentId();
        const currentDate = new Date();
        const initialStatus = rest.status || "trial";
        const statusDateHistory = {
          trial: [],
          regular: [],
          drop: [],
          freeze: [],
          completed: [],
        };

        if (initialStatus === "freeze") {
          statusDateHistory.freeze.push({
            date: currentDate,
            endDate: null,
            addedBy: req.user.id,
            endedBy: null,
          });
          if (rest.freezeEndDate) {
            statusDateHistory.freeze[
              statusDateHistory.freeze.length - 1
            ].endDate = new Date(rest.freezeEndDate);
            statusDateHistory.freeze[
              statusDateHistory.freeze.length - 1
            ].endedBy = req.user.id;

            if (new Date(rest.freezeEndDate) > currentDate) {
              const afterFreezeStatus = "regular";
              statusDateHistory[afterFreezeStatus] =
                statusDateHistory[afterFreezeStatus] || [];
              statusDateHistory[afterFreezeStatus].push({
                date: new Date(rest.freezeEndDate),
                addedBy: req.user.id,
                scheduledBy: req.user.id,
                scheduledAt: currentDate,
              });
            }
          }
        }
        newStudent = new Student({
          user: newUser._id,
          name,
          client: client.user,
          clientName: client.clientName || client.user.name,
          studentId: globalStudentId,
          studentNumber,
          dateOfBirth: new Date(rest.dateOfBirth),
          grade: rest.grade,
          enrollmentDate: currentDate,
          status: initialStatus,
          statusDates: {
            trial: {
              date: initialStatus === "trial" ? currentDate : null,
              addedBy: initialStatus === "trial" ? req.user.id : null,
            },
            regular: {
              date: initialStatus === "regular" ? currentDate : null,
              addedBy: initialStatus === "regular" ? req.user.id : null,
            },
            drop: {
              date: initialStatus === "drop" ? currentDate : null,
              addedBy: initialStatus === "drop" ? req.user.id : null,
            },
            freeze: {
              date: initialStatus === "freeze" ? currentDate : null,
              addedBy: initialStatus === "freeze" ? req.user.id : null,
            },
            completed: {
              date: initialStatus === "completed" ? currentDate : null,
              addedBy: initialStatus === "completed" ? req.user.id : null,
            },
          },
          statusDateHistory,
          subjects: rest.subjects,
          assignedTeachers: subjectsWithTeachers,
        });

        await newStudent.save();

        client.students.push(newUser._id);
        client.numberOfStudents += 1;
        await client.save();
      }
      return res.status(201).json({
        msg: `${
          role.charAt(0).toUpperCase() + role.slice(1)
        } user created successfully`,
        user: newUser,
        student: newStudent,
        teacher: newTeacher,
        supervisor: newSupervisor,
        client: newClient,
      });
    } catch (error) {
      if (newUser?._id) {
        await User.findByIdAndDelete(newUser._id);
      }
      throw error;
    }
  } catch (err) {
    console.error("Error in addUser:", err.message);
    return res.status(500).json({
      msg: err.message || "Server error while creating user",
    });
  }
};

exports.updateUser = async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ msg: "Access denied. Admins only." });
  }

  const { userId } = req.params;
  const {
    name,
    email,
    phoneNumber,
    address,
    profilePicture,
    gender,
    password,
    staffId,
    studentId,
    role,
    ...roleSpecificFields
  } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ msg: "User not found" });

    if (staffId || studentId || role) {
      return res.status(400).json({
        msg: "You cannot update staffId, studentId, or role directly.",
      });
    }

    if (name) user.name = name;
    if (email) user.email = email;
    if (phoneNumber) user.phoneNumber = phoneNumber;
    if (address) user.address = address;
    if (profilePicture) user.profilePicture = profilePicture;
    if (gender) user.gender = gender;
    if (password && user.role !== "student") {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }

    await user.save();

    let roleDoc;

    switch (user.role) {
      case "admin":
        if (roleSpecificFields.permissions) {
          user.permissions = {
            ...user.permissions,
            ...roleSpecificFields.permissions,
          };
        }

        await user.save();

        roleDoc = user;
        break;
      case "student":
        let subjectsWithTeachers = [];

        if (roleSpecificFields.subjects?.length) {
          const subjects = await Subject.find({
            _id: { $in: roleSpecificFields.subjects },
          });
          if (subjects.length !== roleSpecificFields.subjects.length) {
            return res
              .status(400)
              .json({ msg: "One or more subjects not found" });
          }
          if (roleSpecificFields.assignedTeachers?.length) {
            if (
              roleSpecificFields.assignedTeachers.length !== subjects.length
            ) {
              return res.status(400).json({
                msg: "Number of teachers must match number of subjects",
              });
            }

            const uniqueTeacherIds = [
              ...new Set(roleSpecificFields.assignedTeachers),
            ];

            const teachers = await User.find({
              _id: { $in: uniqueTeacherIds },
              role: { $in: ["teacher_quran", "teacher_subjects"] },
            });

            if (teachers.length !== uniqueTeacherIds.length) {
              return res.status(400).json({
                msg: "One or more teachers not found or are not teachers",
              });
            }
            for (let i = 0; i < subjects.length; i++) {
              const subject = subjects[i];
              const assignedTeacherId = roleSpecificFields.assignedTeachers[i];

              const assignedTeacher = teachers.find(
                (teacher) => teacher._id.toString() === assignedTeacherId
              );

              if (!assignedTeacher) {
                return res.status(400).json({
                  msg: `Teacher with ID ${assignedTeacherId} not found for subject ${subject.name}`,
                });
              }

              const canTeachSubject =
                (subject.type === "quran" &&
                  assignedTeacher.role === "teacher_quran") ||
                (subject.type === "subjects" &&
                  assignedTeacher.role === "teacher_subjects");

              if (!canTeachSubject) {
                return res.status(400).json({
                  msg: `Teacher ${assignedTeacher.name} cannot teach ${subject.name} (type: ${subject.type})`,
                });
              }

              subjectsWithTeachers.push({
                teacher: {
                  _id: assignedTeacher._id,
                  name: assignedTeacher.name,
                },
                subject: {
                  _id: subject._id,
                  name: subject.name,
                },
                startDate: new Date(),
                assignedBy: req.user.id,
                assignedAt: new Date(),
              });
            }
          }
        }
        if (roleSpecificFields.clientId) {
          const clientUser = await User.findById(roleSpecificFields.clientId);
          if (!clientUser || clientUser.role !== "client") {
            return res
              .status(400)
              .json({ msg: "Client user not found or not a client" });
          }

          const newClient = await Client.findOne({ user: clientUser._id });
          if (!newClient) {
            return res.status(400).json({ msg: "Client profile not found" });
          }

          roleSpecificFields.client = newClient.user;
          roleSpecificFields.clientName =
            newClient.clientName || newClient.user.name;
        }

        const currentStudent = await Student.findOne({ user: user._id });
        if (!currentStudent) {
          return res.status(404).json({ msg: "Student profile not found" });
        }
        let statusUpdate = {};
        let statusHistoryUpdate = {};

        if (
          roleSpecificFields.status &&
          roleSpecificFields.status !== currentStudent.status
        ) {
          const currentDate = new Date();
          if (roleSpecificFields.status === "drop") {
            user.isActive = false;
            user.lastDeactivatedAt = currentDate;
            user.deactivatedBy = req.user.id;
            user.deactivationReason = "Student status changed to drop";
            await user.save();
          }
          statusUpdate = {
            status: roleSpecificFields.status,
            [`statusDates.${roleSpecificFields.status}`]: {
              date: currentDate,
              addedBy: req.user.id,
            },
          };

          if (!currentStudent.statusDateHistory) {
            statusHistoryUpdate = {
              statusDateHistory: {
                trial: [],
                regular: [],
                drop: [],
                freeze: [],
                completed: [],
              },
            };
          } else {
            statusHistoryUpdate = {
              statusDateHistory: JSON.parse(
                JSON.stringify(currentStudent.statusDateHistory)
              ),
            };
          }

          if (roleSpecificFields.status === "freeze") {
            statusHistoryUpdate.statusDateHistory.freeze =
              statusHistoryUpdate.statusDateHistory.freeze || [];

            const freezeEntry = {
              date: roleSpecificFields.freezeStartDate || currentDate,
              endDate: roleSpecificFields.freezeEndDate
                ? new Date(roleSpecificFields.freezeEndDate)
                : null,
              addedBy: req.user.id,
              endedBy: roleSpecificFields.freezeEndDate ? req.user.id : null,
            };

            statusHistoryUpdate.statusDateHistory.freeze.push(freezeEntry);
          } else if (currentStudent.status === "freeze") {
            if (
              statusHistoryUpdate.statusDateHistory.freeze &&
              statusHistoryUpdate.statusDateHistory.freeze.length > 0
            ) {
              const activeFreeze = [
                ...statusHistoryUpdate.statusDateHistory.freeze,
              ]
                .filter((entry) => !entry.endDate)
                .sort((a, b) => new Date(b.date) - new Date(a.date))[0];

              if (activeFreeze) {
                activeFreeze.endDate = currentDate;
                activeFreeze.endedBy = req.user.id;
              }
            }

            statusHistoryUpdate.statusDateHistory[roleSpecificFields.status] =
              statusHistoryUpdate.statusDateHistory[
                roleSpecificFields.status
              ] || [];

            statusHistoryUpdate.statusDateHistory[
              roleSpecificFields.status
            ].push({
              date: currentDate,
              addedBy: req.user.id,
            });
          } else {
            statusHistoryUpdate.statusDateHistory[roleSpecificFields.status] =
              statusHistoryUpdate.statusDateHistory[
                roleSpecificFields.status
              ] || [];

            statusHistoryUpdate.statusDateHistory[
              roleSpecificFields.status
            ].push({
              date: currentDate,
              addedBy: req.user.id,
            });
          }
        } else if (
          roleSpecificFields.status === "freeze" &&
          currentStudent.status === "freeze" &&
          roleSpecificFields.freezeEndDate !== undefined
        ) {
          if (!currentStudent.statusDateHistory) {
            statusHistoryUpdate = {
              statusDateHistory: {
                trial: [],
                regular: [],
                drop: [],
                freeze: [],
                completed: [],
              },
            };
          } else {
            statusHistoryUpdate = {
              statusDateHistory: JSON.parse(
                JSON.stringify(currentStudent.statusDateHistory)
              ),
            };
          }

          if (
            statusHistoryUpdate.statusDateHistory.freeze &&
            statusHistoryUpdate.statusDateHistory.freeze.length > 0
          ) {
            const freezeEntries = [
              ...statusHistoryUpdate.statusDateHistory.freeze,
            ];
            const activeFreeze =
              freezeEntries
                .filter((entry) => !entry.endDate)
                .sort((a, b) => new Date(b.date) - new Date(a.date))[0] ||
              freezeEntries.sort(
                (a, b) => new Date(b.date) - new Date(a.date)
              )[0];

            if (activeFreeze) {
              activeFreeze.endDate = new Date(roleSpecificFields.freezeEndDate);
              activeFreeze.endedBy = req.user.id;
            } else {
              statusHistoryUpdate.statusDateHistory.freeze.push({
                date: roleSpecificFields.freezeStartDate || new Date(),
                endDate: new Date(roleSpecificFields.freezeEndDate),
                addedBy: req.user.id,
                endedBy: req.user.id,
              });
            }
          } else {
            statusHistoryUpdate.statusDateHistory.freeze = [
              {
                date: roleSpecificFields.freezeStartDate || new Date(),
                endDate: new Date(roleSpecificFields.freezeEndDate),
                addedBy: req.user.id,
                endedBy: req.user.id,
              },
            ];
          }
        }

        roleDoc = await Student.findOneAndUpdate(
          { user: user._id },
          {
            $set: {
              name: name || undefined,
              grade: roleSpecificFields.grade,
              dateOfBirth: roleSpecificFields.dateOfBirth
                ? new Date(roleSpecificFields.dateOfBirth)
                : undefined,
              client: roleSpecificFields.client,
              clientName: roleSpecificFields.clientName,
              subjects: roleSpecificFields.subjects,
              ...(subjectsWithTeachers.length > 0 && {
                assignedTeachers: subjectsWithTeachers,
              }),
              ...statusUpdate,
              ...statusHistoryUpdate,
            },
          },
          { new: true }
        );

        if (!roleDoc) {
          return res.status(404).json({ msg: "Student profile not found" });
        }
        if (roleSpecificFields.clientId) {
          const oldStudent = await Student.findOne({ user: user._id });
          if (oldStudent && oldStudent.client !== roleSpecificFields.client) {
            await Client.findByIdAndUpdate(oldStudent.client, {
              $pull: { students: user._id },
              $inc: { numberOfStudents: -1 },
            });
            await Client.findByIdAndUpdate(roleSpecificFields.client, {
              $addToSet: { students: user._id },
              $inc: { numberOfStudents: 1 },
            });
          }
        }
        if (
          roleSpecificFields.status &&
          roleSpecificFields.status !== currentStudent.status
        ) {
          const previousStatus = currentStudent.status;
          const newStatus = roleSpecificFields.status;
          const shouldUpdateSchedules =
            (["freeze", "drop", "completed"].includes(newStatus) &&
              !["freeze", "drop", "completed"].includes(previousStatus)) ||
            (["regular", "trial"].includes(newStatus) &&
              ["freeze", "drop", "completed"].includes(previousStatus));

          if (shouldUpdateSchedules) {
            try {
              const scheduleUpdateResult =
                await handleStudentStatusScheduleUpdates(
                  user._id,
                  newStatus,
                  previousStatus,
                  req.user.id,
                  new Date("2025-06-05 03:49:24")
                );

              return res.status(200).json({
                msg: "User and profile updated successfully with schedule management",
                user,
                profile: roleDoc,
                scheduleUpdates: {
                  statusChange: scheduleUpdateResult.statusChange,
                  totalSchedulesFound: scheduleUpdateResult.totalSchedulesFound,
                  schedulesUpdated: scheduleUpdateResult.schedulesUpdated,
                  classesDeleted: scheduleUpdateResult.classesDeleted,
                  schedulesReactivated:
                    scheduleUpdateResult.schedulesReactivated,
                  newSchedulesCreated: scheduleUpdateResult.newSchedulesCreated,
                  updatedBy: req.user.id,
                  updatedAt: "2025-06-05 03:40:06",
                },
              });
            } catch (scheduleError) {
              console.error("❌ Error updating schedules:", scheduleError);

              return res.status(200).json({
                msg: "User and profile updated successfully but schedule update failed",
                user,
                profile: roleDoc,
                scheduleError: scheduleError.message,
              });
            }
          }
        }

        break;
      case "teacher_quran":
      case "teacher_subjects":
        if (roleSpecificFields.manager) {
          if (!mongoose.Types.ObjectId.isValid(roleSpecificFields.manager)) {
            return res
              .status(400)
              .json({ msg: "Valid manager ID is required" });
          }

          const manager = await User.findById(roleSpecificFields.manager);
          if (
            !manager ||
            !["admin", "supervisor_quran", "supervisor_subjects"].includes(
              manager.role
            )
          ) {
            return res
              .status(400)
              .json({ msg: "Manager must be an admin or supervisor" });
          }
        }

        if (roleSpecificFields.availability?.days) {
          const validDays = [
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
            "Sunday",
          ];
          const invalidDays = roleSpecificFields.availability.days.filter(
            (day) => !validDays.includes(day)
          );
          if (invalidDays.length > 0) {
            return res.status(400).json({
              msg: `Invalid days provided: ${invalidDays.join(", ")}`,
            });
          }
        }

        if (roleSpecificFields.subjects?.length) {
          const areValidSubjectIds = roleSpecificFields.subjects.every((id) =>
            mongoose.Types.ObjectId.isValid(id)
          );
          if (!areValidSubjectIds) {
            return res
              .status(400)
              .json({ msg: "One or more subject IDs are invalid format." });
          }

          const validSubjects = await Subject.find({
            _id: { $in: roleSpecificFields.subjects },
          });
          if (validSubjects.length !== roleSpecificFields.subjects.length) {
            return res.status(400).json({
              msg: "One or more subject IDs do not exist in database.",
            });
          }

          roleSpecificFields.subjects = validSubjects.map((subj) => ({
            _id: subj._id,
            name: subj.name,
          }));
        }
        if (roleSpecificFields.manager) {
          const manager = await User.findById(roleSpecificFields.manager);
          if (manager) {
            roleSpecificFields.managerName = manager.name;
          }
        }

        roleDoc = await Teacher.findOneAndUpdate(
          { user: user._id },
          {
            $set: {
              name: name || undefined,
              ...roleSpecificFields,
            },
          },
          { new: true }
        ).populate("manager", "name role");
        roleDoc = await Teacher.findOneAndUpdate(
          { user: user._id },
          {
            $set: {
              name: name || undefined,
              fatherName: roleSpecificFields.fatherName,
              qualification: roleSpecificFields.qualification,
              expertise: roleSpecificFields.expertise,
              subjects: roleSpecificFields.subjects,
              manager: roleSpecificFields.manager,
              managerName: roleSpecificFields.managerName,
              salary: roleSpecificFields.salary,
              shift: roleSpecificFields.shift,
              cnicNumber: roleSpecificFields.cnicNumber,
              religion: roleSpecificFields.religion,
              availability: roleSpecificFields.availability && {
                days: roleSpecificFields.availability.days || [],
                startTime: roleSpecificFields.availability.startTime,
                endTime: roleSpecificFields.availability.endTime,
              },
            },
          },
          {
            new: true,
            runValidators: true,
          }
        ).populate("manager", "name role");

        if (!roleDoc) {
          return res.status(404).json({ msg: "Teacher profile not found" });
        }
        break;
      case "supervisor_quran":
      case "supervisor_subjects":
        if (roleSpecificFields.manager) {
          if (!mongoose.Types.ObjectId.isValid(roleSpecificFields.manager)) {
            return res
              .status(400)
              .json({ msg: "Valid manager ID is required" });
          }

          const manager = await User.findById(roleSpecificFields.manager);
          if (
            !manager ||
            !["admin", "supervisor_quran", "supervisor_subjects"].includes(
              manager.role
            )
          ) {
            return res
              .status(400)
              .json({ msg: "Manager must be an admin or supervisor" });
          }
          roleSpecificFields.managerName = manager.name;
        }
        if (roleSpecificFields.availability?.days) {
          const validDays = [
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
            "Sunday",
          ];
          const invalidDays = roleSpecificFields.availability.days.filter(
            (day) => !validDays.includes(day)
          );
          if (invalidDays.length > 0) {
            return res.status(400).json({
              msg: `Invalid days provided: ${invalidDays.join(", ")}`,
            });
          }
        }
        roleDoc = await Supervisor.findOneAndUpdate(
          { user: user._id },
          {
            $set: {
              name: name || undefined,
              fatherName: roleSpecificFields.fatherName,
              manager: roleSpecificFields.manager,
              managerName: roleSpecificFields.managerName,
              salary: roleSpecificFields.salary,
              shift: roleSpecificFields.shift,
              cnicNumber: roleSpecificFields.cnicNumber,
              religion: roleSpecificFields.religion,
              dateOfBirth: roleSpecificFields.dateOfBirth,
              availability: roleSpecificFields.availability && {
                days: roleSpecificFields.availability.days || [],
                startTime: roleSpecificFields.availability.startTime,
                endTime: roleSpecificFields.availability.endTime,
              },
            },
          },
          {
            new: true,
            runValidators: true,
          }
        ).populate("manager", "name role");

        if (!roleDoc) {
          return res.status(404).json({ msg: "Supervisor profile not found" });
        }
        break;
      case "client":
        const client = await Client.findOne({ user: user._id });
        if (!client) break;
        if (name) {
          client.clientName = name;
        }
        if (
          roleSpecificFields.status &&
          roleSpecificFields.status !== client.status
        ) {
          const currentDate = new Date();
          const previousClientStatus = client.status;
          if (!client.statusDateHistory) {
            client.statusDateHistory = {
              trial: [],
              regular: [],
              drop: [],
              freeze: [],
              completed: [],
            };
          }

          if (roleSpecificFields.status === "freeze") {
            client.statusDateHistory.freeze =
              client.statusDateHistory.freeze || [];
            client.statusDateHistory.freeze.push({
              date: currentDate,
              endDate: roleSpecificFields.freezeEndDate
                ? new Date(roleSpecificFields.freezeEndDate)
                : null,
              addedBy: req.user.id,
              endedBy: roleSpecificFields.freezeEndDate ? req.user.id : null,
            });
          } else if (client.status === "freeze") {
            if (
              client.statusDateHistory.freeze &&
              client.statusDateHistory.freeze.length > 0
            ) {
              const activeFreeze = [...client.statusDateHistory.freeze]
                .filter((entry) => !entry.endDate)
                .sort((a, b) => new Date(b.date) - new Date(a.date))[0];

              if (activeFreeze) {
                activeFreeze.endDate = currentDate;
                activeFreeze.endedBy = req.user.id;
              }
            }

            client.statusDateHistory[roleSpecificFields.status] =
              client.statusDateHistory[roleSpecificFields.status] || [];

            client.statusDateHistory[roleSpecificFields.status].push({
              date: currentDate,
              addedBy: req.user.id,
            });
          } else {
            client.statusDateHistory[roleSpecificFields.status] =
              client.statusDateHistory[roleSpecificFields.status] || [];

            client.statusDateHistory[roleSpecificFields.status].push({
              date: currentDate,
              addedBy: req.user.id,
            });
          }
          if (!client.statusDates) {
            client.statusDates = {};
          }
          client.status = roleSpecificFields.status;
          client.statusDates[roleSpecificFields.status] = {
            date: currentDate,
            addedBy: req.user.id,
          };

          const studentsToUpdate = await Student.find({ client: client.user });
          for (const student of studentsToUpdate) {
            if (!student.statusDateHistory) {
              student.statusDateHistory = {
                trial: [],
                regular: [],
                drop: [],
                freeze: [],
                completed: [],
              };
            }
            if (roleSpecificFields.status === "freeze") {
              student.statusDateHistory.freeze =
                student.statusDateHistory.freeze || [];

              student.statusDateHistory.freeze.push({
                date: currentDate,
                endDate: roleSpecificFields.freezeEndDate
                  ? new Date(roleSpecificFields.freezeEndDate)
                  : null,
                addedBy: req.user.id,
                endedBy: roleSpecificFields.freezeEndDate ? req.user.id : null,
              });
            } else if (student.status === "freeze") {
              if (
                student.statusDateHistory.freeze &&
                student.statusDateHistory.freeze.length > 0
              ) {
                const activeFreeze = [...student.statusDateHistory.freeze]
                  .filter((entry) => !entry.endDate)
                  .sort((a, b) => new Date(b.date) - new Date(a.date))[0];

                if (activeFreeze) {
                  activeFreeze.endDate = currentDate;
                  activeFreeze.endedBy = req.user.id;
                }
              }

              student.statusDateHistory[roleSpecificFields.status] =
                student.statusDateHistory[roleSpecificFields.status] || [];

              student.statusDateHistory[roleSpecificFields.status].push({
                date: currentDate,
                addedBy: req.user.id,
              });
            } else {
              student.statusDateHistory[roleSpecificFields.status] =
                student.statusDateHistory[roleSpecificFields.status] || [];

              student.statusDateHistory[roleSpecificFields.status].push({
                date: currentDate,
                addedBy: req.user.id,
              });
            }
            if (!student.statusDates) {
              student.statusDates = {};
            }
            student.status = roleSpecificFields.status;
            student.statusDates[roleSpecificFields.status] = {
              date: currentDate,
              addedBy: req.user.id,
            };

            await student.save();
          }
          const shouldUpdateSchedules =
            (["freeze", "drop", "completed"].includes(
              roleSpecificFields.status
            ) &&
              !["freeze", "drop", "completed"].includes(
                previousClientStatus
              )) ||
            (["regular", "trial"].includes(roleSpecificFields.status) &&
              ["freeze", "drop", "completed"].includes(previousClientStatus));

          if (shouldUpdateSchedules) {
            try {
              const scheduleUpdateResult =
                await handleClientStatusScheduleUpdates(
                  client.user,
                  roleSpecificFields.status,
                  previousClientStatus,
                  req.user.id,
                  new Date()
                );

              roleDoc = await client.save();

              return res.status(200).json({
                msg: "Client status updated successfully with schedule management",
                user,
                profile: roleDoc,
                scheduleUpdates: {
                  statusChange: scheduleUpdateResult.statusChange,
                  totalStudentsAffected:
                    scheduleUpdateResult.totalStudentsAffected,
                  totalSchedulesUpdated:
                    scheduleUpdateResult.totalSchedulesUpdated,
                  totalClassesDeleted: scheduleUpdateResult.totalClassesDeleted,
                  totalSchedulesReactivated:
                    scheduleUpdateResult.totalSchedulesReactivated,
                  totalNewSchedulesCreated:
                    scheduleUpdateResult.totalNewSchedulesCreated,
                  studentUpdates: scheduleUpdateResult.studentUpdates,
                  updatedBy: req.user.id,
                  updatedAt: new Date(),
                },
              });
            } catch (scheduleError) {
              console.error(
                "❌ Error updating client schedules:",
                scheduleError
              );

              roleDoc = await client.save();

              return res.status(200).json({
                msg: "Client status updated successfully but schedule update failed",
                user,
                profile: roleDoc,
                scheduleError: scheduleError.message,
              });
            }
          }
        } else if (
          roleSpecificFields.status === "freeze" &&
          client.status === "freeze" &&
          roleSpecificFields.freezeEndDate !== undefined
        ) {
          if (!client.statusDateHistory) {
            client.statusDateHistory = {
              trial: [],
              regular: [],
              drop: [],
              freeze: [],
              completed: [],
            };
          }

          if (
            client.statusDateHistory.freeze &&
            client.statusDateHistory.freeze.length > 0
          ) {
            const freezeEntries = [...client.statusDateHistory.freeze];
            const activeFreeze =
              freezeEntries
                .filter((entry) => !entry.endDate)
                .sort((a, b) => new Date(b.date) - new Date(a.date))[0] ||
              freezeEntries.sort(
                (a, b) => new Date(b.date) - new Date(a.date)
              )[0];

            if (activeFreeze) {
              activeFreeze.endDate = new Date(roleSpecificFields.freezeEndDate);
              activeFreeze.endedBy = req.user.id;
              if (roleSpecificFields.updateStudentsFreezeEnd) {
                const studentsToUpdate = await Student.find({
                  client: client.user,
                  status: "freeze",
                });

                for (const student of studentsToUpdate) {
                  if (!student.statusDateHistory) {
                    student.statusDateHistory = {
                      trial: [],
                      regular: [],
                      drop: [],
                      freeze: [],
                      completed: [],
                    };
                  }

                  if (
                    student.statusDateHistory.freeze &&
                    student.statusDateHistory.freeze.length > 0
                  ) {
                    const studentFreezeEntries = [
                      ...student.statusDateHistory.freeze,
                    ];
                    const studentActiveFreeze =
                      studentFreezeEntries
                        .filter((entry) => !entry.endDate)
                        .sort(
                          (a, b) => new Date(b.date) - new Date(a.date)
                        )[0] ||
                      studentFreezeEntries.sort(
                        (a, b) => new Date(b.date) - new Date(a.date)
                      )[0];

                    if (studentActiveFreeze) {
                      studentActiveFreeze.endDate = new Date(
                        roleSpecificFields.freezeEndDate
                      );
                      studentActiveFreeze.endedBy = req.user.id;
                    }
                  }

                  await student.save();
                }
              }
            } else {
              client.statusDateHistory.freeze.push({
                date: roleSpecificFields.freezeStartDate || new Date(),
                endDate: new Date(roleSpecificFields.freezeEndDate),
                addedBy: req.user.id,
                endedBy: req.user.id,
              });
            }
          } else {
            client.statusDateHistory.freeze = [
              {
                date: roleSpecificFields.freezeStartDate || new Date(),
                endDate: new Date(roleSpecificFields.freezeEndDate),
                addedBy: req.user.id,
                endedBy: req.user.id,
              },
            ];
          }
        }
        if (roleSpecificFields.clientName)
          client.clientName = roleSpecificFields.clientName;
        if (roleSpecificFields.contactNo)
          client.contactNo = roleSpecificFields.contactNo;
        if (roleSpecificFields.country)
          client.country = roleSpecificFields.country;
        if (roleSpecificFields.state) client.state = roleSpecificFields.state;
        if (roleSpecificFields.remarks)
          client.remarks = roleSpecificFields.remarks;
        if (roleSpecificFields.shift) client.shift = roleSpecificFields.shift;
        if (roleSpecificFields.status)
          client.status = roleSpecificFields.status;
        if (roleSpecificFields.totalFee)
          client.totalFee = roleSpecificFields.totalFee;
        if (roleSpecificFields.currency)
          client.currency = roleSpecificFields.currency;
        if (roleSpecificFields.referredByClientUserId) {
          const refClient = await Client.findOne({
            user: roleSpecificFields.referredByClientUserId,
          }).populate("user", "name");
          if (refClient) {
            client.referredByClient = {
              _id: refClient._id,
              name: refClient.clientName || refClient.user?.name,
            };
          }
        }
        if (roleSpecificFields.referredByClientUserId) {
          const refClient = await Client.findOne({
            user: roleSpecificFields.referredByClientUserId,
          }).populate("user", "name");
          if (refClient) {
            client.referredByClient = {
              _id: refClient._id,
              name: refClient.clientName || refClient.user?.name,
            };
          }
        }
        if (roleSpecificFields.referralHandledByUserId) {
          const refHandledBy = await User.findById(
            roleSpecificFields.referralHandledByUserId
          );
          if (refHandledBy) {
            client.referralHandledBy = {
              _id: refHandledBy._id,
              name: refHandledBy.name,
              role: refHandledBy.role,
            };
          }
        }

        roleDoc = await client.save();
        break;
      default:
        roleDoc = null;
    }

    return res.status(200).json({
      msg: "User and profile updated successfully",
      user,
      profile: roleDoc,
    });
  } catch (err) {
    console.error("❌ Error in updateUser:", err.message);
    return res.status(500).json({ msg: "Server error while updating user" });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ msg: "Access denied. Admins only." });
    }

    const users = await User.find().select("-password");
    const enrichedUsers = [];

    for (const user of users) {
      let profile = null;

      switch (user.role) {
        case "student":
          profile = await Student.findOne({ user: user._id });
          break;
        case "teacher_quran":
        case "teacher_subjects":
          profile = await Teacher.findOne({ user: user._id });
          break;
        case "supervisor_quran":
        case "supervisor_subjects":
          profile = await Supervisor.findOne({ user: user._id });
          break;
        default:
          profile = null;
      }

      enrichedUsers.push({
        ...user.toObject(),
        profile: profile || {},
      });
    }

    res.status(200).json({
      count: enrichedUsers.length,
      users: enrichedUsers,
    });
  } catch (err) {
    console.error("Error in getAllUsers:", err.message);
    res.status(500).json({ msg: "Server error while fetching users" });
  }
};

exports.getUsersByRole = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ msg: "Access denied. Admins only." });
    }

    const role = req.params.role;
    const validRoles = [
      "student",
      "teacher_quran",
      "teacher_subjects",
      "admin",
      "supervisor_quran",
      "supervisor_subjects",
    ];

    if (!validRoles.includes(role)) {
      return res
        .status(400)
        .json({ msg: `Invalid role. Valid roles: ${validRoles.join(", ")}` });
    }

    const users = await User.find({ role }).select("-password");
    const enrichedUsers = [];

    for (const user of users) {
      let profile = null;

      switch (user.role) {
        case "student":
          profile = await Student.findOne({ user: user._id })
            .populate("subjects", "name type")
            .populate({
              path: "subjectStatus.subject",
              select: "name type description",
            })
            .populate({
              path: "assignedTeachers.teacher._id",
              select: "name email gender role isActive",
              options: { strictPopulate: false },
            })
            .populate({
              path: "assignedTeachers.subject._id",
              select: "name type",
              options: { strictPopulate: false },
            })
            .lean();

          if (profile && profile.client) {
            const client = await Client.findOne({
              $or: [{ _id: profile.client }, { user: profile.client }],
            }).lean();

            if (client) {
              profile.clientId = client.clientId;
            }
          }

          if (profile) {
            let activeSubjectCount = 0;
            let activeSubjectDetails = [];

            if (profile.subjectStatus && profile.subjectStatus.length > 0) {
              profile.subjectStatus.forEach((subjectStat) => {
                if (subjectStat.isActive) {
                  activeSubjectCount++;
                  activeSubjectDetails.push({
                    subjectId: subjectStat.subject._id || subjectStat.subject,
                    subjectName: subjectStat.subject.name || "Unknown Subject",
                    subjectType: subjectStat.subject.type || "unknown",
                    activatedAt: subjectStat.currentStatus?.lastActivatedAt,
                    activatedBy: subjectStat.currentStatus?.lastActivatedBy,
                  });
                }
              });
            } else if (profile.subjects && profile.subjects.length > 0) {
              activeSubjectCount = profile.subjects.length;
              activeSubjectDetails = profile.subjects.map((subject) => ({
                subjectId: subject._id,
                subjectName: subject.name,
                subjectType: subject.type,
                activatedAt: profile.enrollmentDate,
                activatedBy: null,
                _note: "Counted from subjects array (subjectStatus empty)",
              }));
            }
            profile.activeSubjectStats = {
              totalActiveSubjects: activeSubjectCount,
              activeSubjectDetails: activeSubjectDetails,
              subjectsByType: {
                quran: activeSubjectDetails.filter(
                  (s) => s.subjectType === "quran"
                ).length,
                subjects: activeSubjectDetails.filter(
                  (s) => s.subjectType === "subjects"
                ).length,
              },
              hasActiveSubjects: activeSubjectCount > 0,
            };

            profile.statistics = {
              totalSubjects: profile.subjects ? profile.subjects.length : 0,
              activeSubjects: activeSubjectCount,
              inactiveSubjects: profile.subjectStatus
                ? profile.subjectStatus.filter((s) => !s.isActive).length
                : 0,
              totalTeachers: profile.assignedTeachers
                ? profile.assignedTeachers.length
                : 0,
              enrollmentDays: profile.enrollmentDate
                ? Math.floor(
                    (new Date() - new Date(profile.enrollmentDate)) /
                      (1000 * 60 * 60 * 24)
                  )
                : 0,
              studentStatus: profile.status,
              isActiveStudent:
                !["drop", "completed"].includes(profile.status) &&
                user.isActive,
            };
          }

          if (
            profile &&
            profile.assignedTeachers &&
            profile.assignedTeachers.length > 0
          ) {
            const teacherSubjectPairs = [];

            profile.assignedTeachers.forEach((assignment) => {
              if (
                assignment.teacher &&
                assignment.teacher._id &&
                assignment.subject &&
                assignment.subject._id
              ) {
                let teacherId =
                  typeof assignment.teacher._id === "object" &&
                  assignment.teacher._id._id
                    ? assignment.teacher._id._id.toString()
                    : assignment.teacher._id.toString
                    ? assignment.teacher._id.toString()
                    : null;

                let subjectId =
                  typeof assignment.subject._id === "object" &&
                  assignment.subject._id._id
                    ? assignment.subject._id._id.toString()
                    : assignment.subject._id.toString
                    ? assignment.subject._id.toString()
                    : null;

                if (teacherId && subjectId) {
                  teacherSubjectPairs.push({
                    teacherId,
                    subjectId,
                  });
                }
              }
            });

            const scheduleMap = {};
            for (const pair of teacherSubjectPairs) {
              try {
                const schedules = await Schedule.find({
                  teacherId: pair.teacherId,
                  subject: pair.subjectId,
                  classDate: {
                    $gte: new Date(
                      new Date().setDate(new Date().getDate() - 90)
                    ),
                  },
                })
                  .sort({ classDate: 1, startTime: 1 })
                  .lean();

                if (schedules && schedules.length > 0) {
                  const key = `${pair.teacherId}-${pair.subjectId}`;
                  scheduleMap[key] = schedules;
                }
              } catch (err) {
                console.error(
                  `Error fetching schedules for pair ${JSON.stringify(pair)}: ${
                    err.message
                  }`
                );
              }
            }

            const finalScheduleMap = {};
            const currentDate = new Date();

            Object.keys(scheduleMap).forEach((key) => {
              const teacherSubjectSchedules = scheduleMap[key];
              if (
                !teacherSubjectSchedules ||
                teacherSubjectSchedules.length === 0
              )
                return;

              const permanentChanges = teacherSubjectSchedules.filter(
                (s) =>
                  (s.rescheduleType === "permanent" && !s.isTemporaryChange) ||
                  (s.teacherChangeType === "permanent" &&
                    !s.isTeacherTemporaryChange)
              );

              if (permanentChanges.length > 0) {
                permanentChanges.sort(
                  (a, b) => new Date(b.classDate) - new Date(a.classDate)
                );
                finalScheduleMap[key] = {
                  schedule: permanentChanges[0],
                  isPermanentChange: true,
                };
              } else {
                const baseSchedules = teacherSubjectSchedules.filter(
                  (s) => !s.isTemporaryChange && !s.isTeacherTemporaryChange
                );

                if (baseSchedules.length > 0) {
                  const futureSchedules = baseSchedules.filter(
                    (s) => new Date(s.classDate) >= currentDate
                  );

                  if (futureSchedules.length > 0) {
                    futureSchedules.sort(
                      (a, b) => new Date(a.classDate) - new Date(b.classDate)
                    );
                    finalScheduleMap[key] = {
                      schedule: futureSchedules[0],
                      isPermanentChange: false,
                    };
                  } else {
                    baseSchedules.sort(
                      (a, b) => new Date(b.classDate) - new Date(a.classDate)
                    );
                    finalScheduleMap[key] = {
                      schedule: baseSchedules[0],
                      isPermanentChange: false,
                    };
                  }
                } else if (teacherSubjectSchedules.length > 0) {
                  teacherSubjectSchedules.sort(
                    (a, b) => new Date(b.classDate) - new Date(a.classDate)
                  );
                  finalScheduleMap[key] = {
                    schedule: teacherSubjectSchedules[0],
                    isTemporaryOnly: true,
                  };
                }
              }
            });

            profile.assignedTeachers = profile.assignedTeachers.map(
              (assignment) => {
                const enhancedAssignment = { ...assignment };

                if (assignment.teacher && assignment.subject) {
                  let teacherId =
                    typeof assignment.teacher._id === "object" &&
                    assignment.teacher._id._id
                      ? assignment.teacher._id._id.toString()
                      : assignment.teacher._id
                      ? assignment.teacher._id.toString()
                      : null;

                  let subjectId =
                    typeof assignment.subject._id === "object" &&
                    assignment.subject._id._id
                      ? assignment.subject._id._id.toString()
                      : assignment.subject._id
                      ? assignment.subject._id.toString()
                      : null;

                  if (teacherId && subjectId) {
                    const key = `${teacherId}-${subjectId}`;
                    const scheduleInfo = finalScheduleMap[key];

                    if (scheduleInfo && scheduleInfo.schedule) {
                      const schedule = scheduleInfo.schedule;

                      if (!scheduleInfo.isTemporaryOnly) {
                        enhancedAssignment.classSchedule = {
                          day: schedule.day,
                          startTime: schedule.startTime,
                          endTime: schedule.endTime,
                          isRecurring: schedule.isRecurring,
                          recurrencePattern: schedule.recurrencePattern,
                          nextClassDate: schedule.classDate,
                          isPermanentChange: scheduleInfo.isPermanentChange,
                          customDays: schedule.customDays,
                        };
                      }
                    }
                  }
                }

                if (profile.clientId) {
                  enhancedAssignment.clientId = profile.clientId;
                }

                return enhancedAssignment;
              }
            );
          }
          break;
          profile = await Student.findOne({ user: user._id })
            .populate("subjects", "name typr")
            .populate({
              path: "assignedTeachers.teacher._id",
              select: "name email gender role isActive",
              options: { strictPopulate: false },
            })
            .populate({
              path: "assignedTeachers.subject._id",
              select: "name type",
              options: { strictPopulate: false },
            })
            .lean();

          if (profile && profile.client) {
            const client = await Client.findOne({
              $or: [{ _id: profile.client }, { user: profile.client }],
            }).lean();

            if (client) {
              profile.clientId = client.clientId;
            }
          }

          if (
            profile &&
            profile.assignedTeachers &&
            profile.assignedTeachers.length > 0
          ) {
            const teacherSubjectPairs = [];

            profile.assignedTeachers.forEach((assignment) => {
              if (
                assignment.teacher &&
                assignment.teacher._id &&
                assignment.subject &&
                assignment.subject._id
              ) {
                let teacherId =
                  typeof assignment.teacher._id === "object" &&
                  assignment.teacher._id._id
                    ? assignment.teacher._id._id.toString()
                    : assignment.teacher._id.toString
                    ? assignment.teacher._id.toString()
                    : null;

                let subjectId =
                  typeof assignment.subject._id === "object" &&
                  assignment.subject._id._id
                    ? assignment.subject._id._id.toString()
                    : assignment.subject._id.toString
                    ? assignment.subject._id.toString()
                    : null;

                if (teacherId && subjectId) {
                  teacherSubjectPairs.push({
                    teacherId,
                    subjectId,
                  });
                }
              }
            });

            const scheduleMap = {};
            for (const pair of teacherSubjectPairs) {
              try {
                const schedules = await Schedule.find({
                  teacherId: pair.teacherId,
                  subject: pair.subjectId,
                  classDate: {
                    $gte: new Date(
                      new Date().setDate(new Date().getDate() - 90)
                    ),
                  },
                })
                  .sort({ classDate: 1, startTime: 1 })
                  .lean();

                if (schedules && schedules.length > 0) {
                  const key = `${pair.teacherId}-${pair.subjectId}`;
                  scheduleMap[key] = schedules;
                }
              } catch (err) {
                console.error(
                  `Error fetching schedules for pair ${JSON.stringify(pair)}: ${
                    err.message
                  }`
                );
              }
            }

            const finalScheduleMap = {};
            const currentDate = new Date();

            Object.keys(scheduleMap).forEach((key) => {
              const teacherSubjectSchedules = scheduleMap[key];
              if (
                !teacherSubjectSchedules ||
                teacherSubjectSchedules.length === 0
              )
                return;

              const permanentChanges = teacherSubjectSchedules.filter(
                (s) =>
                  (s.rescheduleType === "permanent" && !s.isTemporaryChange) ||
                  (s.teacherChangeType === "permanent" &&
                    !s.isTeacherTemporaryChange)
              );

              if (permanentChanges.length > 0) {
                permanentChanges.sort(
                  (a, b) => new Date(b.classDate) - new Date(a.classDate)
                );
                finalScheduleMap[key] = {
                  schedule: permanentChanges[0],
                  isPermanentChange: true,
                };
              } else {
                const baseSchedules = teacherSubjectSchedules.filter(
                  (s) => !s.isTemporaryChange && !s.isTeacherTemporaryChange
                );

                if (baseSchedules.length > 0) {
                  const futureSchedules = baseSchedules.filter(
                    (s) => new Date(s.classDate) >= currentDate
                  );

                  if (futureSchedules.length > 0) {
                    futureSchedules.sort(
                      (a, b) => new Date(a.classDate) - new Date(b.classDate)
                    );
                    finalScheduleMap[key] = {
                      schedule: futureSchedules[0],
                      isPermanentChange: false,
                    };
                  } else {
                    baseSchedules.sort(
                      (a, b) => new Date(b.classDate) - new Date(a.classDate)
                    );
                    finalScheduleMap[key] = {
                      schedule: baseSchedules[0],
                      isPermanentChange: false,
                    };
                  }
                } else if (teacherSubjectSchedules.length > 0) {
                  teacherSubjectSchedules.sort(
                    (a, b) => new Date(b.classDate) - new Date(a.classDate)
                  );
                  finalScheduleMap[key] = {
                    schedule: teacherSubjectSchedules[0],
                    isTemporaryOnly: true,
                  };
                }
              }
            });

            profile.assignedTeachers = profile.assignedTeachers.map(
              (assignment) => {
                const enhancedAssignment = { ...assignment };

                if (assignment.teacher && assignment.subject) {
                  let teacherId =
                    typeof assignment.teacher._id === "object" &&
                    assignment.teacher._id._id
                      ? assignment.teacher._id._id.toString()
                      : assignment.teacher._id
                      ? assignment.teacher._id.toString()
                      : null;

                  let subjectId =
                    typeof assignment.subject._id === "object" &&
                    assignment.subject._id._id
                      ? assignment.subject._id._id.toString()
                      : assignment.subject._id
                      ? assignment.subject._id.toString()
                      : null;

                  if (teacherId && subjectId) {
                    const key = `${teacherId}-${subjectId}`;
                    const scheduleInfo = finalScheduleMap[key];

                    if (scheduleInfo && scheduleInfo.schedule) {
                      const schedule = scheduleInfo.schedule;

                      if (!scheduleInfo.isTemporaryOnly) {
                        enhancedAssignment.classSchedule = {
                          day: schedule.day,
                          startTime: schedule.startTime,
                          endTime: schedule.endTime,
                          isRecurring: schedule.isRecurring,
                          recurrencePattern: schedule.recurrencePattern,
                          nextClassDate: schedule.classDate,
                          isPermanentChange: scheduleInfo.isPermanentChange,
                          customDays: schedule.customDays,
                        };
                      }
                    }
                  }
                }

                if (profile.clientId) {
                  enhancedAssignment.clientId = profile.clientId;
                }

                return enhancedAssignment;
              }
            );
          }
          break;
        case "teacher_quran":
        case "teacher_subjects":
          profile = await Teacher.findOne({ user: user._id }).populate(
            "manager",
            "name role"
          );
          if (profile) {
            profile = profile.toObject();
            if (profile.manager) {
              profile.managerName = profile.manager.name;
              profile.managerRole = profile.manager.role;
            }
          }
          break;
        case "supervisor_quran":
        case "supervisor_subjects":
          profile = await Supervisor.findOne({ user: user._id }).populate(
            "manager",
            "name role"
          );
          if (profile) {
            profile = profile.toObject();
            if (profile.manager) {
              profile.managerName = profile.manager.name;
              profile.managerRole = profile.manager.role;
            }
          }
          break;
        default:
          profile = null;
      }

      enrichedUsers.push({
        ...user.toObject(),
        profile: profile || {},
      });
    }

    res.status(200).json({
      count: enrichedUsers.length,
      users: enrichedUsers,
    });
  } catch (err) {
    console.error("Error in getUsersByRole:", err.message);
    res.status(500).json({ msg: "Server error while fetching users by role" });
  }
};

exports.generateFeeChallan = async (req, res) => {
  try {
    const { userId } = req.params;
    const { amount, months, fromDate, toDate, dueMonth, remarks } = req.body;

    if (!amount || !dueMonth || !months || !fromDate || !toDate) {
      return res.status(400).json({
        msg: "Amount, months, fromDate, toDate, and due month are required.",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ msg: "Invalid userId format." });
    }

    const user = await User.findById(userId);
    if (!user || user.role !== "client") {
      return res
        .status(403)
        .json({ msg: "Provided user is not a valid client." });
    }

    const clientData = await Client.findOne({ user: userId });

    if (!clientData) {
      return res.status(404).json({ msg: "Client data not found." });
    }

    const clientCurrency = clientData.currency || "USD";
    const basicFee = clientData.totalFee || 0;

    const startDate = new Date(fromDate);
    const endDate = new Date(toDate);

    if (endDate < startDate) {
      return res
        .status(400)
        .json({ msg: "End date must be greater than start date." });
    }

    const existingChallan = await FeeChalan.findOne({
      client: userId,
      months: { $in: months },
      fromDate: { $gte: startDate },
      toDate: { $lte: endDate },
    });

    if (existingChallan) {
      return res.status(409).json({
        msg: `A challan for the specified months and date range has already been generated.`,
      });
    }

    const challan = new FeeChalan({
      client: userId,
      clientName: user.name,
      clientCurrency,
      amount,
      basicFee,
      months,
      fromDate,
      toDate,
      dueMonth,
      remarks,
      status: "pending",
      issuedBy: req.user?.id || null,
      totalPaidAmount: 0,
      pendingAmount: amount,
    });

    await challan.save();

    return res.status(201).json({
      msg: "Client fee challan created successfully",
      challan,
    });
  } catch (err) {
    console.error("❌ Error in generateFeeChallan:", err.message);
    return res.status(500).json({
      msg: "Server error while creating client fee challan",
      error: err.message,
    });
  }
};

exports.addPaymentToChalan = async (req, res) => {
  try {
    const { challanId } = req.params;
    const { amount, paymentMethod, transactionId, remarks } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ msg: "Valid payment amount is required" });
    }

    const challan = await FeeChalan.findById(challanId);
    if (!challan) {
      return res.status(404).json({ msg: "Fee challan not found" });
    }

    const currentPaid = challan.paymentHistory.reduce(
      (sum, payment) => sum + payment.amount,
      0
    );
    const pendingAmount = challan.amount - currentPaid;

    if (amount > pendingAmount) {
      return res.status(400).json({
        msg: `Payment amount (${amount}) exceeds pending amount (${pendingAmount})`,
      });
    }

    challan.paymentHistory.push({
      amount: amount,
      date: new Date(),
      method: paymentMethod || "manual",
      receivedBy: req.user.id,
      remarks: remarks,
    });

    challan.updatePaymentStatus();
    await challan.save();

    res.status(200).json({
      msg: "Payment added successfully",
      challan: {
        ...challan.toObject(),
        totalPaidAmount: challan.totalPaidAmount,
        pendingAmount: challan.pendingAmount,
      },
    });
  } catch (err) {
    console.error("Error adding payment:", err.message);
    res.status(500).json({ msg: "Server error while adding payment" });
  }
};

exports.updateFeeChallan = async (req, res) => {
  try {
    const { challanId } = req.params;
    const {
      status,
      paymentMethod,
      transactionId,
      paymentDate,
      remarks,
      amountPaid,
      months,
      fromDate,
      toDate,
      amount,
      dueMonth,
    } = req.body;

    if (!mongoose.Types.ObjectId.isValid(challanId)) {
      return res.status(400).json({ msg: "Invalid challan ID format." });
    }

    const challan = await FeeChalan.findById(challanId);

    if (!challan) {
      return res.status(404).json({ msg: "Fee challan not found" });
    }

    if (dueMonth) challan.dueMonth = dueMonth;
    if (paymentMethod) challan.paymentMethod = paymentMethod;
    if (transactionId) challan.transactionId = transactionId;
    if (paymentDate) challan.paymentDate = new Date(paymentDate);
    if (remarks) challan.remarks = remarks;
    if (amount) challan.amount = amount;
    if (months) challan.months = months;
    if (fromDate) challan.fromDate = new Date(fromDate);
    if (toDate) challan.toDate = new Date(toDate);

    if (amountPaid && amountPaid > 0) {
      challan.paymentHistory.push({
        amount: amountPaid,
        date: paymentDate ? new Date(paymentDate) : new Date(),
        method: paymentMethod || "manual",
        receivedBy: req.user.id,
        remarks: remarks || "",
      });

      challan.updatePaymentStatus();
    }

    if (status && ["paid", "pending", "overdue", "partial"].includes(status)) {
      challan.status = status;
    }

    await challan.save();

    res.status(200).json({
      msg: "Fee challan updated successfully",
      challan: {
        ...challan.toObject(),
        totalPaidAmount: challan.totalPaidAmount,
        pendingAmount: challan.pendingAmount,
      },
    });
  } catch (err) {
    console.error("Error in updateFeeChallan:", err.message);
    res.status(500).json({ msg: "Server error while updating fee challan" });
  }
};

exports.deleteFeeChallan = async (req, res) => {
  try {
    const { challanId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(challanId)) {
      return res.status(400).json({ msg: "Invalid challan ID format." });
    }

    const challan = await FeeChalan.findById(challanId);

    if (!challan) {
      return res.status(404).json({ msg: "Fee challan not found" });
    }

    await FeeChalan.findByIdAndDelete(challanId);

    res.status(200).json({
      msg: "Fee challan deleted successfully",
    });
  } catch (err) {
    console.error("Error in deleteFeeChallan:", err.message);
    res.status(500).json({ msg: "Server error while deleting fee challan" });
  }
};

exports.generateSalaryInvoice = async (req, res) => {
  try {
    const { userId } = req.params;
    const {
      month,
      amount,
      bonusAmount,
      bonusReason,
      paymentDate,
      remarks,
      totalLeaves,
      refBonus,
      advancedSalary,
    } = req.body;

    if (!month || !moment(month, "YYYY-MM").isValid()) {
      return res
        .status(400)
        .json({ msg: "Valid month in YYYY-MM format is required" });
    }
    moment.tz.setDefault("Asia/Karachi");

    const existingSalary = await SalaryInvoice.findOne({
      user: userId,
      month: month,
    });

    if (existingSalary) {
      return res.status(400).json({
        msg: `Salary for ${month} has already been generated for this user`,
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    const validRoles = [
      "teacher_quran",
      "teacher_subjects",
      "supervisor_quran",
      "supervisor_subjects",
    ];

    if (!validRoles.includes(user.role)) {
      return res
        .status(400)
        .json({ msg: "User is not eligible for salary invoice" });
    }

    let salaryAmount = 0;
    let availability = {};

    if (user.role.startsWith("teacher")) {
      const teacher = await Teacher.findOne({ user: userId });
      if (!teacher) {
        return res.status(404).json({ msg: "Teacher profile not found" });
      }
      salaryAmount = teacher.salary;
      availability = teacher.availability;
    } else {
      const supervisor = await Supervisor.findOne({ user: userId });
      if (!supervisor) {
        return res.status(404).json({ msg: "Supervisor profile not found" });
      }
      salaryAmount = supervisor.salary;
      availability = supervisor.availability;
    }

    if (amount && !isNaN(amount)) {
      salaryAmount = amount;
    }

    if (!salaryAmount || isNaN(salaryAmount)) {
      return res.status(400).json({ msg: "Valid salary amount is required" });
    }

    const monthStart = moment
      .tz(month, "YYYY-MM", "Asia/Karachi")
      .startOf("month");
    const monthEnd = moment.tz(month, "YYYY-MM", "Asia/Karachi").endOf("month");

    const workingDays = [];
    let currentDate = monthStart.clone();

    while (currentDate.isSameOrBefore(monthEnd)) {
      const dayOfWeek = currentDate.day();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        workingDays.push(currentDate.format("YYYY-MM-DD"));
      }
      currentDate.add(1, "day");
    }

    const totalWorkingDays = workingDays.length;

    const attendanceRecords = await StaffAttendance.find({
      user: userId,
      pakistanFormattedDate: {
        $gte: monthStart.format("YYYY-MM-DD"),
        $lte: monthEnd.format("YYYY-MM-DD"),
      },
    }).sort("pakistanFormattedDate");

    let presentDays = attendanceRecords.length;
    let absentDays = totalWorkingDays - presentDays;
    let lateMinutes = 0;

    const workStartTime = moment(availability.startTime, "HH:mm");
    const workEndTime = moment(availability.endTime, "HH:mm");

    const dailyWorkHours = workEndTime.diff(workStartTime, "hours", true);
    const dailyWorkMinutes = workEndTime.diff(workStartTime, "minutes");

    for (const record of attendanceRecords) {
      if (record.status === "present" && record.inTime && record.outTime) {
        const checkInTime = moment(record.inTime, "HH:mm");
        const checkOutTime = moment(record.outTime, "HH:mm");
        const lateArrival = checkInTime.isAfter(workStartTime)
          ? checkInTime.diff(workStartTime, "minutes")
          : 0;
        const earlyDeparture = checkOutTime.isBefore(workEndTime)
          ? workEndTime.diff(checkOutTime, "minutes")
          : 0;

        lateMinutes += lateArrival + earlyDeparture;
      }
    }

    const perDaySalary = salaryAmount / totalWorkingDays;
    let absentFine = absentDays * perDaySalary;

    if (totalLeaves && totalLeaves > 0) {
      const approvedLeaves = Math.min(totalLeaves, absentDays);
      absentFine -= approvedLeaves * perDaySalary;
    }

    const perMinuteSalary =
      (salaryAmount / totalWorkingDays / dailyWorkHours / 60) * 1.5;
    const biometricFine = lateMinutes * perMinuteSalary;
    const totalDeduction = absentFine + biometricFine;
    const netSalary =
      Math.round(
        (salaryAmount +
          (bonusAmount || 0) +
          (refBonus || 0) -
          totalDeduction -
          (advancedSalary || 0)) *
          100
      ) / 100;

    const salaryInvoice = new SalaryInvoice({
      user: userId,
      userName: user.name,
      staffId: user.staffId,
      role: user.role,
      amount: salaryAmount,
      bonus: {
        amount: bonusAmount || 0,
        reason: bonusReason || "",
        approvedBy: req.user.id,
      },
      deduction: Math.round(totalDeduction * 100) / 100,
      absentFine: Math.round(absentFine * 100) / 100,
      biometricFine: Math.round(biometricFine * 100) / 100,
      lateMinutes,
      absentDays,
      presentDays,
      totalWorkingDays,
      totalLeaves: totalLeaves || 0,
      month,
      paymentDate: paymentDate
        ? moment.tz(paymentDate, "Asia/Karachi").toDate()
        : moment.tz("Asia/Karachi").toDate(),
      status: "pending",
      remarks: remarks || "",
      processedBy: req.user.id,
      refBonus: refBonus || 0,
      advancedSalary: advancedSalary || 0,
      netSalary: netSalary,
      approvedLeave: totalLeaves || 0,
      finePerMinute: Math.round(perMinuteSalary * 100) / 100,
    });

    await salaryInvoice.save();

    res.status(201).json({
      msg: "Salary invoice generated successfully",
      salaryInvoice,
    });
  } catch (err) {
    console.error("Error in generateSalaryInvoice:", err.message);
    res
      .status(500)
      .json({ msg: "Server error while generating salary invoice" });
  }
};

exports.updateSalaryInvoice = async (req, res) => {
  try {
    const { invoiceId } = req.params;
    const {
      amount,
      bonusAmount,
      bonusReason,
      paymentDate,
      remarks,
      totalLeaves,
      refBonus,
      advancedSalary,
    } = req.body;

    moment.tz.setDefault("Asia/Karachi");

    const salaryInvoice = await SalaryInvoice.findById(invoiceId);

    if (!salaryInvoice) {
      return res.status(404).json({ msg: "Salary invoice not found" });
    }

    const invoiceMonth = moment.tz(
      salaryInvoice.month,
      "YYYY-MM",
      "Asia/Karachi"
    );
    const currentMonth = moment.tz("Asia/Karachi").startOf("month");
    if (invoiceMonth.isBefore(currentMonth)) {
      return res
        .status(400)
        .json({ msg: "Cannot update salary invoice for past months" });
    }

    const user = await User.findById(salaryInvoice.user);
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    const monthStart = moment
      .tz(salaryInvoice.month, "YYYY-MM", "Asia/Karachi")
      .startOf("month");
    const monthEnd = moment
      .tz(salaryInvoice.month, "YYYY-MM", "Asia/Karachi")
      .endOf("month");

    const workingDays = [];
    let currentDate = monthStart.clone();

    while (currentDate.isSameOrBefore(monthEnd)) {
      const dayOfWeek = currentDate.day();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        workingDays.push(currentDate.format("YYYY-MM-DD"));
      }
      currentDate.add(1, "day");
    }

    const totalWorkingDays = workingDays.length;

    const attendanceRecords = await StaffAttendance.find({
      user: salaryInvoice.user,
      pakistanFormattedDate: {
        $gte: monthStart.format("YYYY-MM-DD"),
        $lte: monthEnd.format("YYYY-MM-DD"),
      },
    }).sort("pakistanFormattedDate");

    let presentDays = attendanceRecords.length;
    let absentDays = totalWorkingDays - presentDays;
    let lateMinutes = 0;

    let availability = {};
    if (user.role.startsWith("teacher")) {
      const teacher = await Teacher.findOne({ user: salaryInvoice.user });
      availability = teacher.availability;
    } else {
      const supervisor = await Supervisor.findOne({ user: salaryInvoice.user });
      availability = supervisor.availability;
    }

    const workStartTime = moment(availability.startTime, "HH:mm");
    const workEndTime = moment(availability.endTime, "HH:mm");

    const dailyWorkHours = workEndTime.diff(workStartTime, "hours", true);
    const dailyWorkMinutes = workEndTime.diff(workStartTime, "minutes");

    for (const record of attendanceRecords) {
      if (record.status === "present" && record.inTime && record.outTime) {
        const checkInTime = moment(record.inTime, "HH:mm");
        const checkOutTime = moment(record.outTime, "HH:mm");
        const lateArrival = checkInTime.isAfter(workStartTime)
          ? checkInTime.diff(workStartTime, "minutes")
          : 0;
        const earlyDeparture = checkOutTime.isBefore(workEndTime)
          ? workEndTime.diff(checkOutTime, "minutes")
          : 0;

        lateMinutes += lateArrival + earlyDeparture;
      }
    }

    const salaryAmount = amount || salaryInvoice.amount;
    const perDaySalary = salaryAmount / totalWorkingDays;
    let absentFine = absentDays * perDaySalary;

    if (totalLeaves && totalLeaves > 0) {
      const approvedLeaves = Math.min(totalLeaves, absentDays);
      absentFine -= approvedLeaves * perDaySalary;
    }

    const perMinuteSalary =
      (salaryAmount / totalWorkingDays / dailyWorkHours / 60) * 1.5;
    const biometricFine = lateMinutes * perMinuteSalary;
    const totalDeduction = absentFine + biometricFine;

    const netSalary =
      Math.round(
        (salaryAmount +
          (bonusAmount || 0) +
          (refBonus || 0) -
          totalDeduction -
          (advancedSalary || 0)) *
          100
      ) / 100;

    const updatedSalaryInvoice = await SalaryInvoice.findByIdAndUpdate(
      invoiceId,
      {
        amount: salaryAmount,
        bonus: {
          amount: bonusAmount || salaryInvoice.bonus.amount,
          reason: bonusReason || salaryInvoice.bonus.reason,
          approvedBy: req.user.id,
        },
        deduction: Math.round(totalDeduction * 100) / 100,
        absentFine: Math.round(absentFine * 100) / 100,
        biometricFine: Math.round(biometricFine * 100) / 100,
        lateMinutes,
        absentDays,
        presentDays,
        totalWorkingDays,
        totalLeaves: totalLeaves || salaryInvoice.totalLeaves,
        paymentDate: paymentDate
          ? moment.tz(paymentDate, "Asia/Karachi").toDate()
          : salaryInvoice.paymentDate,
        remarks: remarks || salaryInvoice.remarks,
        processedBy: req.user.id,
        refBonus: refBonus || salaryInvoice.refBonus,
        advancedSalary: advancedSalary || salaryInvoice.advancedSalary,
        netSalary: netSalary,
        approvedLeave: totalLeaves || salaryInvoice.totalLeaves,
        finePerMinute: Math.round(perMinuteSalary * 100) / 100,
        updatedAt: moment.tz("Asia/Karachi").toDate(),
      },
      { new: true }
    );

    res.json({
      msg: "Salary invoice updated successfully",
      salaryInvoice: updatedSalaryInvoice,
    });
  } catch (err) {
    console.error("Error in updateSalaryInvoice:", err.message);
    res.status(500).json({ msg: "Server error while updating salary invoice" });
  }
};

exports.markAllSalariesPaid = async (req, res) => {
  try {
    const { month } = req.body;

    let filter = {};
    if (month) {
      if (!moment(month, "YYYY-MM").isValid()) {
        return res
          .status(400)
          .json({ msg: "Valid month in YYYY-MM format is required" });
      }
      filter.month = month;
    }

    const pendingInvoices = await SalaryInvoice.find({
      ...filter,
      status: "pending",
    });

    if (pendingInvoices.length === 0) {
      return res.status(404).json({
        msg: month
          ? `No pending salary invoices found for ${month}`
          : "No pending salary invoices found",
      });
    }

    const updateResult = await SalaryInvoice.updateMany(
      {
        ...filter,
        status: "pending",
      },
      {
        $set: {
          status: "paid",
          paymentDate: moment.tz("Asia/Karachi").toDate(),
          processedBy: req.user.id,
          updatedAt: moment.tz("Asia/Karachi").toDate(),
        },
      }
    );

    res.json({
      msg: `Successfully marked ${updateResult.modifiedCount} salary invoices as paid`,
      updatedCount: updateResult.modifiedCount,
      totalFound: pendingInvoices.length,
    });
  } catch (err) {
    console.error("Error in markAllSalariesPaid:", err.message);
    res.status(500).json({
      msg: "Server error while updating salary invoices to paid status",
    });
  }
};
exports.deleteSalaryInvoice = async (req, res) => {
  try {
    const { invoiceId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(invoiceId)) {
      return res.status(400).json({ msg: "Invalid invoice ID format" });
    }
    const salaryInvoice = await SalaryInvoice.findById(invoiceId);
    if (!salaryInvoice) {
      return res.status(404).json({ msg: "Salary invoice not found" });
    }

    moment.tz.setDefault("Asia/Karachi");

    const deleteAudit = {
      deletedBy: req.user.id,
      deletedAt: moment.tz("Asia/Karachi").toDate(),
      originalInvoice: {
        user: salaryInvoice.user,
        userName: salaryInvoice.userName,
        staffId: salaryInvoice.staffId,
        month: salaryInvoice.month,
        amount: salaryInvoice.amount,
        netSalary: salaryInvoice.netSalary,
        status: salaryInvoice.status,
      },
    };

    await SalaryInvoice.findByIdAndDelete(invoiceId);

    return res.json({
      msg: "Salary invoice deleted successfully",
      deletedInvoice: {
        id: invoiceId,
        staff: salaryInvoice.userName,
        staffId: salaryInvoice.staffId,
        month: salaryInvoice.month,
        status: salaryInvoice.status,
        deletedAt: deleteAudit.deletedAt,
      },
    });
  } catch (err) {
    console.error("Error in deleteSalaryInvoice:", err.message);
    return res.status(500).json({
      msg: "Server error while deleting salary invoice",
      error: err.message,
    });
  }
};
exports.getAllClientsWithStudents = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ msg: "Access denied. Admins only." });
    }

    const { startDate, endDate, status } = req.query;

    let query = {};

    if (startDate || endDate) {
      query.registrationDate = {};
      if (startDate) {
        query.registrationDate.$gte = new Date(startDate);
      }
      if (endDate) {
        query.registrationDate.$lte = new Date(endDate);
      }
    }

    if (status) {
      const statuses = status.split(",").map((s) => s.trim());
      query.status = { $in: statuses };
    }

    if (startDate || endDate) {
      const statusDateQuery = {};

      if (status) {
        const statuses = status.split(",").map((s) => s.trim());
        statuses.forEach((s) => {
          statusDateQuery[`statusDates.${s}.date`] = {};
          if (startDate) {
            statusDateQuery[`statusDates.${s}.date`].$gte = new Date(startDate);
          }
          if (endDate) {
            statusDateQuery[`statusDates.${s}.date`].$lte = new Date(endDate);
          }
        });
        if (!query.$or) query.$or = [];
        query.$or.push(statusDateQuery);
      }
    }

    const clients = await Client.find(query)
      .populate("user", "name email gender role isActive portalAccess")
      .lean();

    const clientIdMap = {};
    clients.forEach((client) => {
      if (client.user && client.user._id) {
        clientIdMap[client.user._id.toString()] = client.clientId;
      }
    });

    const studentUserIds = [];
    for (let client of clients) {
      const studentUsers = client.students || [];
      studentUserIds.push(...studentUsers);
    }

    const students = await Student.find({ user: { $in: studentUserIds } })
      .populate("user", "name email gender role isActive")
      .populate("subjects", "name")
      .populate({
        path: "assignedTeachers.teacher._id",
        select: "name email gender role isActive",
        options: { strictPopulate: false },
      })
      .populate({
        path: "assignedTeachers.subject._id",
        select: "name",
        options: { strictPopulate: false },
      })
      .lean();

    students.forEach((student) => {
      if (student.assignedTeachers && Array.isArray(student.assignedTeachers)) {
        student.assignedTeachers = student.assignedTeachers.filter(
          (assignment) => {
            const hasValidTeacher =
              assignment.teacher &&
              assignment.teacher._id &&
              assignment.teacher._id !== null;
            const hasValidSubject =
              assignment.subject &&
              assignment.subject._id &&
              assignment.subject._id !== null;

            return hasValidTeacher && hasValidSubject;
          }
        );
      }
    });

    const teacherSubjectPairs = [];
    students.forEach((student) => {
      if (student.assignedTeachers && student.assignedTeachers.length > 0) {
        student.assignedTeachers.forEach((assignment) => {
          if (
            assignment.teacher &&
            assignment.teacher._id &&
            assignment.subject &&
            assignment.subject._id
          ) {
            let teacherId = null;
            let subjectId = null;
            try {
              if (
                typeof assignment.teacher._id === "object" &&
                assignment.teacher._id._id
              ) {
                teacherId = assignment.teacher._id._id.toString();
              } else if (assignment.teacher._id.toString) {
                teacherId = assignment.teacher._id.toString();
              }
            } catch (error) {
              console.error("Error extracting teacher ID:", error);
            }
            try {
              if (
                typeof assignment.subject._id === "object" &&
                assignment.subject._id._id
              ) {
                subjectId = assignment.subject._id._id.toString();
              } else if (assignment.subject._id.toString) {
                subjectId = assignment.subject._id.toString();
              }
            } catch (error) {
              console.error("Error extracting subject ID:", error);
            }

            if (teacherId && subjectId) {
              teacherSubjectPairs.push({
                teacherId,
                subjectId,
              });
            }
          }
        });
      }
    });

    const scheduleMap = {};
    for (const pair of teacherSubjectPairs) {
      try {
        const schedules = await Schedule.find({
          teacherId: pair.teacherId,
          subject: pair.subjectId,
          classDate: {
            $gte: new Date(new Date().setDate(new Date().getDate() - 90)),
          },
        })
          .sort({ classDate: 1, startTime: 1 })
          .lean();

        if (schedules && schedules.length > 0) {
          const key = `${pair.teacherId}-${pair.subjectId}`;
          scheduleMap[key] = schedules;
        }
      } catch (err) {
        console.error(
          `Error fetching schedules for pair ${JSON.stringify(pair)}: ${
            err.message
          }`
        );
      }
    }

    const finalScheduleMap = {};
    const currentDate = new Date();

    Object.keys(scheduleMap).forEach((key) => {
      const teacherSubjectSchedules = scheduleMap[key];
      if (!teacherSubjectSchedules || teacherSubjectSchedules.length === 0)
        return;

      const permanentChanges = teacherSubjectSchedules.filter(
        (s) =>
          (s.rescheduleType === "permanent" && !s.isTemporaryChange) ||
          (s.teacherChangeType === "permanent" && !s.isTeacherTemporaryChange)
      );

      if (permanentChanges.length > 0) {
        permanentChanges.sort(
          (a, b) => new Date(b.classDate) - new Date(a.classDate)
        );
        finalScheduleMap[key] = {
          schedule: permanentChanges[0],
          isPermanentChange: true,
        };
      } else {
        const baseSchedules = teacherSubjectSchedules.filter(
          (s) => !s.isTemporaryChange && !s.isTeacherTemporaryChange
        );

        if (baseSchedules.length > 0) {
          const futureSchedules = baseSchedules.filter(
            (s) => new Date(s.classDate) >= currentDate
          );

          if (futureSchedules.length > 0) {
            futureSchedules.sort(
              (a, b) => new Date(a.classDate) - new Date(b.classDate)
            );
            finalScheduleMap[key] = {
              schedule: futureSchedules[0],
              isPermanentChange: false,
            };
          } else {
            baseSchedules.sort(
              (a, b) => new Date(b.classDate) - new Date(a.classDate)
            );
            finalScheduleMap[key] = {
              schedule: baseSchedules[0],
              isPermanentChange: false,
            };
          }
        } else if (teacherSubjectSchedules.length > 0) {
          teacherSubjectSchedules.sort(
            (a, b) => new Date(b.classDate) - new Date(a.classDate)
          );
          finalScheduleMap[key] = {
            schedule: teacherSubjectSchedules[0],
            isTemporaryOnly: true,
          };
        }
      }
    });

    const studentMap = {};
    students.forEach((student) => {
      if (student.user && student.user._id) {
        const userId = student.user._id.toString();
        studentMap[userId] = student;
      }
    });

    for (let client of clients) {
      const studentUsers = client.students || [];
      const clientStudents = [];

      for (const studentUserId of studentUsers) {
        const studentUserIdStr = studentUserId.toString();
        const student = studentMap[studentUserIdStr];

        if (student) {
          if (student.assignedTeachers && student.assignedTeachers.length > 0) {
            student.assignedTeachers = student.assignedTeachers.map(
              (assignment) => {
                const enhancedAssignment = { ...assignment };

                if (
                  assignment.teacher &&
                  assignment.teacher._id &&
                  assignment.subject &&
                  assignment.subject._id
                ) {
                  let teacherId = null;
                  let subjectId = null;

                  try {
                    if (
                      typeof assignment.teacher._id === "object" &&
                      assignment.teacher._id._id
                    ) {
                      teacherId = assignment.teacher._id._id.toString();
                    } else if (assignment.teacher._id) {
                      teacherId = assignment.teacher._id.toString();
                    }

                    if (
                      typeof assignment.subject._id === "object" &&
                      assignment.subject._id._id
                    ) {
                      subjectId = assignment.subject._id._id.toString();
                    } else if (assignment.subject._id) {
                      subjectId = assignment.subject._id.toString();
                    }
                  } catch (error) {
                    console.error(
                      "Error processing teacher/subject IDs:",
                      error
                    );
                  }

                  if (teacherId && subjectId) {
                    const key = `${teacherId}-${subjectId}`;
                    const scheduleInfo = finalScheduleMap[key];

                    if (scheduleInfo && scheduleInfo.schedule) {
                      const schedule = scheduleInfo.schedule;
                      if (!scheduleInfo.isTemporaryOnly) {
                        enhancedAssignment.classSchedule = {
                          day: schedule.day,
                          startTime: schedule.startTime,
                          endTime: schedule.endTime,
                          isRecurring: schedule.isRecurring,
                          recurrencePattern: schedule.recurrencePattern,
                          nextClassDate: schedule.classDate,
                          isPermanentChange: scheduleInfo.isPermanentChange,
                          customDays: schedule.customDays,
                        };
                      }
                    }
                  }
                }
                try {
                  if (student.client) {
                    const clientId =
                      typeof student.client === "object"
                        ? student.client.toString()
                        : student.client;

                    if (clientIdMap[clientId]) {
                      enhancedAssignment.clientId = clientIdMap[clientId];
                    } else {
                      enhancedAssignment.clientId = student.clientId || null;
                    }
                  }
                } catch (error) {
                  console.error("Error processing client ID:", error);
                  enhancedAssignment.clientId = null;
                }

                return enhancedAssignment;
              }
            );
          }

          clientStudents.push(student);
        }
      }

      client.students = clientStudents.length ? clientStudents : null;
    }

    const summary = {
      totalClients: clients.length,
      statusBreakdown: clients.reduce((acc, client) => {
        acc[client.status] = (acc[client.status] || 0) + 1;
        return acc;
      }, {}),
      activeStatusBreakdown: {
        activeClients: clients.filter((c) => c.user?.isActive !== false).length,
        inactiveClients: clients.filter((c) => c.user?.isActive === false)
          .length,
      },
    };

    return res.status(200).json({
      success: true,
      clients,
      summary,
      filters: {
        dateRange: startDate || endDate ? { startDate, endDate } : null,
        status: status ? status.split(",").map((s) => s.trim()) : null,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error(
      "❌ Error in getAllClientsWithStudents by hammas-coding at 2025-06-18 05:36:52 UTC:",
      error.message
    );
    console.error("Stack trace:", error.stack);

    return res.status(500).json({
      success: false,
      msg: "Server error while fetching client and student data",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

exports.getDashboardStats = async (req, res) => {
  try {
    const totalStudents = await Student.countDocuments()
      .populate({
        path: "user",
        match: { isActive: true },
      })
      .then(async () => {
        return await Student.aggregate([
          {
            $lookup: {
              from: "users",
              localField: "user",
              foreignField: "_id",
              as: "userData",
            },
          },
          {
            $match: {
              "userData.isActive": true,
            },
          },
          {
            $count: "total",
          },
        ]);
      })
      .then((result) => result[0]?.total || 0);

    const studentStatusCounts = await Student.aggregate([
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "userData",
        },
      },
      {
        $match: {
          "userData.isActive": true,
        },
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const regularStudents =
      studentStatusCounts.find((s) => s._id === "regular")?.count || 0;
    const freezeStudents =
      studentStatusCounts.find((s) => s._id === "freeze")?.count || 0;
    const trialStudents =
      studentStatusCounts.find((s) => s._id === "trial")?.count || 0;
    const dropStudents =
      studentStatusCounts.find((s) => s._id === "drop")?.count || 0;
    const completedStudents =
      studentStatusCounts.find((s) => s._id === "completed")?.count || 0;

    const studentsWithActiveSubjects = await Student.aggregate([
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "userData",
        },
      },
      {
        $match: {
          "userData.isActive": true,
        },
      },
      {
        $project: {
          status: 1,
          subjectStatus: 1,
          assignedTeachers: 1,
        },
      },
    ]);

    let totalActiveSubjects = 0;
    let regularActiveSubjects = 0;
    let freezeActiveSubjects = 0;
    let trialActiveSubjects = 0;
    let dropActiveSubjects = 0;
    let completedActiveSubjects = 0;

    studentsWithActiveSubjects.forEach((student) => {
      let activeSubjectCount = 0;

      if (student.subjectStatus && student.subjectStatus.length > 0) {
        activeSubjectCount = student.subjectStatus.filter(
          (status) => status.isActive === true
        ).length;
      } else if (
        student.assignedTeachers &&
        student.assignedTeachers.length > 0
      ) {
        activeSubjectCount = student.assignedTeachers.length;
      }

      totalActiveSubjects += activeSubjectCount;

      switch (student.status) {
        case "regular":
          regularActiveSubjects += activeSubjectCount;
          break;
        case "freeze":
          freezeActiveSubjects += activeSubjectCount;
          break;
        case "trial":
          trialActiveSubjects += activeSubjectCount;
          break;
        case "drop":
          dropActiveSubjects += activeSubjectCount;
          break;
        case "completed":
          completedActiveSubjects += activeSubjectCount;
          break;
        default:
          break;
      }
    });

    const quranTeachers = await Teacher.aggregate([
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "userData",
        },
      },
      {
        $match: {
          "userData.isActive": true,
          department: "quran",
        },
      },
      {
        $count: "total",
      },
    ]).then((result) => result[0]?.total || 0);

    const quranSupervisors = await Supervisor.aggregate([
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "userData",
        },
      },
      {
        $match: {
          "userData.isActive": true,
          department: "quran",
        },
      },
      {
        $count: "total",
      },
    ]).then((result) => result[0]?.total || 0);

    const totalQuranStaff = quranTeachers + quranSupervisors;

    const subjectsTeachers = await Teacher.aggregate([
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "userData",
        },
      },
      {
        $match: {
          "userData.isActive": true,
          department: "subjects",
        },
      },
      {
        $count: "total",
      },
    ]).then((result) => result[0]?.total || 0);

    const subjectsSupervisors = await Supervisor.aggregate([
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "userData",
        },
      },
      {
        $match: {
          "userData.isActive": true,
          department: "subjects",
        },
      },
      {
        $count: "total",
      },
    ]).then((result) => result[0]?.total || 0);

    const totalSubjectsStaff = subjectsTeachers + subjectsSupervisors;

    const activeSubjectsByType = await Student.aggregate([
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "userData",
        },
      },
      {
        $match: {
          "userData.isActive": true,
        },
      },
      {
        $unwind: {
          path: "$subjectStatus",
          preserveNullAndEmptyArrays: false,
        },
      },
      {
        $match: {
          "subjectStatus.isActive": true,
        },
      },
      {
        $lookup: {
          from: "subjects",
          localField: "subjectStatus.subject",
          foreignField: "_id",
          as: "subjectInfo",
        },
      },
      {
        $unwind: "$subjectInfo",
      },
      {
        $group: {
          _id: "$subjectInfo.type",
          count: { $sum: 1 },
        },
      },
    ]);

    const quranSubjects =
      activeSubjectsByType.find((s) => s._id === "quran")?.count || 0;
    const academicSubjects =
      activeSubjectsByType.find((s) => s._id === "subjects")?.count || 0;

    res.status(200).json({
      success: true,
      stats: {
        students: {
          total: totalStudents,
          regular: regularStudents,
          freeze: freezeStudents,
          trial: trialStudents,
          drop: dropStudents,
          completed: completedStudents,
        },
        activeSubjects: {
          total: totalActiveSubjects,
          regular: regularActiveSubjects,
          freeze: freezeActiveSubjects,
          trial: trialActiveSubjects,
          drop: dropActiveSubjects,
          completed: completedActiveSubjects,
          byType: {
            quran: quranSubjects,
            subjects: academicSubjects,
          },
        },
        subjects: {
          total: totalActiveSubjects,
          regular: regularActiveSubjects,
          freeze: freezeActiveSubjects,
          trial: trialActiveSubjects,
          drop: dropActiveSubjects,
          completed: completedActiveSubjects,
        },
        quranDepartment: {
          total: totalQuranStaff,
          teachers: quranTeachers,
          supervisors: quranSupervisors,
        },
        subjectsDepartment: {
          total: totalSubjectsStaff,
          teachers: subjectsTeachers,
          supervisors: subjectsSupervisors,
        },
        totalStaff: totalQuranStaff + totalSubjectsStaff,
        metadata: {
          generatedAt: new Date().toISOString(),
          generatedBy: "hammas-coding",
          dataType: "activeSubjectsOnly",
          note: "Only counting subjects with isActive: true in subjectStatus",
        },
      },
    });
  } catch (error) {
    console.error("Error in getDashboardStats:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching dashboard statistics",
      error: error.message,
    });
  }
};
exports.deactivateStudentSubject = async (req, res) => {
  try {
    const { studentId, subjectId } = req.params;
    const { reason } = req.body || {};
    const deactivatedById = req.user.id;
    const currentTime = new Date("2025-06-02 04:54:47");

    if (!studentId || !subjectId) {
      return res.status(400).json({
        success: false,
        message: "Student ID and Subject ID are required",
      });
    }

    if (
      !mongoose.Types.ObjectId.isValid(studentId) ||
      !mongoose.Types.ObjectId.isValid(subjectId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid Student ID or Subject ID format",
      });
    }

    const student = await Student.findOne({ user: studentId })
      .populate("user", "name")
      .populate("subjects", "name")
      .populate("assignedTeachers.teacher._id", "name")
      .populate("assignedTeachers.subject._id", "name");

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    const hasSubject = student.subjects.some(
      (subject) => subject._id.toString() === subjectId.toString()
    );

    if (!hasSubject) {
      return res.status(400).json({
        success: false,
        message: "Subject not assigned to this student",
      });
    }

    const deactivationDate = new Date(currentTime);

    const existingStatusIndex = student.subjectStatus.findIndex(
      (status) => status.subject.toString() === subjectId.toString()
    );

    if (existingStatusIndex >= 0) {
      const existingStatus = student.subjectStatus[existingStatusIndex];

      if (!existingStatus.isActive) {
        return res.status(400).json({
          success: false,
          message: "Subject is already inactive for this student",
        });
      }

      existingStatus.deactivationHistory.push({
        deactivatedAt: deactivationDate,
        deactivatedBy: deactivatedById,
        reason: reason || "No reason provided",
      });

      existingStatus.isActive = false;
      existingStatus.currentStatus.lastDeactivatedAt = deactivationDate;
      existingStatus.currentStatus.lastDeactivatedBy = deactivatedById;

      student.subjectStatus[existingStatusIndex] = existingStatus;
    } else {
      student.subjectStatus.push({
        subject: subjectId,
        isActive: false,
        activationHistory: [],
        deactivationHistory: [
          {
            deactivatedAt: deactivationDate,
            deactivatedBy: deactivatedById,
            reason: reason || "No reason provided",
          },
        ],
        currentStatus: {
          lastActivatedAt: null,
          lastActivatedBy: null,
          lastDeactivatedAt: deactivationDate,
          lastDeactivatedBy: deactivatedById,
        },
      });
    }

    await student.save();

    let assignedTeacher = null;
    let teacherInfo = null;
    let schedulesUpdated = 0;
    let classesDeleted = 0;

    assignedTeacher = student.assignedTeachers.find(
      (assignment) =>
        assignment.subject?._id?.toString() === subjectId.toString()
    );

    const allSchedulesForStudent = await Schedule.find({
      students: { $in: [studentId] },
      subject: subjectId,
    });

    let allMatchingSchedules = [];

    if (assignedTeacher) {
      teacherInfo = {
        id: assignedTeacher.teacher._id,
        name: assignedTeacher.teacher.name,
      };

      allMatchingSchedules = await Schedule.find({
        students: { $in: [studentId] },
        subject: subjectId,
        teacherId: assignedTeacher.teacher._id,
        isRecurring: true,
        status: { $in: ["scheduled", "rescheduled"] },
      });
    } else {
      allMatchingSchedules = await Schedule.find({
        students: { $in: [studentId] },
        subject: subjectId,
        isRecurring: true,
        status: { $in: ["scheduled", "rescheduled"] },
      });

      if (allMatchingSchedules.length > 0) {
        const firstSchedule = allMatchingSchedules[0];
        teacherInfo = {
          id: firstSchedule.teacherId,
          name: firstSchedule.teacherName,
        };
      }
    }

    for (const schedule of allMatchingSchedules) {
      await Schedule.findByIdAndUpdate(schedule._id, {
        $set: {
          isRecurring: false,
          updatedBy: deactivatedById,
        },
      });
      schedulesUpdated++;
      const mostRecentClass = await Schedule.findOne({
        $or: [{ recurrenceParentId: schedule._id }, { _id: schedule._id }],
        students: { $in: [studentId] },
        subject: subjectId,
        teacherId: schedule.teacherId,
        classDate: { $gte: currentTime },
        status: "scheduled",
      })
        .sort({ classDate: -1 })
        .limit(1);

      if (mostRecentClass) {
        if (shouldDeleteClass(mostRecentClass, currentTime)) {
          await Schedule.findByIdAndDelete(mostRecentClass._id);
          classesDeleted++;
        }
      }
    }

    return res.status(200).json({
      success: true,
      message: teacherInfo
        ? "Student deactivated from subject successfully with schedule updates"
        : "Student deactivated from subject successfully (no teacher/schedules found)",
      data: {
        student: {
          id: student.user._id,
          name: student.user.name,
          studentId: student.studentId,
        },
        subject: student.subjects.find(
          (s) => s._id.toString() === subjectId.toString()
        ),
        teacher: teacherInfo,
        deactivationDetails: {
          deactivatedAt: deactivationDate,
          deactivatedBy: deactivatedById,
          reason: reason || "No reason provided",
        },
        scheduleUpdates: {
          teacherAssigned: !!assignedTeacher,
          teacherFoundInSchedule: !!teacherInfo,
          schedulesUpdated,
          classesDeleted,
          totalSchedulesFound: allSchedulesForStudent.length,
        },
      },
    });
  } catch (error) {
    console.error("❌ Error deactivating student from subject:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while deactivating student from subject",
      error: error.message,
    });
  }
};

exports.reactivateStudentSubject = async (req, res) => {
  try {
    const { studentId, subjectId } = req.params;
    const { reason } = req.body || {};
    const activatedById = req.user.id;
    const currentTime = new Date("2025-06-02 04:40:51");

    if (!studentId || !subjectId) {
      return res.status(400).json({
        success: false,
        message: "Student ID and Subject ID are required",
      });
    }

    if (
      !mongoose.Types.ObjectId.isValid(studentId) ||
      !mongoose.Types.ObjectId.isValid(subjectId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid Student ID or Subject ID format",
      });
    }

    const student = await Student.findOne({ user: studentId })
      .populate("user", "name")
      .populate("subjects", "name type")
      .populate("assignedTeachers.teacher._id", "name")
      .populate("assignedTeachers.subject._id", "name");

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    const hasSubject = student.subjects.some(
      (subject) => subject._id.toString() === subjectId.toString()
    );

    if (!hasSubject) {
      return res.status(400).json({
        success: false,
        message: "Subject not assigned to this student",
      });
    }

    const activationDate = new Date(currentTime);

    const existingStatusIndex = student.subjectStatus.findIndex(
      (status) => status.subject.toString() === subjectId.toString()
    );

    if (existingStatusIndex >= 0) {
      const existingStatus = student.subjectStatus[existingStatusIndex];

      if (existingStatus.isActive) {
        return res.status(400).json({
          success: false,
          message: "Subject is already active for this student",
        });
      }

      existingStatus.activationHistory.push({
        activatedAt: activationDate,
        activatedBy: activatedById,
        reason: reason || "Reactivated",
      });

      existingStatus.isActive = true;
      existingStatus.currentStatus.lastActivatedAt = activationDate;
      existingStatus.currentStatus.lastActivatedBy = activatedById;

      student.subjectStatus[existingStatusIndex] = existingStatus;
    } else {
      student.subjectStatus.push({
        subject: subjectId,
        isActive: true,
        activationHistory: [
          {
            activatedAt: activationDate,
            activatedBy: activatedById,
            reason: reason || "Initial activation",
          },
        ],
        deactivationHistory: [],
        currentStatus: {
          lastActivatedAt: activationDate,
          lastActivatedBy: activatedById,
          lastDeactivatedAt: null,
          lastDeactivatedBy: null,
        },
      });
    }

    await student.save();

    const assignedTeacher = student.assignedTeachers.find(
      (assignment) => assignment.subject._id.toString() === subjectId.toString()
    );

    let scheduleCreated = false;
    let newScheduleDetails = null;
    let reactivatedExisting = false;
    let teacherInfo = null;
    let existingSchedule = null;

    if (assignedTeacher) {
      teacherInfo = {
        id: assignedTeacher.teacher._id,
        name: assignedTeacher.teacher.name,
      };

      existingSchedule = await Schedule.findOne({
        students: { $in: [studentId] },
        teacherId: assignedTeacher.teacher._id,
        subject: subjectId,
        $or: [{ isRecurring: false }, { isRecurring: true }],
      })
        .sort({ updatedAt: -1 })
        .limit(1);
    } else {
      existingSchedule = await Schedule.findOne({
        students: { $in: [studentId] },
        subject: subjectId,
        $or: [{ isRecurring: false }, { isRecurring: true }],
      })
        .sort({ updatedAt: -1 })
        .limit(1);

      if (existingSchedule) {
        teacherInfo = {
          id: existingSchedule.teacherId,
          name: existingSchedule.teacherName,
        };
      }
    }

    if (existingSchedule) {
      if (!existingSchedule.isRecurring) {
        await Schedule.findByIdAndUpdate(existingSchedule._id, {
          $set: {
            isRecurring: true,
            updatedBy: activatedById,
          },
        });
        reactivatedExisting = true;
      }

      let nextScheduleFound = false;
      const nextDate = new Date(existingSchedule.classDate);

      if (existingSchedule.recurrencePattern === "weekdays") {
        nextDate.setDate(nextDate.getDate() + 1);
        if (nextDate.getDay() === 6) {
          nextDate.setDate(nextDate.getDate() + 2);
        } else if (nextDate.getDay() === 0) {
          nextDate.setDate(nextDate.getDate() + 1);
        }
        nextScheduleFound = true;
      } else if (
        existingSchedule.recurrencePattern === "custom" &&
        existingSchedule.customDays?.length > 0
      ) {
        const daysMap = {
          Sunday: 0,
          Monday: 1,
          Tuesday: 2,
          Wednesday: 3,
          Thursday: 4,
          Friday: 5,
          Saturday: 6,
        };

        const customDayNumbers = existingSchedule.customDays
          .map((day) => daysMap[day])
          .sort();

        let daysToAdd = 1;
        while (!nextScheduleFound && daysToAdd < 8) {
          const checkDate = new Date(nextDate);
          checkDate.setDate(checkDate.getDate() + daysToAdd);
          const checkDay = checkDate.getDay();

          if (customDayNumbers.includes(checkDay)) {
            nextDate.setDate(nextDate.getDate() + daysToAdd);
            nextScheduleFound = true;
            break;
          }
          daysToAdd++;
        }
      } else if (existingSchedule.recurrencePattern === "weekly") {
        nextDate.setDate(nextDate.getDate() + 7);
        nextScheduleFound = true;
      }

      if (nextScheduleFound) {
        const duplicateSchedule = await Schedule.findOne({
          students: { $in: [studentId] },
          teacherId: existingSchedule.teacherId,
          classDate: nextDate,
          startTime: existingSchedule.startTime,
          endTime: existingSchedule.endTime,
        });

        if (!duplicateSchedule) {
          const newSchedule = new Schedule({
            students: [studentId],
            studentNames: [student.user.name],
            teacher: existingSchedule.teacher,
            teacherId: existingSchedule.teacherId,
            teacherName: existingSchedule.teacherName,
            subject: existingSchedule.subject,
            subjectName: existingSchedule.subjectName,
            subjectType: existingSchedule.subjectType,
            day: [
              "Sunday",
              "Monday",
              "Tuesday",
              "Wednesday",
              "Thursday",
              "Friday",
              "Saturday",
            ][nextDate.getDay()],
            startTime: existingSchedule.startTime,
            endTime: existingSchedule.endTime,
            classDate: nextDate,
            status: "scheduled",
            sessionStatus: "pending",
            isRecurring: true,
            recurrencePattern: existingSchedule.recurrencePattern,
            customDays: existingSchedule.customDays,
            recurrenceParentId:
              existingSchedule.recurrenceParentId || existingSchedule._id,
            scheduledDuration: existingSchedule.scheduledDuration,
            createdBy: existingSchedule.createdBy,
            updatedBy: activatedById,
          });

          await newSchedule.save();
          scheduleCreated = true;

          newScheduleDetails = {
            scheduleId: newSchedule._id,
            classDate: nextDate,
            startTime: newSchedule.startTime,
            endTime: newSchedule.endTime,
            day: newSchedule.day,
            teacherName: newSchedule.teacherName,
            subjectName: newSchedule.subjectName,
            recurrencePattern: newSchedule.recurrencePattern,
            customDays: newSchedule.customDays,
            isRecurring: newSchedule.isRecurring,
            scheduledDuration: newSchedule.scheduledDuration,
          };
        } else {
        }
      }
    } else {
    }

    return res.status(200).json({
      success: true,
      message: getReactivationMessage(
        reactivatedExisting,
        scheduleCreated,
        !!teacherInfo
      ),
      data: {
        student: {
          id: student.user._id,
          name: student.user.name,
          studentId: student.studentId,
        },
        subject: student.subjects.find(
          (s) => s._id.toString() === subjectId.toString()
        ),
        teacher: teacherInfo,
        activationDetails: {
          activatedAt: activationDate,
          activatedBy: activatedById,
          reason: reason || "Reactivated",
        },
        scheduleDetails: {
          teacherAssigned: !!assignedTeacher,
          teacherFound: !!teacherInfo,
          reactivatedExisting,
          scheduleCreated,
          newSchedule: newScheduleDetails,
        },
      },
    });
  } catch (error) {
    console.error("❌ Error reactivating student for subject:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while reactivating student for subject",
      error: error.message,
    });
  }
};

exports.getStudentSubjectHistory = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { subjectId } = req.query;

    if (!studentId) {
      return res.status(400).json({
        success: false,
        message: "Student ID is required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Student ID format",
      });
    }

    if (subjectId && !mongoose.Types.ObjectId.isValid(subjectId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Subject ID format",
      });
    }

    const student = await Student.findOne({ user: studentId })
      .populate("user", "name")
      .populate("subjects", "name")
      .populate("subjectStatus.subject", "name")
      .populate("subjectStatus.activationHistory.activatedBy", "name")
      .populate("subjectStatus.deactivationHistory.deactivatedBy", "name")
      .populate("subjectStatus.currentStatus.lastActivatedBy", "name")
      .populate("subjectStatus.currentStatus.lastDeactivatedBy", "name");

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    let subjectStatuses = student.subjectStatus;

    if (subjectId) {
      subjectStatuses = subjectStatuses.filter(
        (status) => status.subject._id.toString() === subjectId.toString()
      );
    }

    const history = subjectStatuses.map((status) => {
      const allEvents = [];

      status.activationHistory.forEach((activation) => {
        allEvents.push({
          type: "activation",
          date: activation.activatedAt,
          user: activation.activatedBy,
          reason: activation.reason,
        });
      });

      status.deactivationHistory.forEach((deactivation) => {
        allEvents.push({
          type: "deactivation",
          date: deactivation.deactivatedAt,
          user: deactivation.deactivatedBy,
          reason: deactivation.reason,
        });
      });

      allEvents.sort((a, b) => new Date(a.date) - new Date(b.date));

      return {
        subject: status.subject,
        isActive: status.isActive,
        currentStatus: status.currentStatus,
        totalActivations: status.activationHistory.length,
        totalDeactivations: status.deactivationHistory.length,
        chronologicalHistory: allEvents,
        activationHistory: status.activationHistory,
        deactivationHistory: status.deactivationHistory,
      };
    });

    return res.status(200).json({
      success: true,
      message: "Subject history retrieved successfully",
      data: {
        student: {
          id: student.user._id,
          name: student.user.name,
          studentId: student.studentId,
        },
        subjectHistory: history,
      },
    });
  } catch (error) {
    console.error("❌ Error getting subject history:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while getting subject history",
      error: error.message,
    });
  }
};

exports.getActiveSubjects = async (req, res) => {
  try {
    const { studentId } = req.params;

    if (!studentId) {
      return res.status(400).json({
        success: false,
        message: "Student ID is required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Student ID format",
      });
    }

    const student = await Student.findOne({ user: studentId })
      .populate("user", "name")
      .populate("subjects", "name type");

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    const activeSubjects = [];

    for (const subject of student.subjects) {
      const statusEntry = student.subjectStatus.find(
        (status) => status.subject.toString() === subject._id.toString()
      );

      if (!statusEntry || statusEntry.isActive) {
        activeSubjects.push(subject);
      }
    }

    return res.status(200).json({
      success: true,
      message: "Active subjects retrieved successfully",
      data: {
        student: {
          id: student.user._id,
          name: student.user.name,
          studentId: student.studentId,
        },
        activeSubjects: activeSubjects,
        totalActiveSubjects: activeSubjects.length,
      },
    });
  } catch (error) {
    console.error("❌ Error getting active subjects:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while getting active subjects",
      error: error.message,
    });
  }
};

function getReactivationMessage(
  reactivatedExisting,
  scheduleCreated,
  teacherFound
) {
  if (!teacherFound) {
    return "Student reactivated for subject successfully (no teacher/schedules found)";
  }

  if (reactivatedExisting && scheduleCreated) {
    return "Student reactivated for subject, existing schedule reactivated, and next class scheduled successfully";
  } else if (reactivatedExisting) {
    return "Student reactivated for subject and existing schedule reactivated successfully";
  } else if (scheduleCreated) {
    return "Student reactivated for subject and new schedule created successfully";
  } else {
    return "Student reactivated for subject successfully";
  }
}

exports.getStudentSubjectHistory = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { subjectId } = req.query;

    if (!studentId) {
      return res.status(400).json({
        success: false,
        message: "Student ID is required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Student ID format",
      });
    }

    if (subjectId && !mongoose.Types.ObjectId.isValid(subjectId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Subject ID format",
      });
    }

    const student = await Student.findOne({ user: studentId })
      .populate("user", "name")
      .populate("subjects", "name")
      .populate("subjectStatus.subject", "name")
      .populate("subjectStatus.activationHistory.activatedBy", "name")
      .populate("subjectStatus.deactivationHistory.deactivatedBy", "name")
      .populate("subjectStatus.currentStatus.lastActivatedBy", "name")
      .populate("subjectStatus.currentStatus.lastDeactivatedBy", "name");

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    let subjectStatuses = student.subjectStatus;

    if (subjectId) {
      subjectStatuses = subjectStatuses.filter(
        (status) => status.subject._id.toString() === subjectId.toString()
      );
    }

    const history = subjectStatuses.map((status) => {
      const allEvents = [];

      status.activationHistory.forEach((activation) => {
        allEvents.push({
          type: "activation",
          date: activation.activatedAt,
          user: activation.activatedBy,
          reason: activation.reason,
        });
      });

      status.deactivationHistory.forEach((deactivation) => {
        allEvents.push({
          type: "deactivation",
          date: deactivation.deactivatedAt,
          user: deactivation.deactivatedBy,
          reason: deactivation.reason,
        });
      });

      allEvents.sort((a, b) => new Date(a.date) - new Date(b.date));

      return {
        subject: status.subject,
        isActive: status.isActive,
        currentStatus: status.currentStatus,
        totalActivations: status.activationHistory.length,
        totalDeactivations: status.deactivationHistory.length,
        chronologicalHistory: allEvents,
        activationHistory: status.activationHistory,
        deactivationHistory: status.deactivationHistory,
      };
    });

    return res.status(200).json({
      success: true,
      message: "Subject history retrieved successfully",
      data: {
        student: {
          id: student.user._id,
          name: student.user.name,
          studentId: student.studentId,
        },
        subjectHistory: history,
      },
    });
  } catch (error) {
    console.error("❌ Error getting subject history:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while getting subject history",
      error: error.message,
    });
  }
};

exports.getActiveSubjects = async (req, res) => {
  try {
    const { studentId } = req.params;

    if (!studentId) {
      return res.status(400).json({
        success: false,
        message: "Student ID is required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Student ID format",
      });
    }

    const student = await Student.findOne({ user: studentId })
      .populate("user", "name")
      .populate("subjects", "name type");

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    const activeSubjects = [];

    for (const subject of student.subjects) {
      const statusEntry = student.subjectStatus.find(
        (status) => status.subject.toString() === subject._id.toString()
      );

      if (!statusEntry || statusEntry.isActive) {
        activeSubjects.push(subject);
      }
    }

    return res.status(200).json({
      success: true,
      message: "Active subjects retrieved successfully",
      data: {
        student: {
          id: student.user._id,
          name: student.user.name,
          studentId: student.studentId,
        },
        activeSubjects: activeSubjects,
        totalActiveSubjects: activeSubjects.length,
      },
    });
  } catch (error) {
    console.error("❌ Error getting active subjects:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while getting active subjects",
      error: error.message,
    });
  }
};

exports.toggleTeacherStatus = async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      msg: "Access denied. Admins only.",
    });
  }

  const { teacherId } = req.params;
  const { isActive, reason } = req.body;

  try {
    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        success: false,
        msg: "isActive must be a boolean value (true or false)",
      });
    }

    const teacherUser = await User.findById(teacherId);
    if (!teacherUser) {
      return res.status(404).json({
        success: false,
        msg: "Teacher not found",
      });
    }

    if (!["teacher_quran", "teacher_subjects"].includes(teacherUser.role)) {
      return res.status(400).json({
        success: false,
        msg: "User is not a teacher",
      });
    }

    const teacherProfile = await Teacher.findOne({ user: teacherId });
    if (!teacherProfile) {
      return res.status(404).json({
        success: false,
        msg: "Teacher profile not found",
      });
    }

    if (teacherUser.isActive === isActive) {
      return res.status(400).json({
        success: false,
        msg: `Teacher is already ${isActive ? "active" : "inactive"}`,
      });
    }
    teacherUser.isActive = isActive;
    teacherUser.updatedAt = new Date();
    if (!isActive) {
      teacherUser.forceLogout = true;
      teacherUser.sessionInvalidated = true;
      teacherUser.lastLogoutReason =
        reason || "Account deactivated by administrator";
      teacherUser.logoutTimestamp = new Date();
      teacherUser.portalAccess = false;
      teacherUser.lastDeactivatedAt = new Date();
      teacherUser.deactivatedBy = req.user.id;
      teacherUser.deactivationReason = reason || "Teacher deactivated by admin";
    } else {
      teacherUser.forceLogout = false;
      teacherUser.sessionInvalidated = false;
      teacherUser.portalAccess = true;
      teacherUser.lastActivatedAt = new Date();
      teacherUser.activatedBy = req.user.id;
      teacherUser.activationReason = reason || "Teacher activated by admin";
    }
    await teacherUser.save();
    teacherProfile.isActive = isActive;
    await teacherProfile.save();
    let scheduleUpdateResult;

    if (!isActive) {
      const schedules = await Schedule.find({ teacherId: teacherId });
      let updatedCount = 0;

      for (const schedule of schedules) {
        if (!schedule.teacherName.includes("(Inactive Teacher)")) {
          await Schedule.findByIdAndUpdate(schedule._id, {
            $set: {
              teacherId: null,
              teacherName: `${teacherUser.name} (Inactive Teacher)`,
              updatedAt: new Date("2025-06-16T07:16:48Z"),
            },
          });
          updatedCount++;
        }
      }

      scheduleUpdateResult = {
        totalFound: schedules.length,
        updatedCount: updatedCount,
      };
    } else {
      const schedules = await Schedule.find({
        teacherName: {
          $regex: new RegExp(`${teacherUser.name} \\(Inactive Teacher\\)`),
        },
        teacherId: null,
      });
      let updatedCount = 0;

      for (const schedule of schedules) {
        const cleanedName = schedule.teacherName.replace(
          " (Inactive Teacher)",
          ""
        );

        await Schedule.findByIdAndUpdate(schedule._id, {
          $set: {
            teacherId: teacherId,
            teacherName: cleanedName,
            updatedAt: new Date(),
          },
        });
        updatedCount++;
      }

      scheduleUpdateResult = {
        totalFound: schedules.length,
        updatedCount: updatedCount,
      };
    }
    let studentUpdateResult;

    if (!isActive) {
      const students = await Student.find({
        "assignedTeachers.teacher._id": teacherId,
      });

      let updatedStudents = 0;
      let updatedAssignments = 0;

      for (const student of students) {
        let studentUpdated = false;

        for (const assignment of student.assignedTeachers) {
          if (
            assignment.teacher._id.toString() === teacherId &&
            !assignment.teacher.name.includes("(Inactive Teacher)")
          ) {
            assignment.teacher.name = `${teacherUser.name} (Inactive Teacher)`;
            assignment.isTemporary = true;
            assignment.endDate = new Date();
            updatedAssignments++;
            studentUpdated = true;
          }
        }

        if (studentUpdated) {
          await student.save();
          updatedStudents++;
        }
      }

      studentUpdateResult = {
        totalStudentsFound: students.length,
        updatedStudents: updatedStudents,
        updatedAssignments: updatedAssignments,
      };
    } else {
      const students = await Student.find({
        "assignedTeachers.teacher.name": {
          $regex: new RegExp(`${teacherUser.name} \\(Inactive Teacher\\)`),
        },
      });

      let updatedStudents = 0;
      let updatedAssignments = 0;

      for (const student of students) {
        let studentUpdated = false;

        for (const assignment of student.assignedTeachers) {
          if (
            assignment.teacher.name.includes(
              `${teacherUser.name} (Inactive Teacher)`
            )
          ) {
            assignment.teacher._id = teacherId;
            assignment.teacher.name = teacherUser.name;
            assignment.isTemporary = false;
            assignment.endDate = undefined;
            updatedAssignments++;
            studentUpdated = true;
          }
        }

        if (studentUpdated) {
          await student.save();
          updatedStudents++;
        }
      }

      studentUpdateResult = {
        totalStudentsFound: students.length,
        updatedStudents: updatedStudents,
        updatedAssignments: updatedAssignments,
      };
    }

    return res.status(200).json({
      success: true,
      msg: `Teacher ${isActive ? "activated" : "deactivated"} successfully`,
      data: {
        teacher: {
          id: teacherUser._id,
          name: teacherUser.name,
          email: teacherUser.email,
          role: teacherUser.role,
          isActive: teacherUser.isActive,
          portalAccess: teacherUser.portalAccess,
          forceLogout: teacherUser.forceLogout,
          updatedAt: teacherUser.updatedAt,
        },
        profile: {
          id: teacherProfile._id,
          department: teacherProfile.department,
          isActive: teacherProfile.isActive,
        },
        scheduleUpdates: {
          totalSchedulesFound: scheduleUpdateResult.totalFound,
          schedulesUpdated: scheduleUpdateResult.updatedCount,
          statusChange: isActive ? "activated" : "deactivated",
          teacherIdUpdate: !isActive ? "set to null" : "restored",
          reason: reason || "No reason provided",
        },
        studentUpdates: {
          totalStudentsFound: studentUpdateResult.totalStudentsFound,
          studentsUpdated: studentUpdateResult.updatedStudents,
          assignmentsUpdated: studentUpdateResult.updatedAssignments,
          statusChange: isActive
            ? "teacher restored in assignments"
            : "teacher marked inactive in assignments",
        },
        portalAccess: {
          status: isActive ? "enabled" : "disabled",
          message: isActive
            ? "Teacher can now login to portal"
            : "Teacher portal access blocked and force logged out",
        },
        sessionStatus: {
          forceLogout: !isActive,
          message: !isActive
            ? "Teacher will be automatically logged out"
            : "Normal session access restored",
        },
        updatedBy: {
          id: req.user.id,
          name: req.user.name,
          login: "hammas-coding",
        },
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("❌ Error in toggleTeacherStatus:", error);
    return res.status(500).json({
      success: false,
      msg: "Server error while updating teacher status",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

exports.toggleSupervisorStatus = async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      msg: "Access denied. Admins only.",
    });
  }
  const { supervisorId } = req.params;
  const { isActive, reason } = req.body;

  try {
    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        success: false,
        msg: "isActive must be a boolean value (true or false)",
      });
    }

    const supervisorUser = await User.findById(supervisorId);
    if (!supervisorUser) {
      return res.status(404).json({
        success: false,
        msg: "Supervisor not found",
      });
    }

    if (
      !["supervisor_quran", "supervisor_subjects"].includes(supervisorUser.role)
    ) {
      return res.status(400).json({
        success: false,
        msg: "User is not a supervisor",
      });
    }

    const supervisorProfile = await Supervisor.findOne({ user: supervisorId });
    if (!supervisorProfile) {
      return res.status(404).json({
        success: false,
        msg: "Supervisor profile not found",
      });
    }

    if (supervisorUser.isActive === isActive) {
      return res.status(400).json({
        success: false,
        msg: `Supervisor is already ${isActive ? "active" : "inactive"}`,
      });
    }
    supervisorUser.isActive = isActive;
    supervisorUser.updatedAt = new Date("2025-06-16T10:08:00Z");
    if (!isActive) {
      supervisorUser.forceLogout = true;
      supervisorUser.sessionInvalidated = true;
      supervisorUser.lastLogoutReason =
        reason || "Account deactivated by administrator";
      supervisorUser.logoutTimestamp = new Date("2025-06-16T10:08:00Z");
      supervisorUser.portalAccess = false;
      supervisorUser.lastDeactivatedAt = new Date("2025-06-16T10:08:00Z");
      supervisorUser.deactivatedBy = req.user.id;
      supervisorUser.deactivationReason =
        reason || "Supervisor deactivated by admin";
    } else {
      supervisorUser.forceLogout = false;
      supervisorUser.sessionInvalidated = false;
      supervisorUser.portalAccess = true;
      supervisorUser.lastActivatedAt = new Date("2025-06-16T10:08:00Z");
      supervisorUser.activatedBy = req.user.id;
      supervisorUser.activationReason =
        reason || "Supervisor activated by admin";
    }

    await supervisorUser.save();

    supervisorProfile.isActive = isActive;
    await supervisorProfile.save();
    let managerUpdateResult;

    if (!isActive) {
      const managedTeachers = await Teacher.find({ manager: supervisorId });
      let updatedTeachersCount = 0;

      for (const teacher of managedTeachers) {
        await Teacher.findByIdAndUpdate(teacher._id, {
          $unset: {
            manager: 1,
            managerName: 1,
          },
          $set: {
            updatedAt: new Date("2025-06-16T10:08:00Z"),
          },
        });
        updatedTeachersCount++;
      }

      managerUpdateResult = {
        totalManagedTeachers: managedTeachers.length,
        updatedTeachersCount: updatedTeachersCount,
        action: "cleared_manager_fields",
      };
    } else {
      const previouslyManagedTeachers = await Teacher.find({
        $and: [
          { manager: { $exists: false } },
          { managerName: { $exists: false } },
        ],
      });

      managerUpdateResult = {
        totalManagedTeachers: 0,
        updatedTeachersCount: 0,
        action: "supervisor_reactivated",
        note: "Teachers with cleared manager fields need to be manually reassigned",
        teachersNeedingReassignment: previouslyManagedTeachers.length,
      };
    }

    return res.status(200).json({
      success: true,
      msg: `Supervisor ${isActive ? "activated" : "deactivated"} successfully`,
      data: {
        supervisor: {
          id: supervisorUser._id,
          name: supervisorUser.name,
          email: supervisorUser.email,
          role: supervisorUser.role,
          isActive: supervisorUser.isActive,
          portalAccess: supervisorUser.portalAccess,
          forceLogout: supervisorUser.forceLogout,
          updatedAt: "2025-06-16 10:08:00",
        },
        profile: {
          id: supervisorProfile._id,
          department: supervisorProfile.department,
          isActive: supervisorProfile.isActive,
        },
        managerRelationshipUpdates: {
          totalTeachersAffected: managerUpdateResult.totalManagedTeachers,
          teachersUpdated: managerUpdateResult.updatedTeachersCount,
          action: managerUpdateResult.action,
          statusChange: isActive ? "activated" : "deactivated",
          reason: reason || "No reason provided",
          note:
            managerUpdateResult.note ||
            `${
              isActive
                ? "Supervisor reactivated"
                : "Manager fields cleared for all managed teachers"
            }`,
          teachersNeedingReassignment:
            managerUpdateResult.teachersNeedingReassignment || 0,
        },
        portalAccess: {
          status: isActive ? "enabled" : "disabled",
          message: isActive
            ? "Supervisor can now login to portal"
            : "Supervisor portal access blocked and force logged out",
        },
        sessionStatus: {
          forceLogout: !isActive,
          message: !isActive
            ? "Supervisor will be automatically logged out"
            : "Normal session access restored",
        },
        updatedBy: {
          id: req.user.id,
          name: req.user.name,
          login: "hammas-coding",
        },
        timestamp: "2025-06-16 10:08:00",
      },
    });
  } catch (error) {
    console.error("❌ Error in toggleSupervisorStatus:", error);
    return res.status(500).json({
      success: false,
      msg: "Server error while updating supervisor status",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

exports.getTeachersWithoutManagers = async (req, res) => {
  try {
    const teachersWithoutManagers = await Teacher.find({
      $or: [
        { manager: { $exists: false } },
        { manager: null },
        { managerName: { $exists: false } },
        { managerName: null },
        { managerName: "" },
      ],
    }).populate("user", "name email staffId role isActive");

    const allTeachers = await Teacher.find().populate(
      "user",
      "name email staffId role isActive"
    );
    const validManagerIds = await User.find({
      role: { $in: ["admin", "supervisor_quran", "supervisor_subjects"] },
      isActive: true,
    }).distinct("_id");

    const teachersWithInvalidManagers = allTeachers.filter(
      (teacher) =>
        teacher.manager &&
        !validManagerIds.some(
          (id) => id.toString() === teacher.manager.toString()
        )
    );

    const allTeachersWithoutValidManagers = [
      ...teachersWithoutManagers,
      ...teachersWithInvalidManagers,
    ].filter(
      (teacher, index, self) =>
        index ===
        self.findIndex((t) => t._id.toString() === teacher._id.toString())
    );

    const formattedTeachers = allTeachersWithoutValidManagers.map(
      (teacher) => ({
        _id: teacher._id,
        teacherId: teacher._id,
        userId: teacher.user._id,
        name: teacher.user.name || teacher.name,
        staffId: teacher.user.staffId,
        email: teacher.user.email,
        role: teacher.user.role,
        department: teacher.department,
        isActive: teacher.user.isActive,
        subjects: teacher.subjects || [],
        currentManager: teacher.manager || null,
        currentManagerName: teacher.managerName || null,
        joiningDate: teacher.joiningDate,
        shift: teacher.shift,
        salary: teacher.salary,
      })
    );

    const quranTeachers = formattedTeachers.filter(
      (teacher) => teacher.department === "quran"
    );
    const subjectTeachers = formattedTeachers.filter(
      (teacher) => teacher.department === "subjects"
    );

    res.status(200).json({
      success: true,
      message: "Teachers without managers retrieved successfully",
      data: {
        totalCount: formattedTeachers.length,
        quranTeachersCount: quranTeachers.length,
        subjectTeachersCount: subjectTeachers.length,
        teachers: formattedTeachers,
        breakdown: {
          quranTeachers,
          subjectTeachers,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching teachers without managers:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching teachers without managers",
      error: error.message,
    });
  }
};

exports.assignManagerToTeachers = async (req, res) => {
  try {
    const { teacherIds, managerId, managerName } = req.body;

    if (!teacherIds || !Array.isArray(teacherIds) || teacherIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Teacher IDs array is required and cannot be empty",
      });
    }

    if (!managerId) {
      return res.status(400).json({
        success: false,
        message: "Manager ID is required",
      });
    }

    const manager = await User.findById(managerId);
    if (!manager) {
      return res.status(404).json({
        success: false,
        message: "Manager not found",
      });
    }

    if (
      !["admin", "supervisor_quran", "supervisor_subjects"].includes(
        manager.role
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Selected user cannot be assigned as manager. Only admins and supervisors can be managers.",
      });
    }

    if (!manager.isActive) {
      return res.status(400).json({
        success: false,
        message: "Cannot assign inactive user as manager",
      });
    }

    const finalManagerName = managerName || manager.name;

    const teachers = await Teacher.find({
      _id: { $in: teacherIds },
    }).populate("user", "name staffId role");

    if (teachers.length !== teacherIds.length) {
      return res.status(404).json({
        success: false,
        message: "One or more teachers not found",
      });
    }

    const incompatibleTeachers = [];
    for (const teacher of teachers) {
      if (
        manager.role === "supervisor_quran" &&
        teacher.department !== "quran"
      ) {
        incompatibleTeachers.push({
          teacherId: teacher._id,
          teacherName: teacher.user.name,
          department: teacher.department,
          reason: "Quran supervisor cannot manage subject teachers",
        });
      } else if (
        manager.role === "supervisor_subjects" &&
        teacher.department !== "subjects"
      ) {
        incompatibleTeachers.push({
          teacherId: teacher._id,
          teacherName: teacher.user.name,
          department: teacher.department,
          reason: "Subject supervisor cannot manage Quran teachers",
        });
      }
    }

    if (incompatibleTeachers.length > 0 && manager.role !== "admin") {
      return res.status(400).json({
        success: false,
        message: "Manager role incompatible with some teachers",
        incompatibleTeachers,
      });
    }

    const updateResult = await Teacher.updateMany(
      { _id: { $in: teacherIds } },
      {
        $set: {
          manager: managerId,
          managerName: finalManagerName,
          updatedAt: new Date(),
        },
      }
    );

    const updatedTeachers = await Teacher.find({
      _id: { $in: teacherIds },
    })
      .populate("user", "name email staffId role")
      .populate("manager", "name email staffId role");

    const updatedTeachersData = updatedTeachers.map((teacher) => ({
      _id: teacher._id,
      name: teacher.user.name,
      staffId: teacher.user.staffId,
      department: teacher.department,
      manager: {
        _id: teacher.manager._id,
        name: teacher.manager.name,
        staffId: teacher.manager.staffId,
        role: teacher.manager.role,
      },
    }));

    res.status(200).json({
      success: true,
      message: `Successfully assigned manager to ${updateResult.modifiedCount} teacher(s)`,
      data: {
        managerId,
        managerName: finalManagerName,
        managerRole: manager.role,
        teachersUpdated: updateResult.modifiedCount,
        updatedTeachers: updatedTeachersData,
      },
    });
  } catch (error) {
    console.error("Error assigning manager to teachers:", error);
    res.status(500).json({
      success: false,
      message: "Error assigning manager to teachers",
      error: error.message,
    });
  }
};

exports.toggleClientStatus = async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      msg: "Access denied. Admins only.",
    });
  }

  const { clientId } = req.params;
  const { isActive, reason } = req.body;

  try {
    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        success: false,
        msg: "isActive must be a boolean value (true or false)",
      });
    }

    const clientUser = await User.findById(clientId);
    if (!clientUser) {
      return res.status(404).json({
        success: false,
        msg: "Client not found",
      });
    }

    if (clientUser.role !== "client") {
      return res.status(400).json({
        success: false,
        msg: "User is not a client",
      });
    }

    const clientProfile = await Client.findOne({ user: clientId });
    if (!clientProfile) {
      return res.status(404).json({
        success: false,
        msg: "Client profile not found",
      });
    }

    if (clientUser.isActive === isActive) {
      return res.status(400).json({
        success: false,
        msg: `Client is already ${isActive ? "active" : "inactive"}`,
      });
    }

    clientUser.isActive = isActive;
    clientUser.updatedAt = new Date();

    if (!isActive) {
      clientUser.forceLogout = true;
      clientUser.sessionInvalidated = true;
      clientUser.lastLogoutReason =
        reason || "Account deactivated by administrator";
      clientUser.logoutTimestamp = new Date();
      clientUser.portalAccess = false;
      clientUser.lastDeactivatedAt = new Date();
      clientUser.deactivatedBy = req.user.id;
      clientUser.deactivationReason = reason || "Client deactivated by admin";
    } else {
      clientUser.forceLogout = false;
      clientUser.sessionInvalidated = false;
      clientUser.portalAccess = true;
      clientUser.lastActivatedAt = new Date();
      clientUser.activatedBy = req.user.id;
      clientUser.activationReason = reason || "Client activated by admin";
    }

    await clientUser.save();

    const newClientStatus = isActive ? "regular" : "drop";
    const currentDate = new Date();
    clientProfile.status = newClientStatus;
    clientProfile.statusDates[newClientStatus] = {
      date: currentDate,
      addedBy: req.user.id,
    };
    if (!clientProfile.statusDateHistory[newClientStatus]) {
      clientProfile.statusDateHistory[newClientStatus] = [];
    }
    clientProfile.statusDateHistory[newClientStatus].push({
      date: currentDate,
      addedBy: req.user.id,
    });

    await clientProfile.save();

    let scheduleUpdateResult;
    let studentUpdateResult;
    let clientStatusUpdateResult = {
      previousStatus: clientProfile.status,
      newStatus: newClientStatus,
      statusChangeDate: currentDate,
      updatedBy: req.user.id,
    };

    if (!isActive) {
      const clientStudents = await Student.find({ client: clientId });
      const studentUserIds = clientStudents.map((student) => student.user);

      let totalSchedulesFound = 0;
      let recurringSchedulesDisabled = 0;
      let pendingClassesDeleted = 0;
      let mixedSchedulesUpdated = 0;
      let studentsUpdated = 0;
      let studentStatusUpdated = 0;

      if (studentUserIds.length > 0) {
        for (const studentUserId of studentUserIds) {
          const studentUser = await User.findById(studentUserId);
          if (studentUser && !studentUser.name.includes("(Inactive Student)")) {
            await User.findByIdAndUpdate(studentUserId, {
              $set: {
                name: `${studentUser.name} (Inactive Student)`,
                isActive: false,
                portalAccess: false,
                lastDeactivatedAt: new Date(),
                deactivatedBy: req.user.id,
                deactivationReason: `Student deactivated due to client ${clientUser.name} deactivation`,
                updatedAt: new Date(),
              },
            });
            studentsUpdated++;
          }
        }

        for (const student of clientStudents) {
          let studentUpdated = false;
          if (!student.name.includes("(Inactive Student)")) {
            student.name = `${student.name} (Inactive Student)`;
            studentUpdated = true;
          }
          if (student.status !== "drop") {
            student.status = "drop";
            student.statusDates.drop = {
              date: currentDate,
              addedBy: req.user.id,
            };
            if (!student.statusDateHistory.drop) {
              student.statusDateHistory.drop = [];
            }
            student.statusDateHistory.drop.push({
              date: currentDate,
              addedBy: req.user.id,
            });

            studentUpdated = true;
            studentStatusUpdated++;
          }

          if (studentUpdated) {
            student.updatedAt = new Date();
            await student.save();
          }
        }
        const recurringSchedules = await Schedule.find({
          students: { $in: studentUserIds },
          isRecurring: true,
        });

        for (const schedule of recurringSchedules) {
          await Schedule.findByIdAndUpdate(schedule._id, {
            $set: {
              isRecurring: false,
              updatedBy: req.user.id,
              updatedAt: new Date(),
            },
          });
          recurringSchedulesDisabled++;
        }
        const allSchedulesWithClientStudents = await Schedule.find({
          students: { $in: studentUserIds },
        });

        totalSchedulesFound = allSchedulesWithClientStudents.length;

        for (const schedule of allSchedulesWithClientStudents) {
          const clientStudentsInSchedule = schedule.students.filter(
            (studentId) =>
              studentUserIds.some(
                (userId) => userId.toString() === studentId.toString()
              )
          );
          const otherStudentsInSchedule = schedule.students.filter(
            (studentId) =>
              !studentUserIds.some(
                (userId) => userId.toString() === studentId.toString()
              )
          );
          if (
            clientStudentsInSchedule.length > 0 &&
            otherStudentsInSchedule.length > 0
          ) {
            const updatedStudentNames = schedule.studentNames.map(
              (studentName) => {
                const isClientStudent = clientStudents.some(
                  (student) =>
                    student.name === studentName.name ||
                    student.name === studentName ||
                    student.name.replace(" (Inactive Student)", "") ===
                      studentName.name ||
                    student.name.replace(" (Inactive Student)", "") ===
                      studentName
                );

                if (
                  isClientStudent &&
                  !studentName.toString().includes("(Inactive Student)")
                ) {
                  return typeof studentName === "string"
                    ? `${studentName} (Inactive Student)`
                    : {
                        ...studentName,
                        name: `${studentName.name} (Inactive Student)`,
                      };
                }
                return studentName;
              }
            );

            await Schedule.findByIdAndUpdate(schedule._id, {
              $set: {
                studentNames: updatedStudentNames,
                updatedAt: new Date(),
                updatedBy: req.user.id,
              },
            });
            mixedSchedulesUpdated++;
          } else if (
            clientStudentsInSchedule.length > 0 &&
            otherStudentsInSchedule.length === 0
          ) {
            if (
              schedule.sessionStatus === "pending" &&
              new Date(schedule.classDate) >= new Date()
            ) {
              await Schedule.findByIdAndDelete(schedule._id);
              pendingClassesDeleted++;
            }
          }
        }

        for (const student of clientStudents) {
          let studentUpdated = false;

          for (const assignment of student.assignedTeachers) {
            if (!assignment.isTemporary) {
              assignment.isTemporary = true;
              assignment.endDate = new Date();
              studentUpdated = true;
            }
          }

          if (studentUpdated) {
            await student.save();
          }
        }
      }

      scheduleUpdateResult = {
        totalSchedulesFound,
        recurringSchedulesDisabled,
        pendingClassesDeleted,
        mixedSchedulesUpdated,
        studentsAffected: studentUserIds.length,
      };

      studentUpdateResult = {
        totalStudents: clientStudents.length,
        studentsMarkedInactive: studentsUpdated,
        studentStatusUpdated: studentStatusUpdated,
        userSchemaUpdated: studentsUpdated,
        studentSchemaUpdated: clientStudents.length,
      };
    } else {
      const clientStudents = await Student.find({ client: clientId });
      const studentUserIds = clientStudents.map((student) => student.user);

      let schedulesReactivated = 0;
      let mixedSchedulesRestored = 0;
      let studentsReactivated = 0;
      let studentStatusUpdated = 0;

      if (studentUserIds.length > 0) {
        for (const studentUserId of studentUserIds) {
          const studentUser = await User.findById(studentUserId);
          if (studentUser && studentUser.name.includes("(Inactive Student)")) {
            const restoredName = studentUser.name.replace(
              " (Inactive Student)",
              ""
            );
            await User.findByIdAndUpdate(studentUserId, {
              $set: {
                name: restoredName,
                isActive: true,
                portalAccess: true,
                lastActivatedAt: new Date(),
                activatedBy: req.user.id,
                activationReason: `Student reactivated due to client ${clientUser.name} reactivation`,
                updatedAt: new Date(),
              },
            });
            studentsReactivated++;
          }
        }

        for (const student of clientStudents) {
          let studentUpdated = false;
          if (student.name.includes("(Inactive Student)")) {
            student.name = student.name.replace(" (Inactive Student)", "");
            studentUpdated = true;
          }
          if (student.status !== "regular") {
            student.status = "regular";
            student.statusDates.regular = {
              date: currentDate,
              addedBy: req.user.id,
            };
            if (!student.statusDateHistory.regular) {
              student.statusDateHistory.regular = [];
            }
            student.statusDateHistory.regular.push({
              date: currentDate,
              addedBy: req.user.id,
            });

            studentUpdated = true;
            studentStatusUpdated++;
          }

          if (studentUpdated) {
            student.updatedAt = new Date();
            await student.save();
          }
        }
        const inactiveSchedules = await Schedule.find({
          students: { $in: studentUserIds },
          isRecurring: false,
        });

        for (const schedule of inactiveSchedules) {
          await Schedule.findByIdAndUpdate(schedule._id, {
            $set: {
              isRecurring: true,
              updatedBy: req.user.id,
              updatedAt: new Date(),
            },
          });
          schedulesReactivated++;
        }

        const schedulesWithInactiveStudents = await Schedule.find({
          studentNames: { $regex: /\(Inactive Student\)/ },
          students: { $in: studentUserIds },
        });

        for (const schedule of schedulesWithInactiveStudents) {
          const restoredStudentNames = schedule.studentNames.map(
            (studentName) => {
              const nameToCheck =
                typeof studentName === "string"
                  ? studentName
                  : studentName.name;
              const isClientStudent = clientStudents.some(
                (student) =>
                  student.name.replace(" (Inactive Student)", "") ===
                  nameToCheck.replace(" (Inactive Student)", "")
              );

              if (
                isClientStudent &&
                nameToCheck.includes("(Inactive Student)")
              ) {
                if (typeof studentName === "string") {
                  return studentName.replace(" (Inactive Student)", "");
                } else {
                  return {
                    ...studentName,
                    name: studentName.name.replace(" (Inactive Student)", ""),
                  };
                }
              }
              return studentName;
            }
          );

          await Schedule.findByIdAndUpdate(schedule._id, {
            $set: {
              studentNames: restoredStudentNames,
              updatedAt: new Date(),
              updatedBy: req.user.id,
            },
          });
          mixedSchedulesRestored++;
        }

        for (const student of clientStudents) {
          let studentUpdated = false;

          for (const assignment of student.assignedTeachers) {
            if (assignment.isTemporary) {
              assignment.isTemporary = false;
              assignment.endDate = undefined;
              studentUpdated = true;
            }
          }

          if (studentUpdated) {
            await student.save();
          }
        }
      }

      scheduleUpdateResult = {
        schedulesReactivated,
        mixedSchedulesRestored,
        studentsAffected: studentUserIds.length,
      };

      studentUpdateResult = {
        totalStudents: clientStudents.length,
        studentsReactivated: studentsReactivated,
        studentStatusUpdated: studentStatusUpdated,
        userSchemaRestored: studentsReactivated,
        studentSchemaRestored: clientStudents.length,
      };
    }

    return res.status(200).json({
      success: true,
      msg: `Client ${isActive ? "activated" : "deactivated"} successfully`,
      data: {
        client: {
          id: clientUser._id,
          name: clientUser.name,
          email: clientUser.email,
          role: clientUser.role,
          isActive: clientUser.isActive,
          portalAccess: clientUser.portalAccess,
          forceLogout: clientUser.forceLogout,
          updatedAt: clientUser.updatedAt,
        },
        profile: {
          id: clientProfile._id,
          clientId: clientProfile.clientId,
          clientName: clientProfile.clientName,
          numberOfStudents: clientProfile.numberOfStudents,
          status: clientProfile.status,
        },
        clientStatusUpdate: {
          previousStatus: clientStatusUpdateResult.previousStatus,
          newStatus: clientStatusUpdateResult.newStatus,
          statusChangeDate: clientStatusUpdateResult.statusChangeDate,
          message: isActive
            ? "Client status changed from drop to regular"
            : "Client status changed from current status to drop",
        },
        scheduleUpdates: {
          studentsAffected: scheduleUpdateResult.studentsAffected,
          statusChange: isActive ? "activated" : "deactivated",
          reason: reason || "No reason provided",
          ...(isActive
            ? {
                schedulesReactivated: scheduleUpdateResult.schedulesReactivated,
                mixedSchedulesRestored:
                  scheduleUpdateResult.mixedSchedulesRestored,
              }
            : {
                totalSchedulesFound: scheduleUpdateResult.totalSchedulesFound,
                recurringSchedulesDisabled:
                  scheduleUpdateResult.recurringSchedulesDisabled,
                pendingClassesDeleted:
                  scheduleUpdateResult.pendingClassesDeleted,
                mixedSchedulesUpdated:
                  scheduleUpdateResult.mixedSchedulesUpdated,
              }),
        },
        studentUpdates: {
          totalStudents: studentUpdateResult.totalStudents,
          statusChange: isActive
            ? "students reactivated in both User and Student schemas with status changed to regular"
            : "students marked inactive in both User and Student schemas with status changed to drop",
          studentStatusUpdated: studentUpdateResult.studentStatusUpdated,
          ...(isActive
            ? {
                studentsReactivated: studentUpdateResult.studentsReactivated,
                userSchemaRestored: studentUpdateResult.userSchemaRestored,
                studentSchemaRestored:
                  studentUpdateResult.studentSchemaRestored,
              }
            : {
                studentsMarkedInactive:
                  studentUpdateResult.studentsMarkedInactive,
                userSchemaUpdated: studentUpdateResult.userSchemaUpdated,
                studentSchemaUpdated: studentUpdateResult.studentSchemaUpdated,
              }),
        },
        portalAccess: {
          status: isActive ? "enabled" : "disabled",
          message: isActive
            ? "Client and students can now login to portal"
            : "Client and students portal access blocked and force logged out",
        },
        sessionStatus: {
          forceLogout: !isActive,
          message: !isActive
            ? "Client and students will be automatically logged out"
            : "Normal session access restored for client and students",
        },
        updatedBy: {
          id: req.user.id,
          name: req.user.name,
          login: "hammas-coding",
        },
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("❌ Error in toggleClientStatus:", error);
    return res.status(500).json({
      success: false,
      msg: "Server error while updating client status",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
