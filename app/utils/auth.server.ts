// app/utils/auth.server.ts
import { createCookieSessionStorage, redirect } from "@remix-run/node";

const secret = process.env.SECRET_KEY;

// 쿠키 세션 스토리지 생성
export const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: "session",
    secrets: [secret],
    sameSite: "lax",
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  },
});

// 세션 가져오기
export async function getUserSession(request: Request) {
  return sessionStorage.getSession(request.headers.get("Cookie"));
}

// 로그인된 유저명 가져오기
export async function getUser(request: Request) {
  const session = await getUserSession(request);
  const username = session.get("username");
  const email = session.get("email") || "";
  const avatar = session.get("avatar") || "";
  const id = session.get("id") || "";

  if (!username) throw redirect("/login");

  return {
    name: username,
    email,
    avatar,
    id,
  };
}

// 로그인 성공 시 세션 저장
export async function createUserSession(username: string, id: number, redirectTo: string) {
  const session = await sessionStorage.getSession();
  session.set("username", username);
  session.set("id", id);

  return redirect(redirectTo, {
    headers: {
      "Set-Cookie": await sessionStorage.commitSession(session),
    },
  });
}

// 로그아웃 (세션 제거)
export async function logout(request: Request) {
  const session = await getUserSession(request);
  return redirect("/login", {
    headers: {
      "Set-Cookie": await sessionStorage.destroySession(session),
    },
  });
}
