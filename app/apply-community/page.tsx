"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Loader2,
  CheckCircle2,
  Building2,
  Globe,
  FileText,
  Sparkles,
  Rocket,
  ShieldCheck,
  Zap
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { submitTenantApplicationAction } from "@/app/actions/tenant-application";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const formSchema = z.object({
  orgName: z
    .string()
    .min(2, "Organization name must be at least 2 characters.")
    .max(100, "Organization name must be less than 100 characters."),
  requestedSlug: z
    .string()
    .min(3, "Slug must be at least 3 characters.")
    .max(30, "Slug must be less than 30 characters.")
    .regex(
      slugRegex,
      "Slug must contain only lowercase letters, numbers, and hyphens, and cannot start or end with a hyphen."
    ),
  description: z
    .string()
    .max(500, "Description must be less than 500 characters.")
    .optional(),
  isPublic: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

export default function ApplyCommunityPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      orgName: "",
      requestedSlug: "",
      description: "",
      isPublic: true,
    },
  });

  async function onSubmit(values: FormValues) {
    setIsLoading(true);
    try {
      const result = await submitTenantApplicationAction(values);

      if (result.success) {
        toast.success("Application submitted successfully!");
        setIsSubmitted(true);
      } else {
        toast.error(result.error || "Failed to submit application.");
      }
    } catch (error) {
      toast.error("An unexpected error occurred. Please try again.");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }

  if (!mounted) return null;

  if (isSubmitted) {
    return (
      <div className="relative flex min-h-[90vh] items-center justify-center p-4 bg-gradient-to-br from-[#f6f7fb] via-[#f2f7f4] to-[#fef7f3] dark:from-[#0b0e14] dark:via-[#111827] dark:to-[#0b1220]">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="max-w-md w-full z-10"
        >
          <Card className="text-center p-8 bg-card border border-border/70 rounded-2xl shadow-xl">
            <CardHeader>
              <div className="flex justify-center mb-6">
                <div className="h-24 w-24 rounded-full bg-secondary flex items-center justify-center">
                  <CheckCircle2 className="h-12 w-12 text-primary" />
                </div>
              </div>
              <CardTitle className="text-3xl font-serif font-medium text-foreground">
                Application Received!
              </CardTitle>
              <CardDescription className="text-lg mt-3 text-foreground/70 font-sans leading-relaxed">
                Your vision for a new community is now in our hands. Our team will review your request with care.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-2">
              <div className="p-4 rounded-xl bg-secondary text-sm">
                <p className="text-foreground/70 font-sans italic">
                  &quot;The best way to predict the future is to create it.&quot;
                </p>
              </div>
              <div className="flex flex-col gap-3">
                <Button
                  onClick={() => router.push("/")}
                  className="w-full h-12 bg-primary hover:bg-chart-2 text-primary-foreground font-sans font-semibold rounded-md"
                >
                  Return Home
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setIsSubmitted(false)}
                  className="w-full h-12 hover:bg-secondary font-sans font-medium"
                >
                  Submit Another Application
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen pb-20 bg-gradient-to-br from-[#f6f7fb] via-[#f2f7f4] to-[#fef7f3] dark:from-[#0b0e14] dark:via-[#111827] dark:to-[#0b1220]">
      <div className="container mx-auto max-w-4xl pt-24 px-4 sm:px-6 relative z-10">
        <div className="flex flex-col gap-10 items-center text-center">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-4 items-center"
          >
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary text-primary text-xs font-bold uppercase tracking-wider mb-4 font-sans">
                <Sparkles className="h-3 w-3" />
                Found Your Future
              </div>
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl tracking-tight text-foreground mb-6">
                <span className="font-serif font-medium">Apply for</span>
                <span className="block font-sans font-bold text-primary dark:text-foreground mt-1 md:mt-2">
                  Community Growth
                </span>
              </h1>
              <p className="text-lg md:text-xl text-foreground/80 max-w-2xl mt-4 leading-relaxed mx-auto font-sans">
                ConnectIQ provides the infrastructure. You provide the passion. Let&apos;s build something extraordinary together.
              </p>
            </div>
          </motion.div>

          <div className="w-full max-w-2xl">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <Card className="bg-card border border-border/70 rounded-2xl shadow-xl overflow-hidden">
                <CardHeader className="pb-4 text-left border-b border-border/30 bg-muted/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-2xl font-serif font-medium">Launch Configuration</CardTitle>
                      <CardDescription className="mt-1 font-sans">
                        Configure your community identity and access.
                      </CardDescription>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center text-primary">
                      <Rocket className="h-6 w-6" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="text-left pt-8">
                  <Form {...form}>
                    <form
                      onSubmit={form.handleSubmit(onSubmit)}
                      className="space-y-8"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="orgName"
                          render={({ field }) => (
                            <FormItem className="space-y-3">
                              <FormLabel className="text-sm font-semibold tracking-wide uppercase text-foreground/70 flex items-center gap-2 font-sans">
                                <Building2 className="h-3.5 w-3.5 text-primary" />
                                Organization Name
                              </FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="e.g. AI Innovators Hub"
                                  {...field}
                                  disabled={isLoading}
                                  className="h-12 bg-background border-border/50 focus:border-primary focus:ring-primary/20 transition-all text-base font-sans rounded-md"
                                />
                              </FormControl>
                              <FormMessage className="text-xs font-medium" />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="requestedSlug"
                          render={({ field }) => (
                            <FormItem className="space-y-3">
                              <FormLabel className="text-sm font-semibold tracking-wide uppercase text-foreground/70 flex items-center gap-2 font-sans">
                                <Globe className="h-3.5 w-3.5 text-primary" />
                                URL Slug
                              </FormLabel>
                              <FormControl>
                                <div className="relative group">
                                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-foreground/50 text-sm font-medium border-r border-border pr-3 group-focus-within:text-primary transition-colors">
                                    iq.app/
                                  </div>
                                  <Input
                                    placeholder="my-hub"
                                    {...field}
                                    disabled={isLoading}
                                    className="h-12 pl-[70px] bg-background border-border/50 focus:border-primary focus:ring-primary/20 transition-all text-base font-sans rounded-md"
                                    onChange={(e) => {
                                      const val = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "").replace(/\s+/g, "-");
                                      field.onChange(val);
                                    }}
                                  />
                                </div>
                              </FormControl>
                              <FormMessage className="text-xs font-medium" />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem className="space-y-3">
                            <FormLabel className="text-sm font-semibold tracking-wide uppercase text-foreground/70 flex items-center gap-2 font-sans">
                              <FileText className="h-3.5 w-3.5 text-primary" />
                              Mission Statement
                            </FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Describe the impact you want to make..."
                                {...field}
                                disabled={isLoading}
                                className="min-h-[140px] bg-background border-border/50 focus:border-primary focus:ring-primary/20 transition-all text-base font-sans resize-none p-4 rounded-md"
                              />
                            </FormControl>
                            <div className="flex justify-between items-center px-1">
                              <FormDescription className="text-xs font-sans">
                                Explain the core purpose of your community.
                              </FormDescription>
                              <span className={cn(
                                "text-[10px] font-mono",
                                (field.value?.length || 0) > 450 ? "text-destructive" : "text-foreground/50"
                              )}>
                                {field.value?.length || 0}/500
                              </span>
                            </div>
                            <FormMessage className="text-xs font-medium" />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="isPublic"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-xl border border-border/50 p-4 bg-muted/10">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base font-serif font-medium">Public Visibility</FormLabel>
                              <FormDescription className="text-xs font-sans">
                                Allow your community to be discovered by others in the network.
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                disabled={isLoading}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <Button
                        type="submit"
                        className="w-full h-14 text-lg font-bold bg-primary hover:bg-chart-2 text-primary-foreground font-sans rounded-md transition-all active:scale-[0.98]"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Synchronizing...
                          </>
                        ) : (
                          <span className="flex items-center gap-2">
                            Deploy Community Node
                            <Rocket className="h-5 w-5" />
                          </span>
                        )}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="w-full max-w-4xl"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-card border border-border/70 rounded-2xl p-6 shadow-sm flex flex-col items-start text-left transition-all duration-300">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center shrink-0 text-primary">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-serif text-lg font-medium text-foreground">Elite Verification</h4>
                    <p className="text-sm text-foreground/70 mt-1 font-sans">
                      Our nodes manually verify every community application to ensure high-quality network standards.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 mt-6">
                  <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center shrink-0 text-primary">
                    <Zap className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-serif text-lg font-medium text-foreground">Rapid Deployment</h4>
                    <p className="text-sm text-foreground/70 mt-1 font-sans">
                      Once approved, your infrastructure is provisioned instantly on our global edge network.
                    </p>
                  </div>
                </div>
              </div>

              <Card className="bg-card border border-border/70 rounded-2xl shadow-sm text-left overflow-hidden">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-serif font-medium flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    Approval Criteria
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    "Unique and professional brand identity",
                    "Clear, non-conflicting URL identifier",
                    "Defined community value proposition",
                    "Compliance with network safety protocols"
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm text-foreground/70 font-sans">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                      {item}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
