"use client";

import type { LucideIcon } from "lucide-react";
import { Home, Megaphone, Users, MessageCircle } from "lucide-react";

export type NavLink = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export const NAVBAR = {
  logo: {
    light: "/images/logo-primary.svg",
    dark: "/images/logo.svg",
    alt: "Logo",
    width: 32,
    height: 32,
  },
  name: {
    primary: "Connect",
    secondary: "IQ",
  },
  links: [
    { href: "/", label: "Home", icon: Home },
    { href: "/announcements", label: "Announcements", icon: Megaphone },
    { href: "/connections", label: "Connections", icon: Users },
    { href: "/chat", label: "Chat", icon: MessageCircle },
  ] as NavLink[],
} as const;
