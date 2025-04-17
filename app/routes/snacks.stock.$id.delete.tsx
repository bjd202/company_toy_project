import { ActionFunctionArgs } from "@remix-run/node";
import { db } from "~/lib/db";
import { snacks } from "~/../drizzle/schema";
import { eq } from "drizzle-orm";

export async function action({ params }: ActionFunctionArgs) {
  const id = Number(params.id);
  await db.delete(snacks).where(eq(snacks.id, id));
  return Response.json({success: true});
}