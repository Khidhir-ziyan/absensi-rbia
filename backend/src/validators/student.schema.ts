import { z } from "zod";

export const createStudentSchema = z.object({
  name: z.string().min(1).max(100),
  studentId: z.string().max(50).optional(),
  parentContact: z.string().max(100).optional(),
  classId: z.string().min(1),
});

export const updateStudentSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  studentId: z.string().max(50).optional(),
  parentContact: z.string().max(100).optional(),
});
