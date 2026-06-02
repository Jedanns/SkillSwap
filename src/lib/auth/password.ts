import bcrypt from "bcryptjs";

const SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function validatePassword(password: string): string | null {
  if (password.length < 8)
    return "Le mot de passe doit contenir au moins 8 caractères.";
  if (!/[A-Z]/.test(password))
    return "Le mot de passe doit contenir au moins une majuscule.";
  if (!/[a-z]/.test(password))
    return "Le mot de passe doit contenir au moins une minuscule.";
  if (!/[0-9]/.test(password))
    return "Le mot de passe doit contenir au moins un chiffre.";
  return null;
}
