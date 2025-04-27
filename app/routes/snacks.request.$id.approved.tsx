import { ActionFunctionArgs } from "@remix-run/node";
import { eq } from "drizzle-orm";
import { snackRequests, snacks } from "drizzle/schema";
import { db } from "~/lib/db";
import { getUser } from "~/utils/auth.server";
import { logSnackAction } from "~/lib/snack-history";

export async function action({ request, params }: ActionFunctionArgs) {
  const id = Number(params.id);
  const user = await getUser(request);

  const requestData = await request.json();

  try {
    await db.transaction(async (tx) => {
      // 1. 요청 상태 변경
      await tx
        .update(snackRequests)
        .set({
          status: "approved",
          updatedAt: new Date(),
          approvedBy: user.id,
        })
        .where(eq(snackRequests.id, id));

      // 2. 간식 존재 여부 확인
      const existing = await tx.query.snacks.findFirst({
        where: eq(snacks.name, requestData.name),
      });

      if (existing) {
        // 2-1. 수량 증가
        await tx
          .update(snacks)
          .set({
            quantity: existing.quantity + requestData.quantity,
            updatedAt: new Date(),
            updatedId: user.id,
          })
          .where(eq(snacks.id, existing.id));

        // 2-2. 이력 기록
        await logSnackAction(tx, {
          snackId: existing.id,
          userId: user.id,
          action: "approved",
          quantity: requestData.quantity,
          memo: `요청 승인으로 ${requestData.quantity}개 추가됨`,
        });
      } else {
        // 3. 새 간식 insert
        const [inserted] = await tx
          .insert(snacks)
          .values({
            name: requestData.name,
            quantity: requestData.quantity,
            expireDate: null,
            createdId: user.id,
            createdAt: new Date(),
            updatedId: user.id,
            updatedAt: new Date(),
          })
          .returning({ id: snacks.id });

        // 3-1. 이력 기록
        await logSnackAction(tx, {
          snackId: inserted.id,
          userId: user.id,
          action: "approved",
          quantity: requestData.quantity,
          memo: `신규 간식 요청 승인`,
        });
      }
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error("간식 요청 승인 처리 오류:", error);
    return Response.json({ error: "서버 오류" }, { status: 500 });
  }
}
