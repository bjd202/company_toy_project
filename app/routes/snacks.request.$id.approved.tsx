import { ActionFunctionArgs } from "@remix-run/node";
import { eq } from "drizzle-orm";
import { snackRequests, snacks } from "drizzle/schema";
import { db } from "~/lib/db";
import { getUser } from "~/utils/auth.server";

export async function action({ request, params }: ActionFunctionArgs) {
  const id = Number(params.id);
  const user = await getUser(request);

  const requestData = await request.json();
  console.log(requestData);

  try {
    await db.transaction(async (tx) => {
      await tx
        .update(snackRequests)
        .set({
          status: "approved",
          updatedAt: new Date(),
          approvedBy: user.id,
        })
        .where(eq(snackRequests.id, id));

      const existing = await tx.query.snacks.findFirst({
        where: eq(snacks.name, requestData.name),
      });

      if (existing) {
        await tx.update(snacks)
        .set({
          quantity: existing.quantity + requestData.quantity,
          updatedAt: new Date(),
          updatedId: user.id,
        })
        .where(eq(snacks.id, existing.id));
      }else{
        await tx.insert(snacks).values({
          name: requestData.name,
          quantity: requestData.quantity,
          expireDate: null,
          createdId: user.id,
          createdAt: new Date(),
          updatedId: user.id,
          updatedAt: new Date(),
        });
      }

    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: "서버 오류" }, { status: 500 });
  }
}
