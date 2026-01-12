import bcrypt from "bcryptjs";
import { eq, or } from "drizzle-orm";
import { users } from "../drizzle/schema";
import { getDb } from "./db";
import crypto from "crypto";

const SALT_ROUNDS = 10;

/**
 * Hash de senha usando bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verificar senha contra hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Gerar token aleatório para verificação de email ou reset de senha
 */
export function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Gerar openId único para usuários que se cadastram via email/senha
 */
export function generateLocalOpenId(): string {
  return `local_${crypto.randomBytes(16).toString("hex")}`;
}

/**
 * Buscar usuário por email
 */
export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  
  return result.length > 0 ? result[0] : null;
}

/**
 * Buscar usuário por token de reset de senha
 */
export async function getUserByResetToken(token: string) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db
    .select()
    .from(users)
    .where(eq(users.passwordResetToken, token))
    .limit(1);
  
  return result.length > 0 ? result[0] : null;
}

/**
 * Criar novo usuário com email e senha
 */
export async function createUserWithPassword(data: {
  email: string;
  password: string;
  name: string;
  telefone?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const passwordHash = await hashPassword(data.password);
  const openId = generateLocalOpenId();
  
  await db.insert(users).values({
    openId,
    email: data.email,
    name: data.name,
    telefone: data.telefone || null,
    passwordHash,
    loginMethod: "email",
    emailVerified: 0,
    lastSignedIn: new Date(),
  });
  
  // Buscar o usuário criado
  const result = await db
    .select()
    .from(users)
    .where(eq(users.openId, openId))
    .limit(1);
  
  return result[0];
}

/**
 * Atualizar senha do usuário
 */
export async function updateUserPassword(userId: number, newPassword: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const passwordHash = await hashPassword(newPassword);
  
  await db
    .update(users)
    .set({
      passwordHash,
      passwordResetToken: null,
      passwordResetExpires: null,
    })
    .where(eq(users.id, userId));
}

/**
 * Definir token de reset de senha
 */
export async function setPasswordResetToken(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const token = generateToken();
  const expires = new Date(Date.now() + 3600000); // 1 hora
  
  await db
    .update(users)
    .set({
      passwordResetToken: token,
      passwordResetExpires: expires,
    })
    .where(eq(users.id, userId));
  
  return token;
}

/**
 * Atualizar último login
 */
export async function updateLastSignedIn(userId: number) {
  const db = await getDb();
  if (!db) return;
  
  await db
    .update(users)
    .set({ lastSignedIn: new Date() })
    .where(eq(users.id, userId));
}

/**
 * Verificar se email já está em uso
 */
export async function isEmailInUse(email: string): Promise<boolean> {
  const user = await getUserByEmail(email);
  return user !== null;
}
