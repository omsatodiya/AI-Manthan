"use client";

import React, { useEffect, useState, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";
import EventCard from "@/components/events/EventCard";

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
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  const [events, setEvents] = useState<Event[]>([]);

  const fetchEvents = useCallback(async () => {
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
  }, [supabase]);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-200 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-8 text-center tracking-tight">
          Upcoming Events
        </h1>
        <div className="space-y-8">
          {events.length === 0 && (
            <div className="text-center text-gray-500 py-12">
              <div className="text-6xl mb-4">📅</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No events found</h3>
              <p className="text-gray-500">Check back later for upcoming events!</p>
            </div>
          )}
          {events.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onEventUpdate={handleEventUpdate}
            />
          ))}
        </div>
      </div>
    </div>
  );
}