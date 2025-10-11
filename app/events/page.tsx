"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

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

export default function EventPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [editingEvent, setEditingEvent] = useState<any | null>(null);
  const [form, setForm] = useState<any>({});
  const [loading, setLoading] = useState(false);

  const fetchEvents = async () => {
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .order("start_at", { ascending: true });
    if (!error && data) setEvents(data);
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this event?")) return;
    setLoading(true);
    await supabase.from("events").delete().eq("id", id);
    await fetchEvents();
    setLoading(false);
  };

  const handleEdit = (event: any) => {
    setEditingEvent(event);
    setForm({
      title: event.title,
      description: event.description,
      start_at: event.start_at?.slice(0, 10) || "",
      end_at: event.end_at?.slice(0, 10) || "",
      location: event.location,
      capacity: event.capacity || "",
      image: event.image || "",
      tag: event.tag || "",
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await supabase
      .from("events")
      .update({
        title: form.title,
        description: form.description,
        start_at: new Date(form.start_at).toISOString(),
        end_at: new Date(form.end_at).toISOString(),
        location: form.location,
        capacity: form.capacity ? Number(form.capacity) : null,
        image: form.image,
        tag: form.tag,
      })
      .eq("id", editingEvent.id);
    setEditingEvent(null);
    await fetchEvents();
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-200 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-8 text-center tracking-tight">
          Upcoming Events
        </h1>
        <div className="space-y-8">
          {events.length === 0 && (
            <div className="text-center text-gray-500">No events found.</div>
          )}
          {events.map((event) => (
            <div
              key={event.id}
              className="bg-white rounded-3xl shadow-xl flex flex-col md:flex-row overflow-hidden hover:shadow-2xl transition-shadow"
            >
              {event.image && (
                <img
                  src={event.image}
                  alt={event.title}
                  className="md:w-1/3 h-78 object-cover"
                />
              )}
              <div className="p-8 flex-1 flex flex-col justify-between">
                <div>
                  <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                    {event.title}
                  </h2>
                  <p className="text-gray-500 mb-4">{event.description}</p>
                </div>
                <div className="flex flex-wrap gap-4 text-sm text-gray-600 mt-4">
                  <span className="inline-flex items-center px-3 py-1 bg-gray-100 rounded-full">
                    📅 {formatDate(event.start_at)}
                  </span>
                  <span className="inline-flex items-center px-3 py-1 bg-gray-100 rounded-full">
                    🕒 {formatTime(event.start_at)}
                  </span>
                  <span className="inline-flex items-center px-3 py-1 bg-gray-100 rounded-full">
                    📍 {event.location}
                  </span>
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => handleEdit(event)}
                    className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(event.id)}
                    disabled={loading}
                    className="px-5 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                  >
                    {loading ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Edit Modal */}
        {editingEvent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white rounded-xl p-8 w-full max-w-lg shadow-lg">
              <h2 className="text-2xl font-semibold mb-4">Edit Event</h2>
              <form onSubmit={handleUpdate} className="space-y-4">
                <input
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  placeholder="Title"
                  className="w-full border rounded-lg px-4 py-2"
                />
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Description"
                  className="w-full border rounded-lg px-4 py-2"
                />
                <input
                  name="start_at"
                  type="date"
                  value={form.start_at}
                  onChange={handleChange}
                  className="w-full border rounded-lg px-4 py-2"
                />
                <input
                  name="end_at"
                  type="date"
                  value={form.end_at}
                  onChange={handleChange}
                  className="w-full border rounded-lg px-4 py-2"
                />
                <input
                  name="location"
                  value={form.location}
                  onChange={handleChange}
                  placeholder="Location"
                  className="w-full border rounded-lg px-4 py-2"
                />
                <input
                  name="capacity"
                  type="number"
                  value={form.capacity}
                  onChange={handleChange}
                  placeholder="Capacity"
                  className="w-full border rounded-lg px-4 py-2"
                />
                <input
                  name="image"
                  value={form.image}
                  onChange={handleChange}
                  placeholder="Image URL"
                  className="w-full border rounded-lg px-4 py-2"
                />
                <input
                  name="tag"
                  value={form.tag}
                  onChange={handleChange}
                  placeholder="Tag"
                  className="w-full border rounded-lg px-4 py-2"
                />
                <div className="flex justify-end gap-3 mt-4">
                  <button
                    type="button"
                    onClick={() => setEditingEvent(null)}
                    className="px-4 py-2 border rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    {loading ? "Updating..." : "Update"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
