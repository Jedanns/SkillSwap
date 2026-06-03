import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendAccountCompletionEmail(
  email: string,
  token: string,
): Promise<void> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const link = `${baseUrl}/complete-account?token=${token}`;

  await resend.emails.send({
    from: process.env.EMAIL_FROM ?? "onboarding@resend.dev",
    to: email,
    subject: "Finalisez votre compte",
    html: `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8" /></head>
<body style="font-family: sans-serif; color: #111; max-width: 600px; margin: 0 auto; padding: 32px;">
  <h1 style="font-size: 24px; margin-bottom: 16px;">Finalisez votre compte SkillSwap</h1>
  <p>Bonjour,</p>
  <p>Cliquez sur le lien suivant pour compléter votre inscription :</p>
  <p style="margin: 24px 0;">
    <a href="${link}"
       style="background: #111; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600;">
      Finaliser mon compte
    </a>
  </p>
  <p style="color: #555; font-size: 14px;">
    Ou copiez ce lien dans votre navigateur :<br />
    <a href="${link}" style="color: #555;">${link}</a>
  </p>
  <p style="color: #888; font-size: 12px; margin-top: 32px;">Ce lien expire dans 24 heures.</p>
</body>
</html>
    `.trim(),
  });
}
