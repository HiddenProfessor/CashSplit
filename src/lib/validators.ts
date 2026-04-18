import { z } from "zod";

const moneyPattern = /^\d+(?:[.,]\d{1,2})?$/;

export const signUpSchema = z.object({
  name: z.string().trim().min(2, "Use at least 2 characters.").max(60, "Keep it under 60 characters."),
  username: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, "Use at least 3 characters.")
    .max(30, "Keep it under 30 characters.")
    .regex(/^[a-z0-9_.-]+$/, "Only letters, numbers, dots, hyphens, and underscores."),
  password: z
    .string()
    .min(8, "Use at least 8 characters.")
    .regex(/[a-zA-Z]/, "Include at least one letter.")
    .regex(/\d/, "Include at least one number."),
});

export const loginSchema = z.object({
  username: z.string().trim().toLowerCase().min(1, "Enter your username."),
  password: z.string().min(1, "Enter your password."),
});

export const createGroupSchema = z.object({
  name: z.string().trim().min(3, "Use at least 3 characters.").max(80, "Keep it under 80 characters."),
  description: z.string().trim().max(240, "Keep it under 240 characters.").optional(),
  memberUsernames: z.string().trim().max(500, "Keep the member list shorter.").optional(),
  currency: z.string().trim().min(3).max(3).toUpperCase().optional(),
});

export const createExpenseSchema = z.object({
  title: z.string().trim().min(3, "Use at least 3 characters.").max(80, "Keep it under 80 characters."),
  amount: z
    .string()
    .trim()
    .refine((value) => moneyPattern.test(value), "Use a valid amount, for example 249.90."),
  paidById: z.string().trim().min(1, "Choose who paid."),
  expenseDate: z.string().trim().min(1, "Choose a date."),
  notes: z.string().trim().max(280, "Keep notes under 280 characters.").optional(),
});

export const recordPaymentSchema = z
  .object({
    amount: z
      .string()
      .trim()
      .refine((value) => moneyPattern.test(value), "Use a valid amount, for example 249.90."),
    fromUserId: z.string().trim().min(1, "Choose who paid."),
    toUserId: z.string().trim().min(1, "Choose who received."),
    paymentDate: z.string().trim().min(1, "Choose a date."),
    note: z.string().trim().max(280, "Keep notes under 280 characters.").optional(),
  })
  .refine((value) => value.fromUserId !== value.toUserId, {
    message: "The sender and receiver must be different people.",
    path: ["toUserId"],
  });

export function parseAmountToCents(rawAmount: string) {
  const normalized = rawAmount.replace(",", ".").trim();

  if (!moneyPattern.test(normalized)) {
    throw new Error("Invalid amount.");
  }

  const [wholePart, decimalPart = ""] = normalized.split(".");

  return Number(wholePart) * 100 + Number(decimalPart.padEnd(2, "0").slice(0, 2));
}

export function parseMemberUsernames(input?: string | null) {
  if (!input) {
    return [];
  }

  return [...new Set(
    input
      .split(/[\n,]/)
      .map((entry) => entry.trim().toLowerCase())
      .filter(Boolean),
  )];
}