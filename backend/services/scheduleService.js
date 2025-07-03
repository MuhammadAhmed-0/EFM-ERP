const cron = require("node-cron");
const moment = require("moment-timezone");
const Schedule = require("../models/Schedule");

const TIMEZONE = "Asia/Karachi";

const getMostRecentScheduleData = async (currentSchedule) => {
  try {
    const oneMonthAgo = moment().subtract(1, "month").toDate();

    const recentSchedules = await Schedule.find({
      $or: [
        { _id: currentSchedule.recurrenceParentId || currentSchedule._id },
        {
          recurrenceParentId:
            currentSchedule.recurrenceParentId || currentSchedule._id,
        },
      ],
      students: { $in: currentSchedule.students },
      subject: currentSchedule.subject,
      classDate: { $gte: oneMonthAgo },
    }).sort({ classDate: -1, updatedAt: -1 });

    console.log(
      `📊 Found ${recentSchedules.length} recent schedules in this series`
    );

    let scheduleToUse = null;
    for (const schedule of recentSchedules) {
      if (schedule.rescheduleType === "permanent") {
        scheduleToUse = schedule;
        console.log(`✅ Using permanent change from schedule ${schedule._id}`);
        break;
      }
    }
    if (!scheduleToUse) {
      for (const schedule of recentSchedules) {
        if (
          !schedule.isTemporaryChange &&
          !schedule.isTeacherTemporaryChange &&
          schedule.rescheduleType !== "temporary"
        ) {
          scheduleToUse = schedule;
          console.log(`📋 Using original schedule ${schedule._id}`);
          break;
        }
      }
    }

    if (!scheduleToUse) {
      const parentSchedule = await Schedule.findOne({
        _id: currentSchedule.recurrenceParentId || currentSchedule._id,
      });

      if (parentSchedule) {
        scheduleToUse = parentSchedule;
        console.log(`👆 Using parent schedule ${parentSchedule._id}`);
      } else {
        scheduleToUse = currentSchedule;
        console.log(
          `🔄 Using current schedule ${currentSchedule._id} as fallback`
        );
      }
    }

    return scheduleToUse;
  } catch (error) {
    console.error("Error getting most recent schedule data:", error);
    return currentSchedule;
  }
};

const createNextRecurringSchedule = async (currentSchedule) => {
  try {
    if (!currentSchedule.isRecurring) {
      console.log(
        `⏭️ Schedule ${currentSchedule._id} is not recurring, skipping...`
      );
      return null;
    }

    const nextDate = calculateNextDate(currentSchedule);
    if (!nextDate) {
      console.log(
        `❌ Could not calculate next date for schedule ${currentSchedule._id}`
      );
      return null;
    }

    const existingSchedule = await Schedule.findOne({
      $or: [
        { _id: currentSchedule.recurrenceParentId || currentSchedule._id },
        {
          recurrenceParentId:
            currentSchedule.recurrenceParentId || currentSchedule._id,
        },
      ],
      students: { $in: currentSchedule.students },
      subject: currentSchedule.subject,
      classDate: {
        $gte: moment(nextDate).startOf("day").toDate(),
        $lte: moment(nextDate).endOf("day").toDate(),
      },
    });

    if (existingSchedule) {
      console.log(
        `⚠️ Next schedule already exists for ${moment(nextDate).format(
          "YYYY-MM-DD"
        )}, skipping...`
      );
      return null;
    }

    let scheduleToUse = await getMostRecentScheduleData(currentSchedule);

    console.log(
      `🔄 Creating next schedule using data from ${scheduleToUse._id}:`,
      {
        teacher: scheduleToUse.teacherName,
        startTime: scheduleToUse.startTime,
        endTime: scheduleToUse.endTime,
        rescheduleType: scheduleToUse.rescheduleType,
        isTemporary: scheduleToUse.isTemporaryChange,
      }
    );

    const newSchedule = new Schedule({
      students: scheduleToUse.students,
      studentNames: scheduleToUse.studentNames,
      teacherId: scheduleToUse.teacherId,
      teacherName: scheduleToUse.teacherName,
      subject: scheduleToUse.subject,
      subjectName: scheduleToUse.subjectName,
      subjectType: scheduleToUse.subjectType,
      day: moment(nextDate).format("dddd"),
      startTime: scheduleToUse.startTime,
      endTime: scheduleToUse.endTime,
      classDate: nextDate,
      status: "scheduled",
      sessionStatus: "pending",
      isRecurring: scheduleToUse.isRecurring,
      recurrencePattern: scheduleToUse.recurrencePattern,
      customDays: scheduleToUse.customDays,
      recurrenceParentId: scheduleToUse.recurrenceParentId || scheduleToUse._id,
      scheduledDuration: scheduleToUse.scheduledDuration,
      createdBy: scheduleToUse.createdBy,
      updatedBy: scheduleToUse.createdBy,
      isTemporaryChange: false,
      isTeacherTemporaryChange: false,
      rescheduleType: undefined,
    });

    await newSchedule.save();
    console.log(
      `✅ Created next schedule ${newSchedule._id} for ${moment(
        nextDate
      ).format("YYYY-MM-DD")} at ${scheduleToUse.startTime} with teacher ${
        scheduleToUse.teacherName
      }`
    );
    return newSchedule;
  } catch (error) {
    console.error(
      `❌ Error creating next schedule for ${currentSchedule._id}:`,
      error.message
    );
    return null;
  }
};

