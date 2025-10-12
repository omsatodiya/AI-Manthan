"use client";

import { motion } from "framer-motion";
import { MessageCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { ConversationList } from "@/components/chat/ConversationList";
import { AuthUser } from "@/lib/types";

interface ChatPageClientProps {
  currentUser: AuthUser;
}

export default function ChatPageClient({ currentUser }: ChatPageClientProps) {
  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-4xl">
      {/* Back Button */}
      <div className="mb-6">
        <Button
          variant="ghost"
          asChild
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <Link href="/">
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back to Home</span>
            <span className="sm:hidden">Back</span>
          </Link>
        </Button>
      </div>

      {/* Header */}
      <div className="mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
            <MessageCircle className="h-6 w-6 sm:h-8 sm:w-8" />
            Chat
          </h1>
          <p className="text-muted-foreground mt-2 text-sm sm:text-base">
            Connect and chat with your professional network
          </p>
        </motion.div>
      </div>

      {/* Conversation List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <ConversationList currentUser={currentUser} />
      </motion.div>
    </div>
  );
}
