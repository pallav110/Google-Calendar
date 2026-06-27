import { redirect } from "next/navigation";
import { auth } from "@/auth";
import Calendar from "@/components/Calendar";

export default async function Home() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <Calendar
      user={{
        name: session.user.name ?? null,
        email: session.user.email ?? null,
        image: session.user.image ?? null,
      }}
    />
  );
}
