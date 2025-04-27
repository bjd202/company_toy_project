import { addDays, format, startOfDay } from "date-fns";
import { db } from "~/lib/db";
import { snackAlerts, snacks } from "drizzle/schema";
import { and, eq, gte, lte } from "drizzle-orm";

export async function generateExpiryAlerts(thresholdDays: number = 7) {
  const today = startOfDay(new Date());
  const thresholdDate = addDays(today, thresholdDays);

  const todayStr = format(today, "yyyy-MM-dd");
  const thresholdStr = format(thresholdDate, "yyyy-MM-dd");

  const expiringSnacks = await db
    .select()
    .from(snacks)
    .where(
      and(
        gte(snacks.expireDate, todayStr),
        lte(snacks.expireDate, thresholdStr)
      )
    );

  for (const snack of expiringSnacks) {
    const daysLeft = snack.expireDate 
    ? Math.ceil((new Date(snack.expireDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    : 0;

    if (!snack.expireDate) continue;

    // 기존 알림 중복 체크
    const exists = await db.query.snackAlerts.findFirst({
      where: and(
        eq(snackAlerts.snackId, snack.id),
        eq(snackAlerts.expireDate, snack.expireDate)
      )
    });

    if (!exists) {
      await db.insert(snackAlerts).values({
        snackId: snack.id,
        expireDate: snack.expireDate,
        daysLeft,
        isRead: false,
        createdAt: new Date(),
      });
    }
  }
}
