/**
 * Campus access policy. SkillSwap is restricted to DSP F2I students, so only
 * `@etu-digitalschool.paris` addresses may sign up or sign in.
 *
 * This is the UX-level guard (instant feedback before an email is sent). The
 * hard guard lives in the database: the `profiles_campus_email_chk` CHECK
 * constraint runs inside the `handle_new_user()` trigger, so a non-campus
 * signup rolls back the `auth.users` insert even if this check is bypassed.
 */
export const CAMPUS_DOMAIN = "etu-digitalschool.paris";

export function isCampusEmail(email: string): boolean {
  const domain = email.split("@")[1]?.toLowerCase();
  return domain === CAMPUS_DOMAIN;
}
