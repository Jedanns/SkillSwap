import { FeedList } from "@/components/feed/FeedList";
import type { PostAuthor, PostData } from "@/components/feed/types";
import { authorSelect, postInclude, serializeAuthor, serializePost } from "@/lib/feed/serialize";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

const LIMIT = 20;

export default async function FeedPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const currentUserId = user?.id ?? "";

  const currentUserProfile = user
    ? await prisma.profile.findUnique({
        where: { id: user.id },
        select: authorSelect,
      })
    : null;

  const currentUserAuthor: PostAuthor = currentUserProfile
    ? serializeAuthor(currentUserProfile)
    : {
        id: currentUserId,
        username: null,
        first_name: null,
        last_name: null,
        display_name: null,
        avatar_url: null,
      };

  const rawPosts = await prisma.post.findMany({
    take: LIMIT,
    orderBy: { createdAt: "desc" },
    include: postInclude,
  });

  const posts: PostData[] = rawPosts.map(serializePost);

  return (
    <div className="mx-auto w-full max-w-[680px] pb-12">
      <FeedList
        initialPosts={posts}
        initialHasMore={posts.length === LIMIT}
        currentUserId={currentUserId}
        currentUserAuthor={currentUserAuthor}
      />
    </div>
  );
}
