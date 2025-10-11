"use client";

export type Testimonial = {
  content: string;
  author: string;
  role: string;
  avatar: string;
  rating: number;
};

export const TESTIMONIALS_CONTENT = {
  id: "testimonials",
  eyebrow: "Testimonials",
  title: "Trusted by Innovative Communities",
  description:
    "See how leaders are using ConnectIQ to foster growth and collaboration.",
  items: [
    {
      content:
        "We used to miss so many grant deadlines because notifications were buried in chat threads. ConnectIQ's opportunity matching is a game-changer for us.",
      author: "Priya Sharma",
      role: "Startup Incubator Manager",
      avatar:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=256&q=80",
      rating: 5,
    },
    {
      content:
        "Our member engagement has skyrocketed since we switched. The gamification features make participation fun, and the AI summaries keep everyone in the loop.",
      author: "David Chen",
      role: "Non-Profit Coordinator",
      avatar:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=256&q=80",
      rating: 5,
    },
    {
      content:
        "The smart knowledgebase is incredible. New members can find answers to their questions instantly without having to ask repetitive questions. It has saved our team countless hours.",
      author: "Maria Garcia",
      role: "University Alumni Network Head",
      avatar:
        "https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=256&q=80",
      rating: 5,
    },
    {
      content:
        "As a fully remote team, keeping track of decisions was tough. The voice-to-action and summarization features ensure no idea is lost and everyone is aligned.",
      author: "Ben Carter",
      role: "Head of Product",
      avatar:
        "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=256&q=80",
      rating: 5,
    },
    {
      content:
        "Finally, a single platform that does it all. We've replaced Slack, Google Drive, and our old forum. ConnectIQ is cleaner, smarter, and more efficient.",
      author: "Kenji Tanaka",
      role: "Professional Association Lead",
      avatar:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=256&q=80",
      rating: 5,
    },
    {
      content:
        "The setup was seamless, and the platform is incredibly intuitive. Our community adopted it overnight. The analytics dashboard gives us the insights we needed to grow.",
      author: "Sophie Dubois",
      role: "Community Manager",
      avatar:
        "https://images.unsplash.com/photo-1544005313-94ddf0286df2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=256&q=80",
      rating: 5,
    },
  ] as Testimonial[],
  communityAvatars: [
    "https://images.unsplash.com/photo-1517841905240-472988babdf9?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=128&q=80",
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=128&q=80",
    "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=128&q=80",
    "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=128&q=80",
    "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=128&q=80",
  ],
} as const;