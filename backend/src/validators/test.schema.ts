import { z } from "zod";

export const createTestSchema = z.object({
  name: z.string().min(1, "Nama tes wajib diisi").max(100),
});

export const updateTestSchema = z.object({
  name: z.string().min(1).max(100).optional(),
});

export const submitGradesSchema = z.object({
  grades: z.array(
    z.object({
      studentId: z.string().min(1),
      score: z.number().min(0).max(100),
    })
  ),
});
