import { auth } from "@/auth";
import Calendar from "@/components/Calendar";
import Landing from "@/components/Landing";

export default async function Home() {
  const session = await auth();
  if (!session?.user) return <Landing />;

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
