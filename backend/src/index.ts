import { Hono } from "hono";
import { cors } from "hono/cors";
import { authMiddleware } from "./middleware/auth";
import { errorHandler } from "./middleware/error";
import { authRoutes } from "./routes/auth";
import { classRoutes } from "./routes/classes";
import { subjectRoutes } from "./routes/subjects";
import { studentRoutes } from "./routes/students";
import { sessionRoutes } from "./routes/sessions";
import { summaryRoutes } from "./routes/summary";
import { profileRoutes } from "./routes/profile";
import { scheduleRoutes } from "./routes/schedules";
import { getDB } from "./lib/db";
import { sendEmail, scheduleReminderEmail, DAY_LABELS } from "./lib/email";
import { subjects, classes, users } from "./schema";
import { eq, and, isNull } from "drizzle-orm";

type Bindings = {
  DB: D1Database;
  JWT_SECRET: string;
  RESEND_API_KEY: string;
  TIMEZONE_OFFSET: string;
};

const app = new Hono<{ Bindings: Bindings }>();

// Global middleware
app.use("*", cors({ origin: "*" }));
app.onError(errorHandler);

// Public routes
app.route("/api/v1/auth", authRoutes);

// Protected routes
const api = new Hono<{ Bindings: Bindings }>();
api.use("*", authMiddleware);

api.route("/classes", classRoutes);
api.route("/subjects", subjectRoutes);
api.route("/students", studentRoutes);
api.route("/sessions", sessionRoutes);
api.route("/summary", summaryRoutes);
api.route("/profile", profileRoutes);
api.route("/schedules", scheduleRoutes);

app.route("/api/v1", api);

// Health check
app.get("/", (c) => c.json({ status: "ok", service: "absensi-rbia-api" }));

// ── Cron handler for scheduled reminders ──
async function handleScheduled(env: Bindings) {
  const apiKey = env.RESEND_API_KEY;
  if (!apiKey) {
    console.log("RESEND_API_KEY not set, skipping reminders");
    return;
  }

  const db = getDB(env.DB);
  const timezoneOffset = parseInt(env.TIMEZONE_OFFSET || "7", 10);

  // Get current day and time in local timezone
  const now = new Date();
  const dayMap = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

  // Convert UTC to local time
  const utcHours = now.getUTCHours();
  const utcMinutes = now.getUTCMinutes();
  const localHours = (utcHours + timezoneOffset) % 24;

  // Get local day (might differ from UTC day due to timezone)
  const utcDay = now.getUTCDay();
  const localDayOffset = (utcHours + timezoneOffset) >= 24 ? 1 : 0;
  const localDay = dayMap[(utcDay + localDayOffset) % 7];

  console.log(`Checking reminders: local time ${localHours}:${utcMinutes.toString().padStart(2, "0")} ${localDay} (UTC+${timezoneOffset})`);

  // Get all subjects with reminders enabled for today
  const allSubjects = await db
    .select()
    .from(subjects)
    .where(
      and(
        eq(subjects.scheduleDay, localDay),
        eq(subjects.reminderEnabled, true),
        isNull(subjects.deletedAt)
      )
    );

  console.log(`Found ${allSubjects.length} subjects with reminders for ${localDay}`);

  let sentCount = 0;

  for (const subject of allSubjects) {
    if (!subject.scheduleTime || !subject.reminderMinutes) continue;

    // Calculate if it's time to send reminder
    const [schedHour, schedMin] = subject.scheduleTime.split(":").map(Number);
    const scheduleTotalMin = schedHour * 60 + schedMin;

    // Current time in local timezone minutes
    const currentTotalMin = localHours * 60 + utcMinutes;

    const reminderMin = scheduleTotalMin - subject.reminderMinutes;

    // Send if current time is within the reminder window (5 min range)
    const diff = currentTotalMin - reminderMin;
    if (diff >= 0 && diff < 5) {
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
        sentCount++;
        console.log(`Reminder sent to ${teacher.email} for ${subject.name}`);
      }
    }
  }

  console.log(`Reminders sent: ${sentCount}`);
}

// Export for Cloudflare Workers
export default {
  fetch: app.fetch,
  async scheduled(event: ScheduledEvent, env: Bindings, ctx: ExecutionContext) {
    ctx.waitUntil(handleScheduled(env));
  },
};
