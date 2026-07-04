import { eq } from "drizzle-orm";
import { users } from "@db/schema";
import { getDb } from "./connection";

export async function findUserByEmail(email: string) {
  return getDb().query.users.findFirst({
    where: eq(users.email, email.toLowerCase()),
  });
}

export async function findUserById(id: number) {
  return getDb().query.users.findFirst({
    where: eq(users.id, id),
  });
}
