import { db } from "~/lib/db";
import { snacks } from "~/../drizzle/schema";
import { eq, sql } from "drizzle-orm";
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
      // 1. 수량 증가
      const [updated] = await tx
        .update(snacks)
        .set({
          quantity: sql`${snacks.quantity} + 1`,
          updatedAt: new Date(),
          updatedId: user.id,
        })
        .where(eq(snacks.id, id))
        .returning({ quantity: snacks.quantity });

      if (!updated) {
        throw new Error("간식을 찾을 수 없습니다.");
      }

      updatedQuantity = updated.quantity ?? 1;

      // 2. 이력 남기기
      await logSnackAction(tx, {
        snackId: id,
        userId: user.id,
        action: "increase", // 수량 증가
        quantity: 1,
        memo: "수동 수량 증가",
      });
    });

    return json({ quantity: updatedQuantity });
  } catch (error) {
    console.error("수량 증가 에러:", error);
    return json(
      { error: "서버 오류" },
      { status: 500 }
    );
  }
}
