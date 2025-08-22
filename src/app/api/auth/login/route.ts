import { db } from "@/server/db";
import { users } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();
    // Basic validation
    if (!username || !password) {
      return Response.json(
        { error: "Missing username or password" },
        { status: 400 },
      );
    }
    // Find user by username
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1);

    if (!user || !user.password) {
      return Response.json(
        { error: "Invalid username or password" },
        { status: 401 },
      );
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return Response.json(
        { error: "Invalid username or password" },
        { status: 401 },
      );
    }

    // Do not return password
    const { password: _pw, ...safeUser } = user as typeof user & { password?: string };
    return Response.json({ message: "Login successful", user: safeUser });
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
