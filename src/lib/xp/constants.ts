export const ACCOUNT_XP = {
  PROFILE_COMPLETE: 50,
  SESSION_COMPLETED: 30,
  EVALUATION_GIVEN: 20,
  EVALUATION_RECEIVED: 10,
} as const;

export const TUTOR_XP = {
  BASE_SESSION: 50,
  PER_RATING_STAR: 10, // max 50 for a 5-star rating
  STUDENT_PROGRESS_BONUS: 20,
} as const;

export const STUDENT_XP = {
  BASE_SESSION: 40,
  PER_RATING_STAR: 10, // max 50 for a 5-star rating
  PROGRESS_BONUS: 25,
} as const;
