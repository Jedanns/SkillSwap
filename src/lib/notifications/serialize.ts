import { profileDisplayName } from "@/lib/profile/display";

export type NotificationActor = {
  id: string;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  displayName: string | null;
  avatarUrl: string | null;
};

export type NotificationItem = {
  id: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  entityType: string | null;
  entityId: string | null;
  data: Record<string, unknown> | null;
  actor: NotificationActor | null;
};

type Row = {
  id: string;
  type: string;
  isRead: boolean;
  createdAt: Date;
  entityType: string | null;
  entityId: string | null;
  data: unknown;
  actor: NotificationActor | null;
};

export function serializeNotification(n: Row): NotificationItem {
  return {
    id: n.id,
    type: n.type,
    isRead: n.isRead,
    createdAt: n.createdAt.toISOString(),
    entityType: n.entityType,
    entityId: n.entityId,
    data: n.data && typeof n.data === "object" && !Array.isArray(n.data) ? (n.data as Record<string, unknown>) : null,
    actor: n.actor,
  };
}

/**
 * Pure presentation: maps a notification to its sentence + deep link. Shared by
 * the bell so the wording lives in one place. Safe in client components.
 */
export function describeNotification(n: NotificationItem): { text: string; href: string; preview: string | null } {
  const actor = n.actor ? profileDisplayName(n.actor) : "Quelqu'un";
  const d = n.data ?? {};
  const str = (k: string) => (typeof d[k] === "string" ? (d[k] as string) : null);
  const title = str("title");
  const skillName = str("skillName");

  switch (n.type) {
    case "MESSAGE_RECEIVED":
      return { text: `${actor} vous a envoyé un message`, href: `/messages/${n.entityId ?? ""}`, preview: str("messagePreview") };
    case "PING_RECEIVED":
      return { text: `${actor} cherche un tuteur en ${skillName ?? "une compétence"}`, href: `/sessions`, preview: str("message") };
    case "SESSION_PROPOSED":
      return { text: `${actor} vous propose une session${title ? ` : ${title}` : ""}`, href: `/sessions`, preview: null };
    case "SESSION_INVITED":
      return { text: `${actor} vous invite à une session${title ? ` : ${title}` : ""}`, href: `/sessions`, preview: null };
    case "SESSION_APPROVED":
      return { text: `${actor} a accepté votre session`, href: `/sessions`, preview: null };
    case "SESSION_DECLINED":
      return { text: `${actor} a décliné votre session`, href: `/sessions`, preview: null };
    case "SESSION_CANCELLED":
      return { text: `Session annulée${title ? ` : ${title}` : ""}`, href: `/sessions`, preview: null };
    case "SESSION_COMPLETED":
      return { text: `Session terminée — pensez à laisser un feedback`, href: `/feedback`, preview: null };
    case "FEEDBACK_REQUEST":
      return { text: `Donnez votre feedback${title ? ` : ${title}` : ""}`, href: `/feedback`, preview: null };
    case "EVALUATION_RESULT":
      return { text: d.passed ? "Évaluation réussie — compétence acquise !" : "Évaluation : compétence non acquise", href: `/competences`, preview: null };
    case "POST_LIKED":
      return { text: `${actor} a aimé votre publication`, href: `/feed`, preview: null };
    case "POST_COMMENTED":
      return { text: `${actor} a commenté votre publication`, href: `/feed`, preview: null };
    case "SKILL_CERTIFIED":
      return { text: `${skillName ?? "Une compétence"} est désormais certifiée`, href: `/competences`, preview: null };
    case "LEVEL_UP":
      return { text: `Niveau supérieur débloqué !`, href: `/progression`, preview: null };
    default:
      return { text: "Nouvelle notification", href: `/home`, preview: null };
  }
}
