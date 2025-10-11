"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Loader2, Calendar, MapPin, Users, Tag, Image as ImageIcon } from "lucide-react";
import { getCurrentUserAction } from "@/app/actions/auth";
import { AuthUser } from "@/lib/types";
import { toast } from "sonner";

export default function EventRegistrationPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [userTenantId, setUserTenantId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [form, setForm] = useState({
    title: "",
    description: "",
    start_at: "",
    end_at: "",
    location: "",
    capacity: "",
    image: "",
    tag: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchCurrentUserAndTenant = useCallback(async () => {
    try {
      const user = await getCurrentUserAction();
      setCurrentUser(user);
      
      if (user?.id) {
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
        
        const { data: userData, error } = await supabase
          .from("users")
          .select("tenant_id")
          .eq("id", user.id)
          .single();
          
        if (error) {
          console.error("Error fetching user tenant:", error);
        } else {
          setUserTenantId(userData?.tenant_id || null);
        }
      }
    } catch (error) {
      console.error("Error fetching current user:", error);
      toast.error("Failed to load user data");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrentUserAndTenant();
  }, [fetchCurrentUserAndTenant]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isSubmitting) {
      return;
    }
    
    if (!form.title.trim()) {
      toast.error("Please enter an event title");
      return;
    }
    
    setIsSubmitting(true);

    if (!userTenantId) {
      toast.error("User tenant information not found. Please contact support.");
      setIsSubmitting(false);
      return;
    }

    if (!currentUser?.id) {
      toast.error("User not authenticated. Please log in again.");
      setIsSubmitting(false);
      return;
    }

    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const eventPayload = {
        title: form.title,
        description: form.description,
        start_at: form.start_at ? new Date(form.start_at).toISOString() : null,
        end_at: form.end_at ? new Date(form.end_at).toISOString() : null,
        location: form.location,
        capacity: form.capacity ? Number(form.capacity) : null,
        image: form.image || null,
        tag: form.tag || null,
        is_public: true,
        tenant_id: userTenantId,
        organizer_id: currentUser.id,
      };

      const { error } = await supabase.from("events").insert([eventPayload]);
      if (error) {
        console.error(error);
        toast.error("Error creating event");
      } else {
        toast.success("Event created successfully!");
        router.push("/events");
      }
    } catch (error) {
      console.error("Error creating event:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <div className="container mx-auto py-8 px-4">
          <div className="flex items-center justify-center min-h-[600px]">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Loading...</p>
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
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="mb-4 -ml-2 hover:bg-accent"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            
            <div className="space-y-2">
              <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                Create Event
              </h1>
              <p className="text-muted-foreground text-lg">
                Organize and manage events for your organization
              </p>
            </div>
          </div>

          {/* Form Card */}
          <Card className="shadow-lg border-none bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-2xl">Event Details</CardTitle>
              <CardDescription>
                Fill in the details for your event. All fields except title are optional.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-sm font-medium">
                    Event Title <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="title"
                    name="title"
                    value={form.title}
                    onChange={handleChange}
                    placeholder="Enter event title"
                    required
                    suppressHydrationWarning
                    className="w-full"
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-medium">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    placeholder="Describe your event..."
                    rows={4}
                    suppressHydrationWarning
                    className="w-full resize-none"
                  />
                </div>

                {/* Location */}
                <div className="space-y-2">
                  <Label htmlFor="location" className="text-sm font-medium flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Location
                  </Label>
                  <Input
                    id="location"
                    name="location"
                    value={form.location}
                    onChange={handleChange}
                    placeholder="Event location or venue"
                    suppressHydrationWarning
                    className="w-full"
                  />
                </div>

                {/* Date and Time */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start_at" className="text-sm font-medium flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Start Date & Time
                    </Label>
                    <Input
                      id="start_at"
                      name="start_at"
                      type="datetime-local"
                      value={form.start_at}
                      onChange={handleChange}
                      suppressHydrationWarning
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end_at" className="text-sm font-medium flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      End Date & Time
                    </Label>
                    <Input
                      id="end_at"
                      name="end_at"
                      type="datetime-local"
                      value={form.end_at}
                      onChange={handleChange}
                      suppressHydrationWarning
                      className="w-full"
                    />
                  </div>
                </div>

                {/* Capacity and Tag */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="capacity" className="text-sm font-medium flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Max Attendees
                    </Label>
                    <Input
                      id="capacity"
                      name="capacity"
                      type="number"
                      value={form.capacity}
                      onChange={handleChange}
                      placeholder="Max attendees"
                      min="1"
                      suppressHydrationWarning
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tag" className="text-sm font-medium flex items-center gap-2">
                      <Tag className="h-4 w-4" />
                      Event Tag
                    </Label>
                    <Input
                      id="tag"
                      name="tag"
                      value={form.tag}
                      onChange={handleChange}
                      placeholder="e.g., Workshop, Conference"
                      suppressHydrationWarning
                      className="w-full"
                    />
                  </div>
                </div>

                {/* Image URL */}
                <div className="space-y-2">
                  <Label htmlFor="image" className="text-sm font-medium flex items-center gap-2">
                    <ImageIcon className="h-4 w-4" />
                    Image URL
                  </Label>
                  <Input
                    id="image"
                    name="image"
                    value={form.image}
                    onChange={handleChange}
                    placeholder="https://example.com/image.jpg"
                    suppressHydrationWarning
                    className="w-full"
                  />
                  {form.image && (
                    <div className="mt-2">
                      <img
                        src={form.image}
                        alt="Event preview"
                        className="w-full h-48 object-cover rounded-lg border"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Submit Button */}
                <div className="flex gap-4 pt-6">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 shadow-lg hover:shadow-xl transition-all duration-300"
                    suppressHydrationWarning
                  >
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isSubmitting ? "Creating Event..." : "Create Event"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                    disabled={isSubmitting}
                    className="px-8"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}