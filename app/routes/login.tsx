import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";

import { ActionFunctionArgs } from "@remix-run/node";
import { db } from "~/lib/db";
import { eq } from "drizzle-orm";
// bcryptjs는 Pure JS라 Vite와 충돌 없음
import bcrypt from "bcryptjs";

import { Form, Link, useActionData } from "@remix-run/react";
import { users } from "~/../drizzle/schema";
import { z } from "zod";
import { createUserSession } from "~/utils/auth.server";

const loginSchema = z.object({
  username: z.string().min(1, "ID를 입력해주세요."),
  password: z.string().min(1, "비밀번호를 입력해주세요.")
})

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const raw = Object.fromEntries(formData);

  const parsed = loginSchema.safeParse(raw);

  if(!parsed.success){
    const errors = parsed.error.flatten().fieldErrors;
    return Response.json({errors}, {status: 400});
  }

  const {username, password} = parsed.data;

  const user = await db.query.users.findFirst({
    where: eq(users.username, username),
  });

  if (!user) {
    return Response.json({errors: {username: ["ID를 찾을 수 없습니다"]}}, { status: 400});
  }

  const isValid = await bcrypt.compare(password, user.password);

  if (!isValid) {
    return Response.json({errors: {password: ["비밀번호가 일치하지 않습니다"]}}, { status: 400 });
  }

  // 쿠키 생성 (세션 처리 간단 버전)
  // return redirect("/dashboard", {
  //   headers: {
  //     "Set-Cookie": `user=${username}; Path=/; HttpOnly`,
  //   },
  // });

  return await createUserSession(username, user.id, "/dashboard");
}

export default function LoginPage() {
  const actionData = useActionData<typeof action>();

  return (
    <Form method="post">
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <Card className="w-[400px]">
          <CardHeader>
            <CardTitle className="text-2xl">로그인</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid w-full items-center gap-4">
              <div className="flex flex-col space-y-2">
                <Label htmlFor="username" className="text-xl">
                  ID
                </Label>
                <Input id="username" name="username" placeholder="ID" />
                {actionData?.errors?.username && <p className="text-sm text-red-500">{actionData.errors.username[0]}</p>}
              </div>
              <div className="flex flex-col space-y-2">
                <Label htmlFor="framework" className="text-xl">
                  비밀번호
                </Label>
                <Input
                  id="password"
                  name="password"
                  placeholder="비밀번호"
                  type="password"
                />
                {actionData?.errors?.password && <p className="text-sm text-red-500">{actionData.errors.password[0]}</p>}
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Link to="/register">
              <Button type="button" variant="outline">회원가입</Button>
            </Link>
            <Button type="submit">로그인</Button>
          </CardFooter>
        </Card>
      </div>
    </Form>
  );
}
