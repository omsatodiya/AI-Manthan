"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Users,
  Loader2,
  RefreshCw,
  Heart,
  MessageCircle,
  Star,
  AlertCircle,
  UserCheck,
  TrendingUp,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useTenant } from "@/contexts/tenant-context";

interface UserMatch {
  userId: string;
  similarity: number;
  user?: {
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

interface MatchMakingUserProps {
  match?: UserMatch;
}

export function MatchMakingUser({ match }: MatchMakingUserProps = {}) {
  const { tenantId } = useTenant();
  const [matches, setMatches] = useState<UserMatch[]>([]);
  const [isLoading, setIsLoading] = useState(!match);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMatches = useCallback(
    async (showRefreshLoader = false) => {
      try {
        if (showRefreshLoader) {
          setIsRefreshing(true);
        } else {
          setIsLoading(true);
        }
        setError(null);

        console.log("🔵 MatchMakingUser: Fetching matches", {
          tenantId,
        });

        const params = new URLSearchParams({
          threshold: "0.7",
          count: "5",
        });

        if (tenantId) {
          params.append("tenantId", tenantId);
        }

        const response = await fetch(`/api/users/match?${params}`);

        console.log("🔵 MatchMakingUser: API response", {
          status: response.status,
          ok: response.ok,
        });

        if (!response.ok) {
          const errorData = await response.json();

          if (
            errorData.code === "PROFILE_NOT_FOUND" ||
            errorData.code === "EMBEDDING_NOT_FOUND"
          ) {
            setError("Please complete your profile to enable matching");
          } else {
            throw new Error(errorData.error || "Failed to fetch matches");
          }
        }

        const data: MatchResponse = await response.json();

        console.log("🔵 MatchMakingUser: Matches received", {
          success: data.success,
          matchCount: data.data?.length || 0,
          meta: data.meta,
        });

        if (data.success && data.data) {
          setMatches(data.data);
          toast.success(`Found ${data.data.length} potential matches!`);
        } else {
          throw new Error("Invalid response format");
        }
      } catch (err: unknown) {
        console.error("🔴 MatchMakingUser: Error fetching matches", err);
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error occurred";
        setError(errorMessage);
        toast.error(`Failed to load matches: ${errorMessage}`);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [tenantId]
  );

  useEffect(() => {
    if (!match) {
      fetchMatches();
    }
  }, [fetchMatches, match]);

  // If a match is provided as prop, render individual match card
  if (match) {
    return <MatchCard match={match} />;
  }

  const handleRefresh = () => {
    fetchMatches(true);
  };

  const getSimilarityColor = (similarity: number) => {
    if (similarity >= 0.8) return "text-green-600 dark:text-green-400";
    if (similarity >= 0.6) return "text-yellow-600 dark:text-yellow-400";
    return "text-orange-600 dark:text-orange-400";
  };

  const getSimilarityBadgeVariant = (similarity: number) => {
    if (similarity >= 0.8) return "default";
    if (similarity >= 0.6) return "secondary";
    return "outline";
  };

  const getMatchLevel = (similarity: number) => {
    if (similarity >= 0.9) return "Excellent Match";
    if (similarity >= 0.8) return "Great Match";
    if (similarity >= 0.7) return "Good Match";
    if (similarity >= 0.6) return "Fair Match";
    return "Potential Match";
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Finding Your Best Matches
          </CardTitle>
          <CardDescription>
            Analyzing profiles to find compatible users...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                Searching through user profiles...
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            Error Loading Matches
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-4 py-8">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">{error}</p>
              <p className="text-xs text-muted-foreground">
                Make sure you have completed your profile to get matches.
              </p>
            </div>
            <Button onClick={handleRefresh} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Your Top Matches
              </CardTitle>
              <CardDescription>
                Users with similar interests and goals
              </CardDescription>
            </div>
            <Button
              onClick={handleRefresh}
              variant="outline"
              size="sm"
              disabled={isRefreshing}
            >
              {isRefreshing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Matches */}
      {matches.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <div className="flex flex-col items-center gap-4 text-center">
              <UserCheck className="h-12 w-12 text-muted-foreground" />
              <div>
                <h3 className="font-semibold mb-2">No Matches Found</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Complete your profile to start finding compatible users with
                  similar interests and goals.
                </p>
                <Button variant="outline" size="sm">
                  Complete Profile
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence>
            {matches.map((match, index) => (
              <motion.div
                key={match.userId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Card className="h-full hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">
                          {match.user?.name || "Anonymous User"}
                        </CardTitle>
                        <CardDescription className="text-xs">
                          {match.user?.email}
                        </CardDescription>
                      </div>
                      <Badge
                        variant={getSimilarityBadgeVariant(match.similarity)}
                        className="ml-2"
                      >
                        <Star className="h-3 w-3 mr-1" />
                        {getMatchLevel(match.similarity)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-4">
                      {/* Similarity Score */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">
                            Compatibility Score
                          </span>
                          <span
                            className={`text-sm font-bold ${getSimilarityColor(
                              match.similarity
                            )}`}
                          >
                            {(match.similarity * 100).toFixed(1)}%
                          </span>
                        </div>
                        <Progress
                          value={match.similarity * 100}
                          className="h-2"
                        />
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="flex-1"
                          onClick={() => {
                            toast.success("Connection request sent!");
                          }}
                        >
                          <Heart className="h-4 w-4 mr-2" />
                          Connect
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            toast.info("Starting conversation...");
                          }}
                        >
                          <MessageCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Stats */}
      {matches.length > 0 && (
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                <span>
                  Showing {matches.length} of {matches.length} matches
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span>Threshold: 70%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Individual match card component
function MatchCard({ match }: { match: UserMatch }) {
  const getSimilarityColor = (similarity: number) => {
    if (similarity >= 0.8) return "text-green-600 dark:text-green-400";
    if (similarity >= 0.6) return "text-yellow-600 dark:text-yellow-400";
    return "text-orange-600 dark:text-orange-400";
  };

  const getSimilarityBadgeVariant = (similarity: number) => {
    if (similarity >= 0.8) return "default";
    if (similarity >= 0.6) return "secondary";
    return "outline";
  };

  const getMatchLevel = (similarity: number) => {
    if (similarity >= 0.9) return "Excellent Match";
    if (similarity >= 0.8) return "Great Match";
    if (similarity >= 0.7) return "Good Match";
    if (similarity >= 0.6) return "Fair Match";
    return "Potential Match";
  };

  return (
    <Card className="h-full hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">
              {match.user?.name || "Anonymous User"}
            </CardTitle>
            <CardDescription className="text-xs">
              {match.user?.email}
            </CardDescription>
            {match.user?.role && (
              <Badge variant="outline" className="mt-1 text-xs">
                {match.user.role}
              </Badge>
            )}
          </div>
          <Badge
            variant={getSimilarityBadgeVariant(match.similarity)}
            className="ml-2"
          >
            <Star className="h-3 w-3 mr-1" />
            {getMatchLevel(match.similarity)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-4">
          {/* Similarity Score */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Compatibility Score</span>
              <span
                className={`text-sm font-bold ${getSimilarityColor(
                  match.similarity
                )}`}
              >
                {(match.similarity * 100).toFixed(1)}%
              </span>
            </div>
            <Progress value={match.similarity * 100} className="h-2" />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              size="sm"
              className="flex-1"
              onClick={() => {
                toast.success("Connection request sent!");
              }}
            >
              <Heart className="h-4 w-4 mr-2" />
              Connect
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                toast.info("Starting conversation...");
              }}
            >
              <MessageCircle className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
