export type PostAuthor = {
  id: string;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  display_name: string | null;
  avatar_url: string | null;
};

export type CommentData = {
  id: string;
  body: string;
  created_at: string;
  profiles: PostAuthor;
};

export type PostData = {
  id: string;
  content: string;
  kind: "GENERAL" | "TUTORING_OFFER" | "ANNOUNCEMENT";
  createdAt: string;
  like_count: number;
  comment_count: number;
  author: PostAuthor;
  likes: { profile_id: string }[];
  comments: CommentData[];
};
