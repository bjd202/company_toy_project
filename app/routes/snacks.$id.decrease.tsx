import { db } from "~/lib/db";
import { snacks } from "~/../drizzle/schema";
import { and, eq, gte, sql } from "drizzle-orm";
import { getUser } from "~/utils/auth.server";
import { json } from "@remix-run/node";
import { logSnackAction } from "~/lib/snack-history";

export async function action({
  request,
  params,
}: {
  request: Request;
  params: { id: string };
}) {
  const id = Number(params.id);
  const user = await getUser(request);

  try {
    let updatedQuantity = 0;

    await db.transaction(async (tx) => {
      // 1. 수량 감소
      const [updated] = await tx
        .update(snacks)
        .set({
          quantity: sql`${snacks.quantity} - 1`,
          updatedAt: new Date(),
          updatedId: user.id,
        })
        .where(and(eq(snacks.id, id), gte(snacks.quantity, 1)))
        .returning({ quantity: snacks.quantity });

      if (!updated) {
        throw new Error("수량이 0입니다.");
      }

      updatedQuantity = updated.quantity ?? 1;

      // 2. 이력 기록
      await logSnackAction(tx, {
        snackId: id,
        userId: user.id,
        action: "decrease",
        quantity: 1,
        memo: "수동 수량 감소",
      });
    });

    return json({ quantity: updatedQuantity });
  } catch (error) {
    console.error("트랜잭션 에러:", error);
    return json({ error: "서버 오류" }, { status: 500 });
  }
  

  
}
