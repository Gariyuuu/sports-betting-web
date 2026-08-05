import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { authCookieName, isValidCookieToken } from "@/lib/auth";
import Dashboard from "./Dashboard";

export default async function Page() {
  const cookieStore = await cookies();
  const token = cookieStore.get(authCookieName())?.value;
  if (!isValidCookieToken(token)) {
    redirect("/login");
  }
  return <Dashboard />;
}
