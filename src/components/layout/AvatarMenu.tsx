"use client";

import Link from "next/link";
import { LogOut, Settings, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { logoutAction } from "@/lib/auth/actions";
import { profileDisplayName, profileInitials } from "@/lib/profile/display";

type Props = {
  profile: {
    username: string | null;
    firstName: string | null;
    lastName: string | null;
    displayName: string | null;
    avatarUrl: string | null;
  };
};

export function AvatarMenu({ profile }: Props) {
  const name = profileDisplayName(profile);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-foreground/20" aria-label="Menu du profil">
          <Avatar className="h-8 w-8">
            <AvatarImage src={profile.avatarUrl ?? undefined} />
            <AvatarFallback className="bg-primary text-xs font-semibold text-primary-foreground">
              {profileInitials(profile)}
            </AvatarFallback>
          </Avatar>
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={8} className="w-56 p-1">
        <div className="border-b px-3 py-2">
          <p className="truncate text-sm font-semibold">{name}</p>
          {profile.username && <p className="truncate text-xs text-muted-foreground">@{profile.username}</p>}
        </div>
        <div className="py-1">
          <Link href="/profile" className="flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-muted">
            <User className="h-4 w-4" /> Mon profil
          </Link>
          <Link href="/settings" className="flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-muted">
            <Settings className="h-4 w-4" /> Paramètres
          </Link>
        </div>
        <form action={logoutAction} className="border-t pt-1">
          <button type="submit" className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-red-600 transition-colors hover:bg-red-50">
            <LogOut className="h-4 w-4" /> Se déconnecter
          </button>
        </form>
      </PopoverContent>
    </Popover>
  );
}
