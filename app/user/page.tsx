"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  User as UserIcon,
  Mail,
  Shield,
  Loader2,
  LogOut,
  Trash2,
  Save,
  LogIn,
  ArrowLeft,
  Moon,
  Sun,
  Settings,
  LucideIcon,
  Users,
} from "lucide-react";

import { getCurrentUserAction, logoutAction } from "@/app/actions/auth";
import { updateUserNameAction, deleteUserAction } from "@/app/actions/user";
import { AuthUser } from "@/lib/types";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import Link from "next/link";

const formSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters."),
});

interface NavLink {
  href: string;
  label: string;
  icon: LucideIcon;
  roles?: string[];
}

const navLinks: NavLink[] = [
  {
    href: "/user/info",
    label: "Change User Information",
    icon: Settings,
  },
  {
    href: "/admin",
    label: "Go to Admin Panel",
    icon: Shield,
    roles: ["admin"],
  },
];

export default function UserPage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingEmbedding, setIsGeneratingEmbedding] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { fullName: "" },
  });

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await getCurrentUserAction();
        if (currentUser) {
          setUser(currentUser);
          form.reset({ fullName: currentUser.name });
        }
      } catch (error) {
        console.error("Failed to fetch user", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUser();
  }, [form]);

  const handleLogout = async () => {
    try {
      await logoutAction();
      router.push("/");
    } catch (error) {
      console.error("Logout failed:", error);
      router.push("/");
    }
  };

  const handleDeleteAccount = async () => {
    setIsSubmitting(true);
    const result = await deleteUserAction();
    if (result.success) {
      toast.success(result.message);
      router.push("/");
    } else {
      toast.error(result.message);
    }
    setIsSubmitting(false);
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user || values.fullName === user.name) return;
    setIsSubmitting(true);
    const result = await updateUserNameAction(values.fullName);
    if (result.success) {
      toast.success(result.message);
      setUser((prev) => (prev ? { ...prev, name: values.fullName } : null));
    } else {
      toast.error(result.message);
    }
    setIsSubmitting(false);
  }

  const generateEmbedding = async () => {
    if (!user) return;

    setIsGeneratingEmbedding(true);

    try {
      const response = await fetch("/api/users/generate-embedding", {
        method: "POST",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate embedding");
      }

      const result = await response.json();

      if (result.success) {
        toast.success(
          `Embedding generated using ${result.embeddingSource} method!`
        );
      } else {
        throw new Error("Failed to generate embedding");
      }
    } catch (error) {
      console.error("Failed to generate embedding", error);
      toast.error("Failed to generate embedding. Please try again.");
    } finally {
      setIsGeneratingEmbedding(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-secondary p-4 dark:bg-background">
        <Card className="w-full max-w-md text-center dark:bg-card/60 dark:border-border">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You must be logged in to view this page.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/login")}>
              <LogIn className="mr-2 h-4 w-4" /> Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const accessibleLinks = navLinks.filter(
    (link) => !link.roles || link.roles.includes(user.role)
  );

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.1 } },
  };

  return (
    <main className="min-h-screen bg-secondary p-4 sm:p-6 md:p-8 dark:bg-background">
      <div className="mx-auto max-w-6xl">
        <div className="mb-4 flex">
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground"
            onClick={() => router.back()}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>

        <motion.div
          className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8"
          variants={cardVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Left Side: User Profile */}
          <motion.div variants={cardVariants}>
            <Card className="h-full shadow-lg dark:bg-card/60 dark:border-border">
              <CardHeader>
                <CardTitle className="text-2xl font-serif">
                  My Profile
                </CardTitle>
                <CardDescription>
                  View and manage your personal information.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4 text-sm">
                  <div className="flex items-center gap-4">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">{user.email}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <Shield className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium capitalize">{user.role}</span>
                  </div>
                </div>
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-4"
                  >
                    <FormField
                      control={form.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2 font-semibold">
                            <UserIcon className="h-4 w-4" /> Full Name
                          </FormLabel>
                          <FormControl>
                            <div className="flex gap-2">
                              <Input
                                placeholder="Your full name"
                                {...field}
                                disabled={isSubmitting}
                              />
                              <Button
                                type="submit"
                                size="icon"
                                disabled={
                                  isSubmitting ||
                                  form.getValues().fullName === user.name
                                }
                              >
                                {isSubmitting ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Save className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </form>
                </Form>
              </CardContent>
              <CardFooter className="flex flex-col items-start gap-4 border-t bg-muted/50 p-6 dark:bg-muted/30 dark:border-border">
                <h3 className="font-semibold text-foreground">
                  Account Actions
                </h3>
                <div className="flex w-full flex-wrap items-center justify-between gap-2">
                  <Button variant="outline" onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" /> Logout
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={generateEmbedding}
                    disabled={isGeneratingEmbedding}
                  >
                    {isGeneratingEmbedding ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Users className="mr-2 h-4 w-4" />
                    )}
                    Generate Embedding
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive">
                        <Trash2 className="mr-2 h-4 w-4" /> Delete Account
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Are you absolutely sure?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently
                          delete your account.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDeleteAccount}
                          disabled={isSubmitting}
                          className="bg-destructive hover:bg-destructive/90"
                        >
                          {isSubmitting && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          )}
                          Yes, delete my account
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardFooter>
            </Card>
          </motion.div>

          {/* Right Side: Links & Settings */}
          <motion.div
            variants={cardVariants}
            className="flex flex-col justify-between gap-6 lg:gap-8"
          >
            <Card className="shadow-lg dark:bg-card/60 dark:border-border">
              <CardHeader>
                <CardTitle className="text-2xl font-serif">
                  Quick Links
                </CardTitle>
                <CardDescription>
                  Navigate to other parts of the application.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                {accessibleLinks.map((link) => (
                  <Link href={link.href} key={link.href}>
                    <Button
                      variant="outline"
                      className="w-full justify-start mb-2 text-base h-12"
                    >
                      <link.icon className="mr-3 h-5 w-5 text-primary" />
                      {link.label}
                    </Button>
                  </Link>
                ))}
              </CardContent>
            </Card>

            <Card className="shadow-lg dark:bg-card/60 dark:border-border">
              <CardHeader>
                <CardTitle className="font-serif">Appearance</CardTitle>
                <CardDescription>
                  Customize the look and feel of the app.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <span className="font-medium">Toggle Theme</span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                >
                  <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                  <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                  <span className="sr-only">Toggle theme</span>
                </Button>
              </CardContent>
            </Card>

            <Card className="shadow-lg dark:bg-card/60 dark:border-border">
              <CardHeader>
                <CardTitle className="font-serif">
                  Match with other users
                </CardTitle>
                <CardDescription>Match with other users.</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <span className="font-medium">Match with other users</span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => router.push("/user/match")}
                >
                  <Users className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                  <Users className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                  <span className="sr-only">Match with other users</span>
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </main>
  );
}
