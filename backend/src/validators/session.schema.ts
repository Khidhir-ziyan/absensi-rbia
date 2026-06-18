import { z } from "zod";
import { ATTENDANCE_STATUS } from "../lib/constants";

export const startSessionSchema = z.object({
  subjectId: z.string().min(1),
  topic: z.string().min(1).max(500),
  date: z.string().datetime().optional(), // ISO date string, defaults to today
});

export const attendanceItemSchema = z.object({
  studentId: z.string().min(1),
  status: z.enum([
    ATTENDANCE_STATUS.PRESENT,
    ATTENDANCE_STATUS.SICK,
    ATTENDANCE_STATUS.EXCUSED,
    ATTENDANCE_STATUS.ABSENT,
  ]),
});

export const submitAttendanceSchema = z.object({
  records: z.array(attendanceItemSchema).min(1),
});
