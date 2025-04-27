import { ActionFunctionArgs } from "@remix-run/node";
import { db } from "~/lib/db";
import { snacks } from "~/../drizzle/schema";
import { eq } from "drizzle-orm";
import { getUser } from "~/utils/auth.server";
import { logSnackAction } from "~/lib/snack-history";

export async function action({ request, params }: ActionFunctionArgs) {
  const id = Number(params.id);
  const user = await getUser(request);

  try {
    await db.transaction(async (tx) => {
      // 삭제 대상 조회
      const existing = await tx.query.snacks.findFirst({
        where: eq(snacks.id, id),
      });

      if (!existing) {
        throw new Error("해당 간식을 찾을 수 없습니다.");
      }

      // 간식 삭제
      await tx.delete(snacks).where(eq(snacks.id, id));

      // 이력 기록
      await logSnackAction(tx, {
        snackId: id,
        userId: user.id,
        action: "delete",
        quantity: existing.quantity,
        memo: `간식 삭제: ${existing.name}`,
      });
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error("간식 삭제 에러:", error);
    return Response.json({ success: false, error: "삭제 실패" }, { status: 500 });
  }
}
