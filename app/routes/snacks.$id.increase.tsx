import { db } from "~/lib/db";
import { snacks } from "~/../drizzle/schema";
import { eq, sql } from "drizzle-orm";
import { getUser } from "~/utils/auth.server";
import { json } from "@remix-run/node";

export async function action({ request, params }: { request: Request; params: { id: string } }) {
  const id = Number(params.id);
  console.log(params);
  console.log(id);
  const user = await getUser(request);
  console.log(user);

  try {
    const [updated] = await db
      .update(snacks)
      .set({
        quantity: sql`${snacks.quantity} + 1`,
        updatedAt: new Date(),
        updatedId: user.id,
      })
      .where(eq(snacks.id, id))
      .returning({ quantity: snacks.quantity });

    if (!updated) {
      return json({ error: "간식을 찾을 수 없습니다." }, { status: 404 });
    }

    return json({ quantity: updated.quantity });
  } catch (error) {
    console.error("수량 증가 에러:", error);
    return json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
