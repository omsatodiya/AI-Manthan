import {
  BarChart,
  Bell,
  BrainCircuit,
  Lightbulb,
  LucideIcon,
  MessageSquareText,
} from "lucide-react";

export interface CTABadge {
  text: string;
}

export interface CTAHeading {
  title: string;
  subtitle: string;
}

export interface CTAFeature {
  icon: LucideIcon;
  title: string;
  description: string;
}

export interface CTAButton {
  text: string;
  href: string;
  variant: "primary" | "secondary";
}

export interface DashboardItem {
  icon: LucideIcon;
  title: string;
  time: string;
  content: string;
}

export interface CTADashboard {
  title: string;
  patientName: string;
  items: DashboardItem[];
}

export interface CTAConfig {
  badge: CTABadge;
  heading: CTAHeading;
  features: CTAFeature[];
  buttons: CTAButton[];
  dashboard: CTADashboard;
}

export const ctaConfig: CTAConfig = {
  badge: {
    text: "AI-Powered Community Growth",
  },
  heading: {
    title: "The All-in-One Platform for Thriving Communities",
    subtitle:
      "Stop juggling tools. ConnectIQ centralizes conversations, knowledge, and opportunities with the power of AI.",
  },
  features: [
    {
      icon: Lightbulb,
      title: "Smart Opportunity Matching",
      description:
        "AI connects members with relevant grants, projects, and collaborations, ensuring no opportunity is missed.",
    },
    {
      icon: BrainCircuit,
      title: "Automated Knowledge Hub",
      description:
        "Instantly find answers, get AI-summarized discussions, and access shared documents with natural language search.",
    },
  ],
  buttons: [
    {
      text: "Start Your Community",
      href: "/signup",
      variant: "primary",
    },
    {
      text: "Get Started",
      href: "/community",
      variant: "secondary",
    },
  ],
  dashboard: {
    title: "Your Community Dashboard",
    patientName: "Innovators Hub",
    items: [
      {
        icon: Bell,
        title: "New Opportunity Alert",
        time: "Just now",
        content:
          "A new government grant matching your community's profile has been posted.",
      },
      {
        icon: BarChart,
        title: "Weekly Engagement Report",
        time: "8:00 AM",
        content:
          "Engagement is up 15% this week. Top contributor: Anita Sharma.",
      },
      {
        icon: MessageSquareText,
        title: "AI Summary Ready",
        time: "Yesterday",
        content:
          "The 'Q3 Strategy' discussion has been summarized. View key action items now.",
      },
    ],
  },
};