const calculateNextDate = (schedule) => {
  const currentDate = moment(schedule.classDate).tz(TIMEZONE);
  let nextDate;

  switch (schedule.recurrencePattern) {
    case "weekly":
      nextDate = currentDate.clone().add(7, "days");
      break;

    case "weekdays":
      nextDate = currentDate.clone().add(1, "day");
      while (nextDate.day() === 0 || nextDate.day() === 6) {
        nextDate.add(1, "day");
      }
      break;

    case "custom":
      if (!schedule.customDays || schedule.customDays.length === 0) {
        console.log(`❌ Custom days not defined for schedule ${schedule._id}`);
        return null;
      }

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
        .filter((day) => day !== undefined)
        .sort();

      nextDate = currentDate.clone().add(1, "day");
      let attempts = 0;

      while (attempts < 14) {
        if (customDayNumbers.includes(nextDate.day())) {
          break;
        }
        nextDate.add(1, "day");
        attempts++;
      }

      if (attempts >= 14) {
        console.log(
          `❌ Could not find next custom day for schedule ${schedule._id}`
        );
        return null;
      }
      break;

    default:
      console.log(
        `❌ Unknown recurrence pattern: ${schedule.recurrencePattern}`
      );
      return null;
  }

  return nextDate.toDate();
};

