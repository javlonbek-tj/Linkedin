import { z } from 'zod';

export const updateUserSchema = z.object({
  firstname: z.string().min(1).trim().optional(),
  lastname: z.string().min(1).trim().optional(),
  username: z
    .string()
    .min(3)
    .max(30)
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9_]+$/, 'Username may only contain letters, numbers, and underscores.')
    .optional(),
  headline: z.string().max(220).trim().optional(),
  location: z.string().trim().optional(),
  about: z.string().max(2600).trim().optional(),
  skills: z.array(z.string().trim()).optional(),
  profilePhoto: z.string().url().optional(),
  bannerImage: z.string().url().optional(),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;
