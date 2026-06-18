import { Hono } from "hono";
import { eq, and, isNull } from "drizzle-orm";
import { getDB } from "../lib/db";
import { subjects, classes, users } from "../schema";
import { sendEmail, scheduleReminderEmail, DAY_LABELS } from "../lib/email";

type Bindings = {
  DB: D1Database;
  JWT_SECRET: string;
  RESEND_API_KEY: string;
};
type Variables = { userId: string };

export const scheduleRoutes = new Hono<{
  Bindings: Bindings;
  Variables: Variables;
}>();

// GET /schedules — get all scheduled subjects for the current teacher
scheduleRoutes.get("/", async (c) => {
  const userId = c.get("userId");
  const db = getDB(c.env.DB);

  const teacherClasses = await db
    .select()
    .from(classes)
    .where(and(eq(classes.teacherId, userId), isNull(classes.deletedAt)));

  const result = [];

  for (const cls of teacherClasses) {
    const classSubjects = await db
      .select()
      .from(subjects)
      .where(and(eq(subjects.classId, cls.id), isNull(subjects.deletedAt)));

    const scheduled = classSubjects.filter((s) => s.scheduleDay && s.scheduleTime);

    if (scheduled.length > 0) {
      result.push({
        classId: cls.id,
        className: cls.name,
        subjects: scheduled.map((s) => ({
          id: s.id,
          name: s.name,
          scheduleDay: s.scheduleDay,
          scheduleTime: s.scheduleTime,
          reminderMinutes: s.reminderMinutes,
          reminderEnabled: s.reminderEnabled,
        })),
      });
    }
  }

  return c.json({ success: true, data: result });
});

// POST /schedules/send-reminders — internal endpoint for cron job
// In production, this would be triggered by Cloudflare Cron Triggers
scheduleRoutes.post("/send-reminders", async (c) => {
  const db = getDB(c.env.DB);
  const apiKey = c.env.RESEND_API_KEY;

  if (!apiKey) {
    return c.json({ success: false, message: "Email service not configured" }, 500);
  }

  // Get current day and time
  const now = new Date();
  const dayMap = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const currentDay = dayMap[now.getDay()];
  const currentHour = now.getHours().toString().padStart(2, "0");
  const currentMinute = now.getMinutes().toString().padStart(2, "0");
  const currentTime = `${currentHour}:${currentMinute}`;

  // Find all subjects with reminders enabled for today
  const allSubjects = await db
    .select()
    .from(subjects)
    .where(
      and(
        eq(subjects.scheduleDay, currentDay),
        eq(subjects.reminderEnabled, true),
        isNull(subjects.deletedAt)
      )
    );

  const emailsSent: string[] = [];

  for (const subject of allSubjects) {
    if (!subject.scheduleTime || !subject.reminderMinutes) continue;

    // Calculate if it's time to send reminder
    const [schedHour, schedMin] = subject.scheduleTime.split(":").map(Number);
    const scheduleTotalMin = schedHour * 60 + schedMin;
    const currentTotalMin = parseInt(currentHour) * 60 + parseInt(currentMinute);
    const reminderMin = scheduleTotalMin - subject.reminderMinutes;

    // Send if current time is within the reminder window (5 min range)
    if (currentTotalMin >= reminderMin && currentTotalMin < reminderMin + 5) {
      // Get the class and teacher info
      const cls = await db
        .select()
        .from(classes)
        .where(eq(classes.id, subject.classId))
        .get();

      if (!cls) continue;

      const teacher = await db
        .select()
        .from(users)
        .where(eq(users.id, cls.teacherId))
        .get();

      if (!teacher) continue;

      const html = scheduleReminderEmail({
        teacherName: teacher.name,
        subjectName: subject.name,
        className: cls.name,
        scheduleTime: subject.scheduleTime,
        scheduleDay: DAY_LABELS[subject.scheduleDay] || subject.scheduleDay,
      });

      const sent = await sendEmail(apiKey, {
        to: teacher.email,
        subject: `Pengingat: ${subject.name} - ${cls.name}`,
        html,
      });

      if (sent) {
        emailsSent.push(subject.id);
      }
    }
  }

  return c.json({
    success: true,
    data: {
      checked: allSubjects.length,
      sent: emailsSent.length,
    },
  });
});
