"use client";

import type { LucideIcon } from "lucide-react";
import {
  Home,
} from "lucide-react";

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
  ] as NavLink[],
} as const;
