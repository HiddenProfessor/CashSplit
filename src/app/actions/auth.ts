"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createSession, destroySession } from "@/lib/auth";
import { db } from "@/lib/db";
import type { FormState } from "@/lib/form-state";
import { loginSchema, signUpSchema } from "@/lib/validators";

export async function signupAction(_state: FormState, formData: FormData): Promise<FormState> {
  const parsed = signUpSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors,
      message: "Check the highlighted fields.",
    };
  }

  const existingUser = await db.user.findUnique({
    where: { email: parsed.data.email },
    select: { id: true },
  });

  if (existingUser) {
    return {
      fieldErrors: { email: ["That email is already registered."] },
      message: "Use a different email or log in instead.",
    };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);

  const user = await db.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      passwordHash,
    },
    select: { id: true },
  });

  await createSession(user.id);
  revalidatePath("/");
  redirect("/dashboard");
}

export async function loginAction(_state: FormState, formData: FormData): Promise<FormState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors,
      message: "Enter your email and password.",
    };
  }

  const user = await db.user.findUnique({
    where: { email: parsed.data.email },
    select: {
      id: true,
      passwordHash: true,
    },
  });

  if (!user) {
    return {
      message: "No account matched that email and password.",
    };
  }

  const isValidPassword = await bcrypt.compare(parsed.data.password, user.passwordHash);

  if (!isValidPassword) {
    return {
      message: "No account matched that email and password.",
    };
  }

  await createSession(user.id);
  revalidatePath("/");
  redirect("/dashboard");
}

export async function logoutAction() {
  await destroySession();
  revalidatePath("/");
  redirect("/");
}