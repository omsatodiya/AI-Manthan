"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import Image from "next/image";
import { getCurrentUserAction } from "@/app/actions/auth";
import { AuthUser } from "@/lib/types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

interface Event {
  id: string;
  title: string;
  description: string;
  start_at: string;
  end_at: string;
  location: string;
  capacity: number | null;
  image: string | null;
  tag: string | null;
  is_public: boolean;
  tenant_id: string;
  organizer_id: string;
  registered_users?: string[];
  current_capacity?: number;
}

interface EventCardProps {
  event: Event;
  onEventUpdate: (updatedEvent: Event) => void;
}

function formatDate(dateString: string) {
  if (!dateString) return "No date";
  const d = new Date(dateString);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatTime(dateString: string) {
  if (!dateString) return "No time";
  const d = new Date(dateString);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export default function EventCard({ event, onEventUpdate }: EventCardProps) {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [remainingCapacity, setRemainingCapacity] = useState(0);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const user = await getCurrentUserAction();
        setCurrentUser(user);
      } catch (error) {
        console.error("Error fetching current user:", error);
      }
    };
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    // Calculate remaining capacity
    const registeredCount = event.registered_users?.length || 0;
    const totalCapacity = event.capacity || 0;
    setRemainingCapacity(Math.max(0, totalCapacity - registeredCount));

    // Check if current user is registered
    if (currentUser?.id && event.registered_users) {
      setIsRegistered(event.registered_users.includes(currentUser.id));
    }
  }, [event, currentUser]);

  const handleRegister = async () => {
    if (!currentUser?.id) {
      alert("Please log in to register for events.");
      return;
    }

    if (isRegistered) {
      alert("You are already registered for this event.");
      return;
    }

    if (remainingCapacity <= 0) {
      alert("This event is full.");
      return;
    }

    setShowConfirmDialog(true);
  };

  const handleWithdraw = async () => {
    if (!currentUser?.id) {
      alert("Please log in to withdraw from events.");
      return;
    }

    if (!isRegistered) {
      alert("You are not registered for this event.");
      return;
    }

    setShowConfirmDialog(true);
  };

  const confirmRegistration = async () => {
    if (!currentUser?.id) return;

    setIsLoading(true);
    setShowConfirmDialog(false);

    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      // First, let's check if the registered_users column exists by trying to fetch it
      const { data: currentEvent, error: fetchError } = await supabase
        .from("events")
        .select("*")
        .eq("id", event.id)
        .single();

      if (fetchError) {
        console.error("Error fetching event:", fetchError);
        throw new Error(`Failed to fetch event: ${fetchError.message}`);
      }

      // Handle the case where registered_users might not exist in the database yet
      const currentRegisteredUsers = currentEvent.registered_users || [];
      
      // Check if user is already registered
      if (currentRegisteredUsers.includes(currentUser.id)) {
        alert("You are already registered for this event.");
        setIsLoading(false);
        return;
      }

      // Check capacity
      const currentCapacity = currentEvent.capacity || 0;
      if (currentRegisteredUsers.length >= currentCapacity) {
        alert("This event is full.");
        setIsLoading(false);
        return;
      }

      // Add user to registered users array
      const updatedRegisteredUsers = [...currentRegisteredUsers, currentUser.id];

      // Try to update the event with registered_users field
      // If the column doesn't exist, we'll handle it gracefully
      const { error: updateError } = await supabase
        .from("events")
        .update({
          registered_users: updatedRegisteredUsers,
        })
        .eq("id", event.id)
        .select()
        .single();

      if (updateError) {
        console.error("Error updating event:", updateError);
        
        // If the error is about the column not existing, we need to create it
        if (updateError.message.includes("column") && updateError.message.includes("registered_users")) {
          alert("Database schema needs to be updated. Please contact the administrator to add the 'registered_users' column to the events table.");
          setIsLoading(false);
          return;
        }
        
        throw new Error(`Failed to update event: ${updateError.message}`);
      }

      // Update local state
      const updatedEventData = {
        ...event,
        registered_users: updatedRegisteredUsers,
        current_capacity: updatedRegisteredUsers.length,
      };

      onEventUpdate(updatedEventData);
      setIsRegistered(true);
      setRemainingCapacity(Math.max(0, currentCapacity - updatedRegisteredUsers.length));

      alert("Successfully registered for the event!");
    } catch (error) {
      console.error("Error registering for event:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      alert(`Failed to register for the event: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const confirmWithdrawal = async () => {
    if (!currentUser?.id) return;

    setIsLoading(true);
    setShowConfirmDialog(false);

    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      // Fetch current event data
      const { data: currentEvent, error: fetchError } = await supabase
        .from("events")
        .select("*")
        .eq("id", event.id)
        .single();

      if (fetchError) {
        console.error("Error fetching event:", fetchError);
        throw new Error(`Failed to fetch event: ${fetchError.message}`);
      }

      const currentRegisteredUsers = currentEvent.registered_users || [];
      
      // Check if user is registered
      if (!currentRegisteredUsers.includes(currentUser.id)) {
        alert("You are not registered for this event.");
        setIsLoading(false);
        return;
      }
      // Remove user from registered users array
      const updatedRegisteredUsers = currentRegisteredUsers.filter((id: string) => id !== currentUser.id);

      // Update the event
      const { error: updateError } = await supabase
        .from("events")
        .update({
          registered_users: updatedRegisteredUsers,
        })
        .eq("id", event.id)
        .select()
        .single();

      if (updateError) {
        console.error("Error updating event:", updateError);
        throw new Error(`Failed to update event: ${updateError.message}`);
      }

      // Update local state
      const updatedEventData = {
        ...event,
        registered_users: updatedRegisteredUsers,
        current_capacity: updatedRegisteredUsers.length,
      };

      onEventUpdate(updatedEventData);
      setIsRegistered(false);
      setRemainingCapacity(Math.max(0, (currentEvent.capacity || 0) - updatedRegisteredUsers.length));

      alert("Successfully withdrawn from the event!");
    } catch (error) {
      console.error("Error withdrawing from event:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      alert(`Failed to withdraw from the event: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const cancelRegistration = () => {
    setShowConfirmDialog(false);
  };

  const getButtonText = () => {
    if (isLoading) return isRegistered ? "Withdrawing..." : "Registering...";
    if (isRegistered) return "Withdraw";
    if (remainingCapacity <= 0) return "Full";
    return "Register";
  };

  const getButtonClass = () => {
    const baseClass = "px-6 py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 active:scale-95";
    
    if (isLoading) {
      return `${baseClass} bg-muted text-muted-foreground cursor-not-allowed`;
    }
    if (isRegistered) {
      return `${baseClass} bg-destructive text-destructive-foreground hover:bg-destructive/90`;
    }
    if (remainingCapacity <= 0) {
      return `${baseClass} bg-muted text-muted-foreground cursor-not-allowed`;
    }
    return `${baseClass} bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg hover:shadow-xl`;
  };

  return (
    <>
      <div className="bg-card border border-border rounded-3xl shadow-xl flex flex-col md:flex-row overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 max-w-3xl mx-auto">
        {event.image && (
          <div className="md:w-1/4 h-44 md:h-auto">
            <Image
              src={event.image}
              alt={event.title}
              width={280}
              height={176}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          </div>
        )}
        
        <div className="p-5 flex-1 flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-2xl font-bold text-foreground mb-2">
                {event.title}
              </h2>
              {event.tag && (
                <span className="inline-flex items-center px-3 py-1 bg-primary/10 text-primary text-sm font-medium rounded-full">
                  {event.tag}
                </span>
              )}
            </div>
            
            <p className="text-muted-foreground mb-6 line-clamp-3">
              {event.description}
            </p>
            
            <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mb-4">
              <span className="inline-flex items-center px-3 py-2 bg-blue-50 text-blue-700 rounded-lg">
                📅 {formatDate(event.start_at)}
              </span>
              <span className="inline-flex items-center px-3 py-2 bg-green-50 text-green-700 rounded-lg">
                🕒 {formatTime(event.start_at)}
              </span>
              <span className="inline-flex items-center px-3 py-2 bg-purple-50 text-purple-700 rounded-lg">
                📍 {event.location}
              </span>
            </div>

            {/* Capacity Information */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground">Capacity</span>
                <span className="text-sm text-muted-foreground">
                  {remainingCapacity} / {event.capacity || 0} spots remaining
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-primary to-primary/80 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${event.capacity ? ((event.capacity - remainingCapacity) / event.capacity) * 100 : 0}%`,
                  }}
                ></div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={isRegistered ? handleWithdraw : handleRegister}
              disabled={isLoading || remainingCapacity <= 0}
              className={getButtonClass()}
            >
              {getButtonText()}
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
          <div className="bg-card border border-border rounded-2xl p-8 w-full max-w-md shadow-2xl transform transition-all">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-primary/10 mb-4">
                <svg
                  className="h-6 w-6 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {isRegistered ? "Confirm Withdrawal" : "Confirm Registration"}
              </h3>
              <p className="text-muted-foreground mb-6">
                {isRegistered 
                  ? `Are you sure you want to withdraw from "${event.title}"?`
                  : `Do you want to register for "${event.title}"?`
                }
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={cancelRegistration}
                  className="px-6 py-2 border border-border text-foreground rounded-lg hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={isRegistered ? confirmWithdrawal : confirmRegistration}
                  className={`px-6 py-2 rounded-lg transition-all ${
                    isRegistered 
                      ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      : "bg-primary text-primary-foreground hover:bg-primary/90"
                  }`}
                >
                  {isRegistered ? "Yes, Withdraw" : "Yes, Register"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
