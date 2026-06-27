import { auth } from "@/auth";

// Returns the signed-in user's id, or null. Used to guard API routes.
export async function currentUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}
