"use client";

import React, { useEffect, useState, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Calendar, ArrowLeft } from "lucide-react";
import EventCard from "@/components/events/EventCard";
import Link from "next/link";

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

export default function EventPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchEvents = useCallback(async () => {
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .order("start_at", { ascending: true });
        
      if (!error && data) {
        // Initialize registered_users array for events that don't have it
        const eventsWithDefaults = data.map(event => ({
          ...event,
          registered_users: event.registered_users || [],
          current_capacity: event.registered_users?.length || 0,
        }));
        setEvents(eventsWithDefaults);
      }
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleEventUpdate = (updatedEvent: Event) => {
    setEvents(prevEvents => 
      prevEvents.map(event => 
        event.id === updatedEvent.id ? updatedEvent : event
      )
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <div className="container mx-auto py-8 px-4">
          <div className="flex items-center justify-center min-h-[600px]">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Loading events...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header Section */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <Link 
                href="/community" 
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-muted-foreground" />
              </Link>
            </div>
            <div className="space-y-2">
              <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                Upcoming Events
              </h1>
              <p className="text-muted-foreground text-lg">
                Discover and join exciting events in your organization
              </p>
            </div>
          </div>

          {/* Events Grid */}
          {events.length === 0 ? (
            <Card className="border-dashed border-2 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="rounded-full bg-muted/50 p-6 mb-6">
                  <Calendar className="h-12 w-12 text-muted-foreground" />
                </div>
                <h3 className="text-2xl font-semibold mb-2">No events found</h3>
                <p className="text-muted-foreground mb-6 text-center max-w-md">
                  Check back later for upcoming events or create your own event!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {events.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onEventUpdate={handleEventUpdate}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}