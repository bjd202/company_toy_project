import { ActionFunctionArgs } from "@remix-run/node";
import { db } from "~/lib/db";
import { snackRequests } from "~/../drizzle/schema";
import { eq } from "drizzle-orm";
import { getUser } from "~/utils/auth.server";
import { logSnackAction } from "~/lib/snack-history"; // 이력 기록 유틸

export async function action({ request, params }: ActionFunctionArgs) {
  const id = Number(params.id);
  const user = await getUser(request);

  try {
    await db.transaction(async (tx) => {
      // 1. 삭제할 snackRequest 데이터 조회
      const target = await tx.query.snackRequests.findFirst({
        where: eq(snackRequests.id, id),
      });

      if (!target) {
        throw new Error("삭제할 간식 요청을 찾을 수 없습니다.");
      }

      // 2. 이력 기록
      await logSnackAction(tx, {
        snackId: null, // 요청 삭제는 snackId가 없을 수 있음
        userId: user.id,
        action: "delete",
        quantity: target.quantity,
        memo: `요청 삭제 - ${target.name}`,
      });

      // 3. 실제 삭제
      await tx.delete(snackRequests).where(eq(snackRequests.id, id));
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error("간식 요청 삭제 실패:", error);
    return Response.json({ error: "삭제 중 오류가 발생했습니다." }, { status: 500 });
  }
}
