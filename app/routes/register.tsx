import { Label } from "@radix-ui/react-label";
import { Form, Link, redirect, useActionData } from "@remix-run/react";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { z } from "zod";
import { db } from "~/lib/db";
import { users } from "drizzle/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { ActionFunctionArgs } from "@remix-run/node";

const registerSchema = z.object({
  username: z.string().min(1, "ID를 입력해주세요."),
  password: z.string().min(1, "비밀번호를 입력해주세요."),
  passwordConfirm: z.string().min(1, "비밀번호 재확인을 입력해주세요."),
}).superRefine(({ password, passwordConfirm }, ctx) => {
  if (password !== passwordConfirm) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "비밀번호가 다릅니다.",
      path: ["passwordConfirm"] // 특정 필드에 오류 연결
    });
  }
});

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const raw = Object.fromEntries(formData);

  const parsed = registerSchema.safeParse(raw);

  if(!parsed.success){
    const errors = parsed.error.flatten().fieldErrors;
    console.log(errors);
    return Response.json({errors}, {status: 400});
  }

  const { username, password } = parsed.data;

  const exists = await db.query.users.findFirst({
    where: eq(users.username, username),
  });

  if (exists) {
    return Response.json(
      { errors: { username: ["이미 존재하는 ID입니다."] } },
      { status: 400 }
    );
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await db.insert(users).values({
    username,
    password: hashedPassword,
  });

  return redirect("/login");
}

export default function RegisterPage() {

  const actionData = useActionData<typeof action>();

  return (
    <Form method="post">
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <Card className="w-[400px]">
          <CardHeader>
            <CardTitle className="text-2xl">회원가입</CardTitle>
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
              <div className="flex flex-col space-y-2">
                <Label htmlFor="framework" className="text-xl">
                  비밀번호 재확인
                </Label>
                <Input
                  id="passwordConfirm"
                  name="passwordConfirm"
                  placeholder="비밀번호 재확인"
                  type="password"
                />
                {actionData?.errors?.passwordConfirm && <p className="text-sm text-red-500">{actionData.errors.passwordConfirm[0]}</p>}
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Link to="/login">
              <Button variant="outline">이전</Button>
            </Link>
            <Button type="submit">회원가입</Button>
          </CardFooter>
        </Card>
      </div>
    </Form>
  );
}
