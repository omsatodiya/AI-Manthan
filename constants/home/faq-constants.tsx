"use client";

export type FaqItem = {
  question: string;
  answer: string;
};

export const FAQ_CONTENT = {
  id: "faq",
  eyebrow: "FAQ",
  title: "Your Questions, Answered",
  description:
    "Find out more about how ConnectIQ can transform your community management.",
  items: [
    {
      question: "How does the AI opportunity matching work?",
      answer:
        "Our AI analyzes member profiles, interests, and community discussions to automatically surface relevant grants, jobs, and collaboration opportunities, sending targeted notifications so the right people see them.",
    },
    {
      question: "Is my community's data secure?",
      answer:
        "Absolutely. ConnectIQ is built on a secure, multi-tenant architecture, ensuring each community's data is completely isolated and protected.",
    },
    {
      question: "What kind of communities can use ConnectIQ?",
      answer:
        "ConnectIQ is designed for a wide range of groups, including startup incubators, professional networks, non-profits, student clubs, and enterprise teams. If you need to collaborate and share knowledge, we're for you.",
    },
    {
      question: "Can it integrate with tools we already use?",
      answer:
        "While ConnectIQ aims to be an all-in-one solution, we are developing integrations for essential tools. Our goal is to centralize, not complicate, your workflow.",
    },
  ] as FaqItem[],
} as const;