const checkAndCreateRecurringSchedules = async () => {
  try {
    const currentTime = moment().tz(TIMEZONE);
    const todayStart = currentTime.clone().startOf("day");
    const todayEnd = currentTime.clone().endOf("day");

    console.log("\n" + "=".repeat(80));
    console.log(
      `🕐 CRON JOB STARTED - ${currentTime.format(
        "YYYY-MM-DD HH:mm:ss"
      )} (Pakistan Time)`
    );
    console.log("=".repeat(80));

    const todaySchedules = await Schedule.find({
      classDate: {
        $gte: todayStart.toDate(),
        $lte: todayEnd.toDate(),
      },
    }).sort({ startTime: 1 });

    console.log(
      `📅 Found ${
        todaySchedules.length
      } schedules for today (${todayStart.format("YYYY-MM-DD")})`
    );

    if (todaySchedules.length === 0) {
      console.log("📭 No schedules found for today");
      console.log("=".repeat(80));
      return;
    }

    console.log("\n📋 TODAY'S SCHEDULES:");
    console.log("-".repeat(120));
    console.log(
      "| ID".padEnd(26) +
        "| Subject".padEnd(20) +
        "| Teacher".padEnd(20) +
        "| Time".padEnd(15) +
        "| Status".padEnd(15) +
        "| Recurring |"
    );
    console.log("-".repeat(120));

    let processedCount = 0;
    let createdCount = 0;
    const processedSeries = new Set();

    for (const schedule of todaySchedules) {
      const scheduleEndTime = moment(schedule.classDate).tz(TIMEZONE);
      const [endHour, endMinute] = schedule.endTime.split(":").map(Number);
      scheduleEndTime.hours(endHour).minutes(endMinute).seconds(0);

      const timeSlot = `${schedule.startTime}-${schedule.endTime}`;
      const recurringStatus = schedule.isRecurring ? "Yes" : "No";

      console.log(
        `| ${schedule._id.toString().padEnd(24)} | ${(
          schedule.subjectName || "Unknown"
        ).padEnd(18)} | ${(schedule.teacherName || "Unknown").padEnd(
          18
        )} | ${timeSlot.padEnd(13)} | ${schedule.sessionStatus.padEnd(
          13
        )} | ${recurringStatus.padEnd(9)} |`
      );

      const seriesId = schedule.recurrenceParentId || schedule._id;
      if (processedSeries.has(seriesId.toString())) {
        console.log(
          `  ⏭️ Already processed this recurring series, skipping...`
        );
        continue;
      }

      if (currentTime.isAfter(scheduleEndTime)) {
        console.log(
          `  ⏰ End time passed for schedule ${
            schedule._id
          } (ended at ${scheduleEndTime.format("HH:mm")})`
        );

        if (schedule.isRecurring) {
          const newSchedule = await createNextRecurringSchedule(schedule);
          if (newSchedule) {
            createdCount++;
            processedSeries.add(seriesId.toString());
            console.log(
              `  ✅ Created next schedule: ${moment(
                newSchedule.classDate
              ).format("YYYY-MM-DD")} at ${newSchedule.startTime}`
            );
          } else {
            processedSeries.add(seriesId.toString());
          }
        } else {
          console.log(`  ⏭️ Schedule is not recurring, skipping...`);
        }
        processedCount++;
      } else {
        const timeRemaining = moment.duration(
          scheduleEndTime.diff(currentTime)
        );
        console.log(
          `  ⏳ ${Math.floor(
            timeRemaining.asHours()
          )}h ${timeRemaining.minutes()}m remaining until end time`
        );
      }
    }

    console.log("-".repeat(120));
    console.log(`\n📊 SUMMARY:`);
    console.log(`   • Total schedules today: ${todaySchedules.length}`);
    console.log(`   • Schedules past end time: ${processedCount}`);
    console.log(`   • New schedules created: ${createdCount}`);
    console.log(`   • Recurring series processed: ${processedSeries.size}`);
    console.log(
      `   • Current time: ${currentTime.format(
        "YYYY-MM-DD HH:mm:ss"
      )} (Pakistan Time)`
    );

    console.log("\n" + "=".repeat(80));
    console.log(
      `✅ CRON JOB COMPLETED - ${moment()
        .tz(TIMEZONE)
        .format("YYYY-MM-DD HH:mm:ss")} (Pakistan Time)`
    );
    console.log("=".repeat(80) + "\n");
  } catch (error) {
    console.error("\n❌ ERROR IN CRON JOB:", error);
    console.error("Stack trace:", error.stack);
    console.log("=".repeat(80) + "\n");
  }
};

const startScheduleCronJob = () => {
  console.log("🚀 Starting schedule cron job...");

  cron.schedule(
    "*/30 * * * *",
    () => {
      checkAndCreateRecurringSchedules();
    },
    {
      scheduled: true,
      timezone: TIMEZONE,
    }
  );

  setTimeout(() => {
    console.log("🔄 Running initial schedule check...");
    checkAndCreateRecurringSchedules();
  }, 5000);

  console.log("⏰ Cron job scheduled to run every 30 minutes (Pakistan Time)");
};

module.exports = {
  startScheduleCronJob,
  checkAndCreateRecurringSchedules,
  getMostRecentScheduleData,
  createNextRecurringSchedule,
  calculateNextDate,
};
