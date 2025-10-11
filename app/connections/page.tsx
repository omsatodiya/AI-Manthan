"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Users,
  UserPlus,
  UserCheck,
  UserX,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  RefreshCw,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
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
import { getCurrentUserAction } from "@/app/actions/auth";
import { getSupabaseClient } from "@/lib/database/clients";
import { AuthUser } from "@/lib/types";
import Link from "next/link";

interface Connection {
  id: string;
  requester_id: string;
  receiver_id: string;
  status: "pending" | "accepted" | "rejected";
  created_at: string;
  updated_at: string;
  requester?: {
    id: string;
    fullName: string;
    email: string;
  };
  receiver?: {
    id: string;
    fullName: string;
    email: string;
  };
}


export default function ConnectionsPage() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [incomingRequests, setIncomingRequests] = useState<Connection[]>([]);
  const [sentRequests, setSentRequests] = useState<Connection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [processingConnections, setProcessingConnections] = useState<
    Set<string>
  >(new Set());
  const [error, setError] = useState<string | null>(null);
  const [showAllAccepted, setShowAllAccepted] = useState(false);
  const [showAllRejected, setShowAllRejected] = useState(false);

  // Fetch current user
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const user = await getCurrentUserAction();
        setCurrentUser(user);
      } catch (error) {
        console.error("Error fetching current user:", error);
        setError("Failed to load user data");
        setIsLoading(false);
      }
    };
    fetchCurrentUser();
  }, []);

  const fetchConnections = useCallback(async (showRefreshLoader = false) => {
    if (!currentUser?.id) return;

    try {
      if (showRefreshLoader) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      const supabase = await getSupabaseClient();

      // Fetch incoming requests (where receiver_id = currentUser.id)
      const { data: incomingConnections, error: incomingError } = await supabase
        .from("connections")
        .select("*")
        .eq("receiver_id", currentUser.id)
        .order("created_at", { ascending: false });

      if (incomingError) {
        console.error("Error fetching incoming requests:", incomingError);
        throw incomingError;
      }

      // Fetch sent requests (where requester_id = currentUser.id)
      const { data: sentConnections, error: sentError } = await supabase
        .from("connections")
        .select("*")
        .eq("requester_id", currentUser.id)
        .order("created_at", { ascending: false });

      if (sentError) {
        console.error("Error fetching sent requests:", sentError);
        throw sentError;
      }

      // Get user details for incoming requests
      const incomingUserIds =
        incomingConnections?.map((conn) => conn.requester_id) || [];
      const { data: incomingUsers, error: incomingUsersError } = await supabase
        .from("users")
        .select("id, fullName, email")
        .in("id", incomingUserIds);

      if (incomingUsersError) {
        console.error(
          "Error fetching incoming user details:",
          incomingUsersError
        );
        throw incomingUsersError;
      }

      // Get user details for sent requests
      const sentUserIds =
        sentConnections?.map((conn) => conn.receiver_id) || [];
      const { data: sentUsers, error: sentUsersError } = await supabase
        .from("users")
        .select("id, fullName, email")
        .in("id", sentUserIds);

      if (sentUsersError) {
        console.error("Error fetching sent user details:", sentUsersError);
        throw sentUsersError;
      }

      // Combine connections with user details
      const incomingWithUsers =
        incomingConnections?.map((connection) => ({
          ...connection,
          requester: incomingUsers?.find(
            (user) => user.id === connection.requester_id
          ),
        })) || [];

      const sentWithUsers =
        sentConnections?.map((connection) => ({
          ...connection,
          receiver: sentUsers?.find(
            (user) => user.id === connection.receiver_id
          ),
        })) || [];

      setIncomingRequests(incomingWithUsers);
      setSentRequests(sentWithUsers);
    } catch (error) {
      console.error("Error fetching connections:", error);
      setError("Failed to load connections");
      toast.error("Failed to load connections");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [currentUser]);

  // Fetch connections when user is loaded
  useEffect(() => {
    if (currentUser?.id) {
      fetchConnections();
    }
  }, [currentUser, fetchConnections]);

  const handleConnectionAction = async (
    connectionId: string,
    status: "accepted" | "rejected"
  ) => {
    if (!currentUser?.id) {
      toast.error("Please log in to respond to connection requests");
      return;
    }

    // Add connection to processing set
    setProcessingConnections((prev) => new Set(prev).add(connectionId));

    try {
      const response = await fetch("/api/connections", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          connectionId,
          status,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const actionText = status === "accepted" ? "accepted" : "rejected";
        toast.success(`Connection request ${actionText} successfully!`);

        // Refresh connections to update the UI
        await fetchConnections();
      } else {
        const errorMessage =
          data.error || `Failed to ${status} connection request`;
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error(`Error ${status}ing connection request:`, error);
      toast.error(`Failed to ${status} connection request. Please try again.`);
    } finally {
      // Remove connection from processing set
      setProcessingConnections((prev) => {
        const newSet = new Set(prev);
        newSet.delete(connectionId);
        return newSet;
      });
    }
  };

  const handleRefresh = () => {
    fetchConnections(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="secondary" className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Pending
          </Badge>
        );
      case "accepted":
        return (
          <Badge variant="default" className="flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            Accepted
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            Rejected
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Helper functions to categorize connections
  const getPendingConnections = () => {
    return incomingRequests.filter((conn) => conn.status === "pending");
  };

  const getAcceptedConnections = () => {
    const allAccepted = [...incomingRequests, ...sentRequests].filter(
      (conn) => conn.status === "accepted"
    );
    return allAccepted.sort(
      (a, b) =>
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    );
  };

  const getRejectedConnections = () => {
    const allRejected = [...incomingRequests, ...sentRequests].filter(
      (conn) => conn.status === "rejected"
    );
    return allRejected.sort(
      (a, b) =>
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    );
  };

  const getDisplayedAcceptedConnections = () => {
    const accepted = getAcceptedConnections();
    return showAllAccepted ? accepted : accepted.slice(0, 3);
  };

  const getDisplayedRejectedConnections = () => {
    const rejected = getRejectedConnections();
    return showAllRejected ? rejected : rejected.slice(0, 3);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading connections...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={handleRefresh} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-4xl">
      {/* Back to Home Button */}
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

      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Connections
          </h1>
          <p className="text-muted-foreground mt-2 text-sm sm:text-base">
            Manage your connection requests and network
          </p>
        </div>
        <Button
          onClick={handleRefresh}
          variant="outline"
          disabled={isRefreshing}
          className="flex items-center gap-2 w-full sm:w-auto"
        >
          {isRefreshing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          <span className="hidden sm:inline">Refresh</span>
          <span className="sm:hidden">Refresh</span>
        </Button>
      </div>

      <div className="space-y-8">
        {/* Pending Requests */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Pending Requests
                <Badge variant="secondary">
                  {getPendingConnections().length}
                </Badge>
              </CardTitle>
              <CardDescription>
                Connection requests from other users waiting for your response
              </CardDescription>
            </CardHeader>
            <CardContent>
              {getPendingConnections().length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No pending connection requests</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {getPendingConnections().map((connection) => (
                    <motion.div
                      key={connection.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3 }}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold">
                            {connection.requester?.fullName || "Unknown User"}
                          </h3>
                          {getStatusBadge(connection.status)}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {connection.requester?.email} •{" "}
                          {formatDate(connection.created_at)}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            handleConnectionAction(connection.id, "rejected")
                          }
                          disabled={processingConnections.has(connection.id)}
                        >
                          {processingConnections.has(connection.id) ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <UserX className="h-4 w-4 mr-2" />
                          )}
                          Reject
                        </Button>
                        <Button
                          size="sm"
                          onClick={() =>
                            handleConnectionAction(connection.id, "accepted")
                          }
                          disabled={processingConnections.has(connection.id)}
                        >
                          {processingConnections.has(connection.id) ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <UserCheck className="h-4 w-4 mr-2" />
                          )}
                          Accept
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Manage Connections */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Manage Connections
              </CardTitle>
              <CardDescription>
                View and manage your accepted and rejected connections
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Accepted Connections */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    Accepted Connections
                    <Badge variant="default">
                      {getAcceptedConnections().length}
                    </Badge>
                  </h3>
                  {getAcceptedConnections().length > 3 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowAllAccepted(!showAllAccepted)}
                    >
                      {showAllAccepted ? (
                        <>
                          <ChevronUp className="h-4 w-4 mr-1" />
                          Show Less
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-4 w-4 mr-1" />
                          Show All ({getAcceptedConnections().length})
                        </>
                      )}
                    </Button>
                  )}
                </div>
                {getAcceptedConnections().length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    <CheckCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No accepted connections yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {getDisplayedAcceptedConnections().map((connection) => (
                      <motion.div
                        key={connection.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3 }}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <h4 className="font-medium">
                              {connection.requester_id === currentUser?.id
                                ? connection.receiver?.fullName ||
                                  "Unknown User"
                                : connection.requester?.fullName ||
                                  "Unknown User"}
                            </h4>
                            {getStatusBadge(connection.status)}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {connection.requester_id === currentUser?.id
                              ? connection.receiver?.email
                              : connection.requester?.email}{" "}
                            • {formatDate(connection.updated_at)}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {/* Rejected Connections */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <XCircle className="h-5 w-5 text-red-600" />
                    Rejected Connections
                    <Badge variant="destructive">
                      {getRejectedConnections().length}
                    </Badge>
                  </h3>
                  {getRejectedConnections().length > 3 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowAllRejected(!showAllRejected)}
                    >
                      {showAllRejected ? (
                        <>
                          <ChevronUp className="h-4 w-4 mr-1" />
                          Show Less
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-4 w-4 mr-1" />
                          Show All ({getRejectedConnections().length})
                        </>
                      )}
                    </Button>
                  )}
                </div>
                {getRejectedConnections().length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    <XCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No rejected connections</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {getDisplayedRejectedConnections().map((connection) => (
                      <motion.div
                        key={connection.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3 }}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <h4 className="font-medium">
                              {connection.requester_id === currentUser?.id
                                ? connection.receiver?.fullName ||
                                  "Unknown User"
                                : connection.requester?.fullName ||
                                  "Unknown User"}
                            </h4>
                            {getStatusBadge(connection.status)}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {connection.requester_id === currentUser?.id
                              ? connection.receiver?.email
                              : connection.requester?.email}{" "}
                            • {formatDate(connection.updated_at)}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
