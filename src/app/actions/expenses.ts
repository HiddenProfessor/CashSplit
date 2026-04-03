"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth";
import { splitByWeights, splitEvenly } from "@/lib/balances";
import { db } from "@/lib/db";
import type { FormState } from "@/lib/form-state";
import { createExpenseSchema, parseAmountToCents } from "@/lib/validators";

type SplitMode = "equal" | "preset" | "custom";

type RawSplitShare = {
  userId: string;
  percentage: number;
};

function parseSplitMode(value: FormDataEntryValue | null): SplitMode {
  if (value === "preset" || value === "custom") {
    return value;
  }

  return "equal";
}

function parseRawSplitShares(value: FormDataEntryValue | null): RawSplitShare[] | null {
  if (typeof value !== "string" || value.trim().length === 0) {
    return null;
  }

  try {
    const parsed = JSON.parse(value);

    if (!Array.isArray(parsed)) {
      return null;
    }

    const shares = parsed
      .map((entry) => {
        if (!entry || typeof entry !== "object") {
          return null;
        }

        const userId = typeof entry.userId === "string" ? entry.userId.trim() : "";
        const percentage = Number(entry.percentage);

        if (!userId || !Number.isFinite(percentage)) {
          return null;
        }

        return { userId, percentage };
      })
      .filter((entry): entry is RawSplitShare => entry !== null);

    return shares.length > 0 ? shares : null;
  } catch {
    return null;
  }
}

export async function createExpenseAction(
  groupId: string,
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser();
  const parsed = createExpenseSchema.safeParse({
    title: formData.get("title"),
    amount: formData.get("amount"),
    paidById: formData.get("paidById"),
    expenseDate: formData.get("expenseDate"),
    notes: formData.get("notes") || undefined,
  });

  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors,
      message: "Check the expense details and try again.",
    };
  }

  const group = await db.group.findFirst({
    where: {
      id: groupId,
      members: {
        some: {
          userId: user.id,
        },
      },
    },
    include: {
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          joinedAt: "asc",
        },
      },
    },
  });

  if (!group) {
    return {
      message: "That group is not available to you.",
    };
  }

  const payer = group.members.find((member) => member.userId === parsed.data.paidById);

  if (!payer) {
    return {
      fieldErrors: { paidById: ["Choose a group member as the payer."] },
      message: "The selected payer is not part of this group.",
    };
  }

  const amountCents = parseAmountToCents(parsed.data.amount);
  const splitMode = parseSplitMode(formData.get("splitMode"));
  const rawSplitShares = parseRawSplitShares(formData.get("splitShares"));

  const memberIds = new Set(group.members.map((member) => member.userId));
  let shareAllocations: Array<{ userId: string; amountCents: number }>;

  if (splitMode === "equal") {
    const shares = splitEvenly(amountCents, group.members.length);
    shareAllocations = group.members.map((member, index) => ({
      userId: member.userId,
      amountCents: shares[index] ?? 0,
    }));
  } else {
    if (!rawSplitShares) {
      return {
        message: "Could not read split percentages. Try selecting your split again.",
      };
    }

    const normalizedShares = rawSplitShares.map((share) => ({
      ...share,
      percentage: Math.max(0, share.percentage),
    }));

    const hasUnknownMember = normalizedShares.some((share) => !memberIds.has(share.userId));

    if (hasUnknownMember) {
      return {
        message: "Split percentages included a non-member. Refresh and try again.",
      };
    }

    const totalPercentage = normalizedShares.reduce((sum, share) => sum + share.percentage, 0);

    if (Math.abs(totalPercentage - 100) > 0.01) {
      return {
        message: "Split percentages must add up to 100%.",
      };
    }

    shareAllocations = splitByWeights(
      amountCents,
      normalizedShares.map((share) => ({
        userId: share.userId,
        weight: share.percentage,
      })),
    );
  }

  await db.expense.create({
    data: {
      title: parsed.data.title,
      notes: parsed.data.notes || null,
      amountCents,
      expenseDate: new Date(parsed.data.expenseDate),
      groupId,
      paidById: parsed.data.paidById,
      shares: {
        create: shareAllocations.map((share) => ({
          userId: share.userId,
          amountCents: share.amountCents,
        })),
      },
    },
  });

  revalidatePath("/dashboard");
  revalidatePath(`/groups/${groupId}`);
  redirect(`/groups/${groupId}`);
}

export async function settleExpensesAction(groupId: string): Promise<FormState> {
  const user = await requireUser();

  const group = await db.group.findFirst({
    where: {
      id: groupId,
      members: { some: { userId: user.id } },
    },
    select: { id: true },
  });

  if (!group) {
    return { message: "That group is not available to you." };
  }

  await db.expense.updateMany({
    where: {
      groupId,
      settledAt: null,
    },
    data: {
      settledAt: new Date(),
    },
  });

  revalidatePath("/dashboard");
  revalidatePath(`/groups/${groupId}`);
  redirect(`/groups/${groupId}`);
}