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
  registered_count?: number;
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

export default function EventCardAlternative({ event, onEventUpdate }: EventCardProps) {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [remainingCapacity, setRemainingCapacity] = useState(0);
  const [registeredCount, setRegisteredCount] = useState(0);

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
    const fetchRegistrationData = async () => {
      if (!currentUser?.id) return;

      try {
        // Check if user is registered
        const { data: registration, error: regError } = await supabase
          .from("event-registrations")
          .select("id")
          .eq("event_id", event.id)
          .eq("user_id", currentUser.id)
          .single();

        if (regError && regError.code !== 'PGRST116') { // PGRST116 is "not found"
          console.error("Error checking registration:", regError);
        } else {
          setIsRegistered(!!registration);
        }

        // Get registration count
        const { count, error: countError } = await supabase
          .from("event-registrations")
          .select("*", { count: 'exact', head: true })
          .eq("event_id", event.id);

        if (countError) {
          console.error("Error getting registration count:", countError);
        } else {
          setRegisteredCount(count || 0);
          const totalCapacity = event.capacity || 0;
          setRemainingCapacity(Math.max(0, totalCapacity - (count || 0)));
        }
      } catch (error) {
        console.error("Error fetching registration data:", error);
      }
    };

    fetchRegistrationData();
  }, [event.id, event.capacity, currentUser?.id]);

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

  const confirmRegistration = async () => {
    if (!currentUser?.id) return;

    setIsLoading(true);
    setShowConfirmDialog(false);

    try {
      // Check capacity again
      const { count, error: countError } = await supabase
        .from("event-registrations")
        .select("*", { count: 'exact', head: true })
        .eq("event_id", event.id);

      if (countError) {
        throw new Error(`Failed to check capacity: ${countError.message}`);
      }

      const currentCount = count || 0;
      const totalCapacity = event.capacity || 0;

      if (currentCount >= totalCapacity) {
        alert("This event is full.");
        setIsLoading(false);
        return;
      }

      // Create registration record
      const { error: insertError } = await supabase
        .from("event-registrations")
        .insert({
          event_id: event.id,
          user_id: currentUser.id,
          registered_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (insertError) {
        if (insertError.code === '23505') { // Unique constraint violation
          alert("You are already registered for this event.");
          setIsLoading(false);
          return;
        }
        throw new Error(`Failed to register: ${insertError.message}`);
      }

      // Update local state
      const newCount = currentCount + 1;
      setRegisteredCount(newCount);
      setRemainingCapacity(Math.max(0, totalCapacity - newCount));
      setIsRegistered(true);

      // Update parent component
      const updatedEvent = {
        ...event,
        registered_count: newCount,
      };
      onEventUpdate(updatedEvent);

      alert("Successfully registered for the event!");
    } catch (error) {
      console.error("Error registering for event:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      alert(`Failed to register for the event: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const cancelRegistration = () => {
    setShowConfirmDialog(false);
  };

  const getButtonText = () => {
    if (isLoading) return "Registering...";
    if (isRegistered) return "Registered";
    if (remainingCapacity <= 0) return "Full";
    return "Register";
  };

  const getButtonClass = () => {
    const baseClass = "px-6 py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 active:scale-95";
    
    if (isLoading) {
      return `${baseClass} bg-gray-400 text-white cursor-not-allowed`;
    }
    if (isRegistered) {
      return `${baseClass} bg-green-600 text-white hover:bg-green-700`;
    }
    if (remainingCapacity <= 0) {
      return `${baseClass} bg-red-500 text-white cursor-not-allowed`;
    }
    return `${baseClass} bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl`;
  };

  return (
    <>
      <div className="bg-white rounded-3xl shadow-xl flex flex-col md:flex-row overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
        {event.image && (
          <div className="md:w-1/3 h-64 md:h-auto">
            <Image
              src={event.image}
              alt={event.title}
              width={400}
              height={256}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          </div>
        )}
        
        <div className="p-8 flex-1 flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                {event.title}
              </h2>
              {event.tag && (
                <span className="inline-flex items-center px-3 py-1 bg-indigo-100 text-indigo-800 text-sm font-medium rounded-full">
                  {event.tag}
                </span>
              )}
            </div>
            
            <p className="text-gray-600 mb-6 line-clamp-3">
              {event.description}
            </p>
            
            <div className="flex flex-wrap gap-3 text-sm text-gray-600 mb-4">
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
                <span className="text-sm font-medium text-gray-700">Capacity</span>
                <span className="text-sm text-gray-600">
                  {remainingCapacity} / {event.capacity || 0} spots remaining
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${event.capacity ? (registeredCount / event.capacity) * 100 : 0}%`,
                  }}
                ></div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleRegister}
              disabled={isLoading || isRegistered || remainingCapacity <= 0}
              className={getButtonClass()}
            >
              {getButtonText()}
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl transform transition-all">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-indigo-100 mb-4">
                <svg
                  className="h-6 w-6 text-indigo-600"
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
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Confirm Registration
              </h3>
              <p className="text-gray-600 mb-6">
                Do you want to register for <strong>&quot;{event.title}&quot;</strong>?
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={cancelRegistration}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  No
                </button>
                <button
                  onClick={confirmRegistration}
                  className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all"
                >
                  Yes, Register
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
