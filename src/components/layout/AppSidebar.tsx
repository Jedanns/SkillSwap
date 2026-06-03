"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  Calendar,
  LayoutDashboard,
  MessageSquare,
  Rss,
  User,
} from "lucide-react";

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
  SidebarSeparator,
  SidebarTrigger,
} from "@/components/ui/sidebar";

const navMain = [
  { icon: Rss, label: "Fil d'actualité", href: "/feed" },
  { icon: LayoutDashboard, label: "Dashboard", href: "#" },
  { icon: BookOpen, label: "Sessions", href: "#" },
  { icon: Calendar, label: "Planning", href: "/planning" },
];

const navSecondary = [
  { icon: MessageSquare, label: "Messages", href: "#" },
  { icon: User, label: "Profil", href: "#" },
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
                    asChild={href !== "#"}
                    isActive={href !== "#" && pathname.startsWith(href)}
                    tooltip={label}
                  >
                    {href !== "#" ? (
                      <Link href={href}>
                        <Icon />
                        <span>{label}</span>
                      </Link>
                    ) : (
                      <>
                        <Icon />
                        <span>{label}</span>
                      </>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel>Compte</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navSecondary.map(({ icon: Icon, label, href }) => (
                <SidebarMenuItem key={label}>
                  <SidebarMenuButton
                    asChild={href !== "#"}
                    isActive={href !== "#" && pathname.startsWith(href)}
                    tooltip={label}
                  >
                    {href !== "#" ? (
                      <Link href={href}>
                        <Icon />
                        <span>{label}</span>
                      </Link>
                    ) : (
                      <>
                        <Icon />
                        <span>{label}</span>
                      </>
                    )}
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
