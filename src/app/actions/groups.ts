"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import type { FormState } from "@/lib/form-state";
import { createGroupSchema, parseAmountToCents, parseMemberUsernames, recordPaymentSchema } from "@/lib/validators";

export async function leaveGroupAction(groupId: string): Promise<FormState> {
  const user = await requireUser();

  const membership = await db.groupMember.findUnique({
    where: {
      groupId_userId: {
        groupId,
        userId: user.id,
      },
    },
  });

  if (!membership) {
    return { message: "You are not a member of this group." };
  }

  const memberCount = await db.groupMember.count({ where: { groupId } });

  if (memberCount === 1) {
    // Last member — delete the entire group (cascades expenses, payments, shares)
    await db.group.delete({ where: { id: groupId } });
  } else {
    await db.groupMember.delete({
      where: {
        groupId_userId: {
          groupId,
          userId: user.id,
        },
      },
    });
  }

  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function createGroupAction(_state: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const parsed = createGroupSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    memberUsernames: formData.get("memberUsernames") || undefined,
    currency: formData.get("currency") || undefined,
  });

  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors,
      message: "Check the group details and try again.",
    };
  }

  const requestedUsernames = parseMemberUsernames(parsed.data.memberUsernames);
  const memberUsernames = [...new Set([user.username, ...requestedUsernames])];

  const users = await db.user.findMany({
    where: { username: { in: memberUsernames } },
    select: { id: true, username: true },
  });

  const foundUsernames = new Set(users.map((entry) => entry.username));
  const missingUsernames = memberUsernames.filter((username) => !foundUsernames.has(username));

  if (missingUsernames.length > 0) {
    return {
      fieldErrors: {
        memberUsernames: [
          `These users need to sign up first: ${missingUsernames.join(", ")}`,
        ],
      },
      message: "Every member must already have an account.",
    };
  }

  const group = await db.group.create({
    data: {
      name: parsed.data.name,
      description: parsed.data.description || null,
      currency: parsed.data.currency || "SEK",
      createdById: user.id,
      members: {
        create: users.map((member) => ({
          userId: member.id,
          role: member.id === user.id ? "owner" : "member",
        })),
      },
    },
    select: { id: true },
  });

  revalidatePath("/dashboard");
  redirect(`/groups/${group.id}`);
}

export async function recordPaymentAction(
  groupId: string,
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser();
  const parsed = recordPaymentSchema.safeParse({
    amount: formData.get("amount"),
    fromUserId: formData.get("fromUserId"),
    toUserId: formData.get("toUserId"),
    paymentDate: formData.get("paymentDate"),
    note: formData.get("note") || undefined,
  });

  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors,
      message: "Check the payment details and try again.",
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
    select: {
      id: true,
      members: {
        select: {
          userId: true,
        },
      },
    },
  });

  if (!group) {
    return {
      message: "That group is not available to you.",
    };
  }

  const memberIds = new Set(group.members.map((member) => member.userId));

  if (!memberIds.has(parsed.data.fromUserId) || !memberIds.has(parsed.data.toUserId)) {
    return {
      message: "Both users must be members of this group.",
    };
  }

  const amountCents = parseAmountToCents(parsed.data.amount);

  await db.payment.create({
    data: {
      groupId,
      fromUserId: parsed.data.fromUserId,
      toUserId: parsed.data.toUserId,
      amountCents,
      paymentDate: new Date(parsed.data.paymentDate),
      note: parsed.data.note || null,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath(`/groups/${groupId}`);
  redirect(`/groups/${groupId}`);
}