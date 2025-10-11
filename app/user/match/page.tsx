"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  ArrowLeft,
  Loader2,
  Users,
  RefreshCw,
  UserCheck,
  AlertCircle,
} from "lucide-react";

import { getCurrentUserAction } from "@/app/actions/auth";
import { AuthUser } from "@/lib/types";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MatchMakingUser } from "@/components/users/MatchMakingUser";

interface UserMatch {
  userId: string;
  similarity: number;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

interface MatchResponse {
  success: boolean;
  data: UserMatch[];
  meta: {
    threshold: number;
    count: number;
    requestedCount: number;
  };
}

export default function UserMatchPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [matches, setMatches] = useState<UserMatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await getCurrentUserAction();
        if (currentUser) {
          setUser(currentUser);
        }
      } catch (error) {
        console.error("Failed to fetch user", error);
        setError("Failed to authenticate user");
      } finally {
        setIsLoading(false);
      }
    };
    fetchUser();
  }, []);

  const generateEmbedding = async () => {
    if (!user) return;

    setIsRefreshing(true);
    setError(null);

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
        // Try to fetch matches after generating embedding
        await fetchMatches();
      } else {
        throw new Error("Failed to generate embedding");
      }
    } catch (error) {
      console.error("Failed to generate embedding", error);
      setError("Failed to generate embedding. Please try again.");
      toast.error("Failed to generate embedding");
    } finally {
      setIsRefreshing(false);
    }
  };

  const fetchMatches = useCallback(async () => {
    if (!user) return;

    setIsRefreshing(true);
    setError(null);

    try {
      const response = await fetch("/api/users/match?threshold=0.7&count=10");

      if (!response.ok) {
        const errorData = await response.json();

        if (errorData.code === "PROFILE_NOT_FOUND") {
          setError("profile_not_found");
          toast.error("Please complete your profile first");
          return;
        } else if (errorData.code === "EMBEDDING_NOT_FOUND") {
          setError("embedding_not_found");
          toast.error("Please save your profile to enable matching");
          return;
        } else {
          throw new Error(
            errorData.error || `HTTP error! status: ${response.status}`
          );
        }
      }

      const result: MatchResponse = await response.json();

      if (result.success) {
        setMatches(result.data);
        if (result.data.length === 0) {
          toast.info(
            "No matches found. Try adjusting your profile information."
          );
        } else {
          toast.success(`Found ${result.data.length} potential matches!`);
        }
      } else {
        throw new Error("Failed to fetch matches");
      }
    } catch (error) {
      console.error("Failed to fetch matches", error);
      setError("Failed to fetch matches. Please try again.");
      toast.error("Failed to fetch matches");
    } finally {
      setIsRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchMatches();
    }
  }, [user, fetchMatches]);

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
            <Button onClick={() => router.push("/login")}>Go to Login</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.1 } },
  };

  return (
    <main className="min-h-screen bg-secondary p-4 sm:p-6 md:p-8 dark:bg-background">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground"
              onClick={() => router.back()}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold font-serif">User Matching</h1>
              <p className="text-muted-foreground">
                Find users with similar professional interests and goals
              </p>
            </div>
          </div>
          <Button
            onClick={fetchMatches}
            disabled={isRefreshing}
            variant="outline"
            className="gap-2"
          >
            {isRefreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Refresh Matches
          </Button>
        </div>

        {error && (
          <Alert className="mb-6 border-destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error === "profile_not_found" ? (
                <div className="space-y-2">
                  <p>
                    You need to complete your profile first to find matches.
                  </p>
                  <Button onClick={() => router.push("/user/info")} size="sm">
                    Complete Your Profile
                  </Button>
                </div>
              ) : error === "embedding_not_found" ? (
                <div className="space-y-2">
                  <p>
                    Your profile needs to be saved to generate an embedding for
                    matching.
                  </p>
                  <div className="flex gap-2">
                    <Button onClick={() => router.push("/user/info")} size="sm">
                      Go to Profile Settings
                    </Button>
                    <Button
                      onClick={generateEmbedding}
                      size="sm"
                      variant="outline"
                      disabled={isRefreshing}
                    >
                      {isRefreshing ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : null}
                      Generate Embedding
                    </Button>
                  </div>
                </div>
              ) : (
                error
              )}
            </AlertDescription>
          </Alert>
        )}

        <motion.div
          className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3"
          variants={cardVariants}
          initial="hidden"
          animate="visible"
        >
          {matches.length === 0 && !isRefreshing ? (
            <Card className="col-span-full shadow-lg dark:bg-card/60 dark:border-border">
              <CardHeader className="text-center">
                <Users className="mx-auto h-12 w-12 text-muted-foreground" />
                <CardTitle>No Matches Found</CardTitle>
                <CardDescription>
                  We couldn&apos;t find any users matching your profile. This
                  could be because:
                  <ul className="mt-2 text-left space-y-1">
                    <li>
                      • Your profile information is incomplete or not saved
                    </li>
                    <li>• There are no other users with similar interests</li>
                    <li>• The matching threshold is too high</li>
                  </ul>
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center space-y-2">
                <div className="flex justify-center gap-2">
                  <Button onClick={() => router.push("/user/info")}>
                    Complete Your Profile
                  </Button>
                  <Button variant="outline" onClick={fetchMatches}>
                    Try Again
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Make sure to save your profile after completing it to generate
                  an embedding for matching.
                </p>
              </CardContent>
            </Card>
          ) : (
            matches.map((match) => (
              <MatchMakingUser key={match.userId} match={match} />
            ))
          )}
        </motion.div>

        {matches.length > 0 && (
          <Card className="mt-6 shadow-lg dark:bg-card/60 dark:border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5" />
                Matching Summary
              </CardTitle>
              <CardDescription>
                Found {matches.length} potential matches based on your profile
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium">Total Matches:</span>
                  <span className="ml-2">{matches.length}</span>
                </div>
                <div>
                  <span className="font-medium">Average Similarity:</span>
                  <span className="ml-2">
                    {matches.length > 0
                      ? (
                          matches.reduce(
                            (sum, match) => sum + match.similarity,
                            0
                          ) / matches.length
                        ).toFixed(2)
                      : "0.00"}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Highest Match:</span>
                  <span className="ml-2">
                    {matches.length > 0
                      ? Math.max(...matches.map((m) => m.similarity)).toFixed(2)
                      : "0.00"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}
