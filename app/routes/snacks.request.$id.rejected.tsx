import { ActionFunctionArgs } from "@remix-run/node";
import { eq } from "drizzle-orm";
import { snackRequests } from "drizzle/schema";
import { db } from "~/lib/db";
import { getUser } from "~/utils/auth.server";
import { logSnackAction } from "~/lib/snack-history"; // 이력 기록 함수

export async function action({ request, params }: ActionFunctionArgs) {
  const id = Number(params.id);
  const user = await getUser(request);

  try {
    await db.transaction(async (tx) => {
      // 1. snackRequest 가져오기
      const target = await tx.query.snackRequests.findFirst({
        where: eq(snackRequests.id, id),
      });

      if (!target) {
        throw new Error("간식 요청이 존재하지 않습니다.");
      }

      // 2. 상태 업데이트
      await tx
        .update(snackRequests)
        .set({
          status: "rejected",
          updatedAt: new Date(),
          approvedBy: user.id,
        })
        .where(eq(snackRequests.id, id));

      // 3. 이력 기록
      await logSnackAction(tx, {
        snackId: null,
        userId: user.id,
        action: "rejected",
        quantity: target.quantity ?? 0,
        memo: `간식 요청 거절 - ${target.name}`,
      });
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error("거절 처리 오류:", error);
    return Response.json({ error: "서버 오류" }, { status: 500 });
  }
}
