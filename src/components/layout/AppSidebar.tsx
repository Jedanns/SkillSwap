"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Calendar, GraduationCap, Rss } from "lucide-react";

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
  { icon: Rss, label: "Fil d'actualité", href: "/feed" },
  { icon: BookOpen, label: "Compétences", href: "/competences" },
  { icon: GraduationCap, label: "Sessions", href: "/sessions" },
  { icon: Calendar, label: "Planning", href: "/planning" },
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
