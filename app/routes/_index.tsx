import { LoaderFunctionArgs, redirect } from "@remix-run/node";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  return redirect("/login");
};

export default function Index() {
  return (
    <div></div>
  );
}
