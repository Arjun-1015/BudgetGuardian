import { z } from "zod";
import {
  EXPENSE_CATEGORIES,
  INCOME_SOURCES,
  PAYMENT_METHODS,
  PRIORITY_LEVELS,
} from "./constants";

export const registerSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30)
    .regex(/^[a-zA-Z0-9_]+$/, "Only letters, numbers, and underscores"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const loginSchema = z.object({
  identifier: z.string().min(1, "Enter your email or username"),
  password: z.string().min(1, "Password is required"),
});

export const profileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  currency: z.string().optional(),
  occupation: z.string().max(100).optional().nullable(),
  monthlyIncome: z.number().nonnegative().optional(),
  otherIncome: z.number().nonnegative().optional(),
  salaryAmount: z.number().nonnegative().optional(),
  salaryFrequency: z.enum(["monthly", "biweekly", "weekly"]).optional(),
  salaryDate: z.number().int().min(1).max(28).optional(),
  profilePhoto: z
    .string()
    .max(700_000, "Image is too large — try a smaller photo")
    .regex(/^data:image\/(png|jpeg|jpg|webp);base64,/, "Must be a valid image data URL")
    .optional()
    .nullable(),
});

export const dependentSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  relation: z.string().min(1, "Relation is required").max(50),
  age: z.number().int().min(0).max(120).optional().nullable(),
  monthlyExpense: z.number().nonnegative(),
  priorityLevel: z.enum(PRIORITY_LEVELS).default("medium"),
  medicalNeeds: z.boolean().default(false),
});

export const expenseSchema = z.object({
  amount: z.number().positive("Amount must be greater than 0"),
  category: z.enum(EXPENSE_CATEGORIES),
  date: z.string().datetime().or(z.string().min(1)),
  notes: z.string().max(500).optional().nullable(),
  paymentMethod: z.enum(PAYMENT_METHODS).default("card"),
  isRecurring: z.boolean().default(false),
});

export const incomeSchema = z.object({
  source: z.enum(INCOME_SOURCES),
  amount: z.number().positive("Amount must be greater than 0"),
  date: z.string().datetime().or(z.string().min(1)),
  notes: z.string().max(500).optional().nullable(),
});

export const goalSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  targetAmount: z.number().positive("Target must be greater than 0"),
  currentAmount: z.number().nonnegative().default(0),
  targetDate: z.string().datetime().or(z.string().min(1)).optional().nullable(),
});

export const billSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  category: z.string().min(1).max(50),
  amount: z.number().positive("Amount must be greater than 0"),
  dueDate: z.string().datetime().or(z.string().min(1)),
  isPaid: z.boolean().default(false),
  isRecurring: z.boolean().default(true),
});
