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
    primary: "ConnectIQ",
    secondary: "Amplify Your Impact.",
  },
  description:
    "ConnectIQ is the AI-powered platform that connects and brings together business communities.",
  ctas: {
    primary: { href: "/signup", label: "Create Your Community" },
    secondary: { href: "/community", label: "Get Started" },
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