import { z } from "zod";

const dayEnum = z.enum([
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
]);

export const createSubjectSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  classId: z.string().min(1),
  scheduleDay: dayEnum.optional(),
  scheduleTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .optional(),
  reminderMinutes: z.number().int().min(5).max(60).optional(),
  reminderEnabled: z.boolean().optional(),
});

export const updateSubjectSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  scheduleDay: dayEnum.nullable().optional(),
  scheduleTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .nullable()
    .optional(),
  reminderMinutes: z.number().int().min(5).max(60).optional(),
  reminderEnabled: z.boolean().optional(),
});
