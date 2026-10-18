import { SignJWT, jwtVerify, CompactEncrypt, compactDecrypt } from 'jose';
import { cookies } from 'next/headers';

const SECRET_KEY = Buffer.from(
  (process.env.AUTH_SECRET || 'foryourgoal_mail_secret_key_2026_material_workspace_secure_token_993!').padEnd(32, '0').slice(0, 32)
);

export interface UserSession {
  email: string;
  password?: string;
  displayName?: string;
  avatarUrl?: string;
}

export const COOKIE_NAME = 'mail_session';

export async function encryptSession(data: UserSession): Promise<string> {
  const plaintext = new TextEncoder().encode(JSON.stringify(data));
  return await new CompactEncrypt(plaintext)
    .setProtectedHeader({ alg: 'dir', enc: 'A256GCM' })
    .encrypt(SECRET_KEY);
}

export async function decryptSession(token: string): Promise<UserSession | null> {
  try {
    const { plaintext } = await compactDecrypt(token, SECRET_KEY);
    const decoded = new TextDecoder().decode(plaintext);
    return JSON.parse(decoded) as UserSession;
  } catch (error) {
    return null;
  }
}

export async function getSession(): Promise<UserSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return await decryptSession(token);
}
