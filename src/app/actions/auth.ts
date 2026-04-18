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
    username: formData.get("username"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors,
      message: "Check the highlighted fields.",
    };
  }

  const existingUser = await db.user.findUnique({
    where: { username: parsed.data.username },
    select: { id: true },
  });

  if (existingUser) {
    return {
      fieldErrors: { username: ["That username is already taken."] },
      message: "Choose a different username or log in instead.",
    };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);

  const user = await db.user.create({
    data: {
      name: parsed.data.name,
      username: parsed.data.username,
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
    username: formData.get("username"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors,
      message: "Enter your username and password.",
    };
  }

  const user = await db.user.findUnique({
    where: { username: parsed.data.username },
    select: {
      id: true,
      passwordHash: true,
    },
  });

  if (!user) {
    return {
      message: "No account matched that username and password.",
    };
  }

  const isValidPassword = await bcrypt.compare(parsed.data.password, user.passwordHash);

  if (!isValidPassword) {
    return {
      message: "No account matched that username and password.",
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