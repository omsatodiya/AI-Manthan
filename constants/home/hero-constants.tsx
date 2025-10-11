"use client";

import type { LucideIcon } from "lucide-react";
import { Clock, Combine, Lightbulb, TrendingUp } from "lucide-react";

export type HeroHighlight = {
  icon: LucideIcon;
  title: string;
  description: string;
};

export const HERO_CONTENT = {
  id: "hero",
  headline: {
    primary: "Unify Your Community.",
    secondary: "Amplify Your Impact.",
  },
  description:
    "ConnectIQ is the AI-powered platform that brings your community's conversations, knowledge, and opportunities into a single, intelligent hub.",
  ctas: {
    primary: { href: "/signup", label: "Create Your Community" },
    secondary: { href: "/demo", label: "Watch a Demo" },
  },
  highlights: [
    {
      icon: TrendingUp,
      title: "2x",
      description: " HigherMember Engagement",
    },
    {
      icon: Lightbulb,
      title: "40%",
      description: "More Opportunities Found",
    },
    {
      icon: Clock,
      title: "10+",
      description: "Hours Saved Weekly",
    },
    {
      icon: Combine,
      title: "3+",
      description: "Tools Replaced in One",
    },
  ] as HeroHighlight[],
} as const;