import { redirect } from "next/navigation";
import { auth } from "@/auth";
import AuthForm from "@/components/AuthForm";

export default async function RegisterPage() {
  if (await auth()) redirect("/");
  const googleEnabled = Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);
  return <AuthForm mode="register" googleEnabled={googleEnabled} />;
}
