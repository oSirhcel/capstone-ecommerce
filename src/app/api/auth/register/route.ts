import { db } from "@/server/db";
import { users } from "@/server/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      username: string;
      password: string;
    };
    const { username, password } = body;

    // TODO: Proper validation
    if (!username || !password) {
      return Response.json(
        { error: "Missing username or password" },
        { status: 400 },
      );
    }

    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.username, username));
    if (existingUser.length > 0) {
      return Response.json(
        { error: "Username already exists" },
        { status: 400 },
      );
    }

    const user = await db.insert(users).values({
      id: crypto.randomUUID(),
      username,
      password,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return Response.json({ message: "Registration successful", user });
  } catch (error: unknown) {
    const message =
      typeof error === "object" && error && "message" in error
        ? (error as { message: string }).message
        : "Invalid request";
    return Response.json({ error: message }, { status: 400 });
  }
}
