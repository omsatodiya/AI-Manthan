"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import Image from "next/image";
import { getCurrentUserAction } from "@/app/actions/auth";
import { AuthUser } from "@/lib/types";

export default function EventRegistrationPage() {
  const router = useRouter();
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createClient(supabaseUrl, supabaseKey);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [userTenantId, setUserTenantId] = useState<string | null>(null);
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

  useEffect(() => {
    const fetchCurrentUserAndTenant = async () => {
      try {
        const user = await getCurrentUserAction();
        setCurrentUser(user);
        
        if (user?.id) {
          // Fetch user's tenant_id from Supabase users table
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
      }
    };
    fetchCurrentUserAndTenant();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Validate that we have both tenant ID and organizer ID
    if (!userTenantId) {
      alert("User tenant information not found. Please contact support.");
      setIsSubmitting(false);
      return;
    }

    if (!currentUser?.id) {
      alert("User not authenticated. Please log in again.");
      setIsSubmitting(false);
      return;
    }

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
      alert("Error creating event");
    } else {
      alert("Event created successfully!");
      router.push("/events");
    }
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 py-16 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-5xl font-bold text-gray-900 mb-3 tracking-tight">
            Create New Event
          </h1>
          <p className="text-gray-600 text-lg">
            Fill in the details to create an amazing event
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl p-10 backdrop-blur-sm bg-opacity-95">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Event Title <span className="text-red-500">*</span>
              </label>
              <input
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="Enter event title"
                required
                className="w-full border-2 border-gray-200 rounded-xl px-5 py-3.5 text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all outline-none"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Describe your event"
                required
                className="w-full border-2 border-gray-200 rounded-xl px-5 py-3.5 text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all outline-none resize-none"
                rows={5}
              />
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Start Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="start_at"
                  value={form.start_at}
                  onChange={handleChange}
                  required
                  className="w-full border-2 border-gray-200 rounded-xl px-5 py-3.5 text-gray-900 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  End Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="end_at"
                  value={form.end_at}
                  onChange={handleChange}
                  required
                  className="w-full border-2 border-gray-200 rounded-xl px-5 py-3.5 text-gray-900 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all outline-none"
                />
              </div>
            </div>

            {/* Location */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Location <span className="text-red-500">*</span>
              </label>
              <input
                name="location"
                value={form.location}
                onChange={handleChange}
                placeholder="Event location or venue"
                required
                className="w-full border-2 border-gray-200 rounded-xl px-5 py-3.5 text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all outline-none"
              />
            </div>

            {/* Capacity and Tag */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Capacity
                </label>
                <input
                  type="number"
                  name="capacity"
                  value={form.capacity}
                  onChange={handleChange}
                  placeholder="Max attendees"
                  min="1"
                  className="w-full border-2 border-gray-200 rounded-xl px-5 py-3.5 text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Tag
                </label>
                <input
                  name="tag"
                  value={form.tag}
                  onChange={handleChange}
                  placeholder="e.g., Workshop, Conference"
                  className="w-full border-2 border-gray-200 rounded-xl px-5 py-3.5 text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all outline-none"
                />
              </div>
            </div>

            {/* Image URL */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Image URL
              </label>
              <input
                name="image"
                value={form.image}
                onChange={handleChange}
                placeholder="https://example.com/image.jpg"
                type="url"
                className="w-full border-2 border-gray-200 rounded-xl px-5 py-3.5 text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all outline-none"
              />
              {form.image && (
                <div className="mt-3 rounded-xl overflow-hidden border-2 border-gray-200">
                  <Image
                    src={form.image}
                    alt="Preview"
                    width={400}
                    height={192}
                    className="w-full h-48 object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold py-4 rounded-xl hover:from-indigo-700 hover:to-purple-700 transform hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg
                      className="animate-spin h-5 w-5"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Creating Event...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    Create Event
                  </span>
                )}
              </button>
            </div>
          </form>
        </div>

        <p className="text-center text-gray-500 text-sm mt-6">
          Fields marked with <span className="text-red-500">*</span> are required
        </p>
      </div>
    </div>
  );
}