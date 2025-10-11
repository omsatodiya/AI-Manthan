"use client";

import type { LucideIcon } from "lucide-react";
import {
  BarChart,
  FileText,
  MessageSquareText,
  Mic,
  Search,
  ShieldCheck,
  Trophy,
  Users,
} from "lucide-react";

export type FeatureItem = {
  icon: LucideIcon;
  title: string;
  description: string;
};

export const FEATURES_CONTENT = {
  id: "features",
  eyebrow: "Features",
  title: "A Complete Toolkit for Community Success",
  description:
    "ConnectIQ combines everything you need to manage, engage, and grow your community in one intelligent platform.",
  items: [
    {
      icon: Users,
      title: "Opportunity Matching Engine",
      description:
        "AI-driven engine that connects members with the most relevant grants, jobs, and collaborations.",
    },
    {
      icon: MessageSquareText,
      title: "AI Discussion Summaries",
      description:
        "Automatically condense long conversations into clear, actionable summaries so no one misses key decisions.",
    },
    {
      icon: Search,
      title: "Smart Knowledgebase",
      description:
        "A central hub for all documents and conversations, searchable with natural language queries.",
    },
    {
      icon: BarChart,
      title: "Participation Analytics",
      description:
        "Gain insights into community health, identify key contributors, and track engagement trends over time.",
    },
    {
      icon: Trophy,
      title: "Gamification & Engagement",
      description:
        "Boost participation with points, badges, and leaderboards for active and valuable contributions.",
    },
    {
      icon: FileText,
      title: "AI-Powered Templates",
      description:
        "Generate proposals, reports, and announcements in seconds with context-aware AI assistance.",
    },
    {
      icon: ShieldCheck,
      title: "Secure Multi-Tenant Spaces",
      description:
        "Ensure data privacy and security with completely isolated and dedicated spaces for your community.",
    },
    {
      icon: Mic,
      title: "Voice-to-Action",
      description:
        "Capture ideas on the go. Members can drop voice notes that our AI converts into tasks or posts.",
    },
  ] as FeatureItem[],
} as const;