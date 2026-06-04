# SkillSwap — Deferred work (follow-up)

This pass completed the student-facing product end-to-end (tutoring lifecycle,
feedback/reviews, gamification, profiles, dashboard, search, feed, notifications)
and the expert **certification flow** (Volet 6). Two large areas were intentionally
deferred and are documented here so nothing is silently dropped.

---

## 1. WebRTC audio / video calls (MVP-tagged, deferred by decision)

**Status:** placeholder only. The session chat header shows **disabled** audio and
video buttons (`src/components/messages/ChatWindow.tsx`, marked
`// WebRTC … deferred`). The text chat and Supabase Realtime are fully working and
are the foundation the signaling will reuse.

**Plan when picked up:**
- Use the browser-native `RTCPeerConnection` + `getUserMedia({ audio, video })`
  (and `getDisplayMedia()` for screen share — a V2 item).
- Use **Supabase Realtime broadcast** on a per-session channel as the signaling
  transport: exchange the SDP offer/answer and ICE candidates. No external SFU/lib.
- STUN: the free `stun:stun.l.google.com:19302`. P2P only (campus scale); add a TURN
  relay only if NAT traversal fails in practice.
- New component `SessionCall` mounted in the session room; gate the call controls to
  `IN_PROGRESS` sessions. Re-enable the buttons added in `ChatWindow`.
- No schema change required (signaling is ephemeral).

## 2. Admin / établissement panel (deferred by decision)

**Status:** not built. Requires new data + routes.

**Plan when picked up:**
- Schema: add `enum Role { STUDENT ADMIN }` and `role Role @default(STUDENT)` on
  `Profile` (+ a Supabase migration; backfill referents manually). Add moderation
  fields if needed (`isSuspended`, a `Report` model).
- Route protection: extend `src/proxy.ts` / the `(app)` layout with an `/admin`
  guard checking `role === ADMIN` (authoritative check via `getUser` + a Prisma read).
- Screens (`src/app/(app)/admin/...`):
  - **Modération** — list `Report`s, suspend/ban accounts (without deleting history),
    remove feed posts.
  - **Statistiques** — active users, total sessions, most-exchanged skills, activity
    by promotion; CSV export.
  - **Configuration** — manage the skill catalogue (rename/archive), tune gamification
    via the existing `LevelThreshold` table (already in the schema), pinned announcements.
- The signup email-domain restriction (`@etu-digitalschool.paris`) is enforced in
  Supabase Auth config, not in app code — note for the admin onboarding flow.

---

## Minor follow-ups / known limitations

- **Session auto-settle** is lazy (runs on session-list / planning / history reads via
  `settleDueSessions()` in `src/lib/sessions/mutations.ts`). For punctual settlement
  independent of traffic, add a `pg_cron` job calling a settle RPC, or a Vercel Cron
  hitting an authenticated route. Not required for correctness.
- **Skill heat decay** (`Skill.heatScore`) has no scheduled decay job yet; heat only
  increases. A nightly cron should decay it so dormant skills demote in search.
- **Group/public sessions**: the data model + invite path (`inviteToSession`) are in
  place; a richer public-session discovery UI (browse public sessions to join) is a
  natural next step.
