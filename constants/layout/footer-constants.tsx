import {
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  LucideIcon,
} from "lucide-react";

export interface SocialLink {
  href: string;
  icon: LucideIcon;
  label: string;
}

export interface FooterLink {
  href: string;
  label: string;
}

export interface FooterSection {
  title: string;
  links: FooterLink[];
}

export interface ContactInfo {
  address: {
    line1: string;
    line2: string;
    line3: string;
  };
  email: string;
  phone: string;
}

export interface FooterConfig {
  companyName: {
    primary: string;
    secondary: string;
  };
  tagline: string;
  socialLinks: SocialLink[];
  sections: FooterSection[];
  contactInfo: ContactInfo;
  legal: {
    copyrightText: string;
    links: FooterLink[];
  };
}

export const footerConfig: FooterConfig = {
  companyName: {
    primary: "Connect",
    secondary: "IQ",
  },
  tagline:
    "ConnectIQ is a platform for connecting business with AI.",
  socialLinks: [
    {
      href: "https://facebook.com",
      icon: Facebook,
      label: "Facebook",
    },
    {
      href: "https://twitter.com",
      icon: Twitter,
      label: "Twitter",
    },
    {
      href: "https://instagram.com",
      icon: Instagram,
      label: "Instagram",
    },
    {
      href: "https://linkedin.com",
      icon: Linkedin,
      label: "LinkedIn",
    },
  ],
  sections: [
    {
      title: "Platform",
      links: [
        { href: "/", label: "Home" },
        { href: "/templates", label: "Templates" },
        { href: "/community", label: "Community" },
      ],
    },
    {
      title: "Business",
      links: [
        { href: "/announcements", label: "Announcements" },
        { href: "/events", label: "Events" },
        { href: "/about", label: "About" },
      ],
    },
  ],
  contactInfo: {
    address: {
      line1: "ConnectIQ",
      line2: "Surat, Gujarat, India",
      line3: "",
    },
    email: "contact@connectiq.com",
    phone: "+91 12345 67890",
  },
  legal: {
    copyrightText: "ConnectIQ. All rights reserved.",
    links: [],
  },
};
