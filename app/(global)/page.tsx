"use client";
import { AnimatePresence, motion } from "framer-motion";
import { Hero } from "@/components/home/hero";
import { CTA } from "@/components/home/cta";
import { Features } from "@/components/home/features";
import { Testimonials } from "@/components/home/testimonials";
import { FAQ } from "@/components/home/faq";

export default function Home() {
  return (
    <AnimatePresence mode="sync">
      <motion.div
        key="content"
        className="min-h-screen"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2, ease: "easeInOut" }}
      >
        <Hero />
        <Features />
        <Testimonials />
        <CTA />
        <FAQ />
      </motion.div>
    </AnimatePresence>
  );
}
