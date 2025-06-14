import { db } from "@/server/db";
import { users } from "@/server/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();
    // TODO: Proper validation
    if (!username || !password) {
      return Response.json(
        { error: "Missing username or password" },
        { status: 400 },
      );
    }
    // TODO: Proper password hashing etc.
    const [user] = await db
      .select()
      .from(users)
      .where(and(eq(users.username, username), eq(users.password, password)));

    if (!user) {
      return Response.json(
        { error: "Invalid username or password" },
        { status: 401 },
      );
    }

    return Response.json({ message: "Login successful", user });
  } catch (error: unknown) {
    let message = "Invalid request";
    if (
      typeof error === "object" &&
      error &&
      "message" in error &&
      typeof (error as { message?: unknown }).message === "string"
    ) {
      message = (error as { message: string }).message;
    }
    return Response.json({ error: message }, { status: 400 });
  }
}
