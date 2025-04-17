import { ActionFunctionArgs } from "@remix-run/node";
import { eq } from "drizzle-orm";
import { snackRequests } from "drizzle/schema";
import { db } from "~/lib/db";
import { getUser } from "~/utils/auth.server";

export async function action({ request, params }: ActionFunctionArgs){
  const id = Number(params.id);
  await getUser(request);

  try {
    await db
    .update(snackRequests)
    .set({
      status: "rejected",
      updatedAt: new Date(),
    })
    .where(eq(snackRequests.id, id))

    return Response.json({success: true});
  } catch (error) {
    return Response.json({error: "서버 오류"}, {status: 500});
  }
}