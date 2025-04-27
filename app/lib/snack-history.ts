import { snackHistories } from "drizzle/schema";
import { db } from "./db";
import { PgTransaction } from "drizzle-orm/pg-core";

// lib/snack-log.ts
export async function logSnackAction(tx: typeof db | PgTransaction, {
    snackId,
    userId,
    action,
    quantity,
    memo,
  }: {
    snackId: number | null;
    userId: number;
    action: "add" | "edit" | "delete" | "increase" | "decrease" | "approved" | "rejected";
    quantity?: number | null;
    memo?: string;
  }) {
    await tx.insert(snackHistories).values({
      snackId,
      userId,
      action,
      quantity,
      memo,
      createdAt: new Date(),
    });
  }
  