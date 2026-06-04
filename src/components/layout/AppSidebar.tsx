"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Calendar, GraduationCap, History, Home, MessageSquare, Rss, Star, Trophy, TrendingUp } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
} from "@/components/ui/sidebar";

const navMain = [
  { icon: Home, label: "Accueil", href: "/home" },
  { icon: Rss, label: "Fil d'actualité", href: "/feed" },
  { icon: BookOpen, label: "Compétences", href: "/competences" },
  { icon: GraduationCap, label: "Tutoring", href: "/sessions" },
  { icon: Calendar, label: "Planning", href: "/planning" },
  { icon: MessageSquare, label: "Messages", href: "/messages" },
  { icon: Star, label: "Feedback", href: "/feedback" },
  { icon: TrendingUp, label: "Progression", href: "/progression" },
  { icon: History, label: "Historique", href: "/historique" },
  { icon: Trophy, label: "Classement", href: "/leaderboard" },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon" variant="sidebar">
      <SidebarHeader className="h-[60px] justify-center border-b border-sidebar-border px-2">
        <SidebarTrigger className="h-9 w-9" />
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navMain.map(({ icon: Icon, label, href }) => (
                <SidebarMenuItem key={label}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname.startsWith(href)}
                    tooltip={label}
                  >
                    <Link href={href}>
                      <Icon />
                      <span>{label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
