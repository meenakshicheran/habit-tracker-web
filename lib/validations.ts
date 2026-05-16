import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const habitSchema = z.object({
  title: z.string().min(1, 'Title is required').max(60),
  description: z.string().max(200).optional(),
  icon: z.string().default('✅'),
  color: z.string().default('#000000'),
  category: z.string().default('General'),
  frequency: z.enum(['daily', 'weekly', 'custom']).default('daily'),
  targetDays: z.number().int().min(1).max(7).default(7),
  reminderTime: z.string().regex(/^\d{2}:\d{2}$/).optional().nullable(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type HabitInput = z.infer<typeof habitSchema>;
