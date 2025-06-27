const cron = require("node-cron");
const moment = require("moment-timezone");
const Schedule = require("../models/Schedule");

const TIMEZONE = "Asia/Karachi";

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
      students: { $in: currentSchedule.students },
      teacherId: currentSchedule.teacherId,
      subject: currentSchedule.subject,
      classDate: {
        $gte: moment(nextDate).startOf("day").toDate(),
        $lte: moment(nextDate).endOf("day").toDate(),
      },
      startTime: currentSchedule.startTime,
      endTime: currentSchedule.endTime,
    });

    if (existingSchedule) {
      console.log(
        `⚠️ Next schedule already exists for ${moment(nextDate).format(
          "YYYY-MM-DD"
        )} at ${currentSchedule.startTime}, skipping...`
      );
      return null;
    }
    let scheduleToUse = currentSchedule;
    if (
      currentSchedule.isTemporaryChange ||
      currentSchedule.isTeacherTemporaryChange
    ) {
      const parentSchedule = await Schedule.findOne({
        _id: currentSchedule.recurrenceParentId || currentSchedule._id,
      });
      if (parentSchedule) {
        scheduleToUse = parentSchedule;
      }
    }

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
      recurrenceParentId:
        currentSchedule.recurrenceParentId || currentSchedule._id,
      scheduledDuration: scheduleToUse.scheduledDuration,
      createdBy: scheduleToUse.createdBy,
      updatedBy: scheduleToUse.createdBy,
    });

    await newSchedule.save();
    console.log(
      `✅ Created next schedule for ${moment(nextDate).format(
        "YYYY-MM-DD"
      )} at ${currentSchedule.startTime}`
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
            console.log(
              `  ✅ Created next schedule: ${moment(
                newSchedule.classDate
              ).format("YYYY-MM-DD")} at ${newSchedule.startTime}`
            );
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
};
