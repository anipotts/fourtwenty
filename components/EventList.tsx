"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { decode } from "@googlemaps/polyline-codec";
import { format, parseISO } from "date-fns";

type Event = {
  id: string;
  title: string;
  date: string;
  location: string;
  address: string;
  description: string;
  lat?: number;
  lng?: number;
  url?: string;
  image_url?: string;
  source: "nyc_open_data" | "ticketmaster";
};

export default function EventList() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  // Initialize Supabase client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabase = createClient(supabaseUrl!, supabaseKey!);

  // Fetch user's location
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error("Error getting location:", error);
          // Default to NYC coordinates if geolocation fails
          setUserLocation({ lat: 40.7128, lng: -74.006 });
        }
      );
    } else {
      // Default to NYC coordinates if geolocation not available
      setUserLocation({ lat: 40.7128, lng: -74.006 });
    }
  }, []);

  // Fetch events from Supabase
  useEffect(() => {
    async function fetchEvents() {
      try {
        // Get current date in UTC format
        const today = new Date().toISOString();

        // Query Supabase for events happening today or in the future
        const { data, error } = await supabase
          .from("events")
          .select("*")
          .gte("start_time", today)
          .order("start_time", { ascending: true });

        if (error) throw error;

        // Set events if we have data
        if (data && data.length > 0) {
          setEvents(data);
        } else {
          // Fallback to dummy data if no real events
          setEvents(dummyEvents);
        }
      } catch (error) {
        console.error("Error fetching events:", error);
        // Fallback to dummy data on error
        setEvents(dummyEvents);
      } finally {
        setLoading(false);
      }
    }

    fetchEvents();
  }, [supabase]);

  // Calculate distance from user to event
  const calculateDistance = (eventLat?: number, eventLng?: number): string => {
    if (!userLocation || !eventLat || !eventLng) return "Unknown distance";

    // Simple Haversine formula to calculate distance
    const R = 6371e3; // Earth radius in meters
    const φ1 = (userLocation.lat * Math.PI) / 180;
    const φ2 = (eventLat * Math.PI) / 180;
    const Δφ = ((eventLat - userLocation.lat) * Math.PI) / 180;
    const Δλ = ((eventLng - userLocation.lng) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    // Format distance
    if (distance < 1000) {
      return `${Math.round(distance)}m away`;
    } else {
      return `${(distance / 1609.34).toFixed(1)} mi away`; // Convert to miles
    }
  };

  // Group events by date
  const groupEventsByDate = () => {
    const grouped: { [key: string]: Event[] } = {};

    events.forEach((event) => {
      const date = new Date(event.date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });

      if (!grouped[date]) {
        grouped[date] = [];
      }

      grouped[date].push(event);
    });

    return grouped;
  };

  // Format event date with date-fns
  const formatEventDate = (dateString: string): string => {
    try {
      const date = parseISO(dateString);
      return format(date, "MMMM d, yyyy • h:mm a");
    } catch (e) {
      return dateString;
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#f8f9fa] text-[#495057] font-serif">
      <div className="px-4 py-6 border-b border-gray-200">
        <h1 className="text-2xl text-center font-bold text-[#4dd783]">
          Events Near You
        </h1>
      </div>

      <div className="overflow-y-auto flex-1 p-4">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <div className="flex flex-col items-center">
              <div className="rounded-full bg-[#e9ecef] h-16 w-16 mb-5 flex items-center justify-center">
                <svg
                  className="text-[#4dd783] h-8 w-8 animate-spin"
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
              </div>
              <h3 className="text-lg font-bold text-[#212529]">
                Loading events
              </h3>
              <p className="text-[#6c757d] mt-2 font-sans">
                Finding 4/20 friendly events near you...
              </p>
            </div>
          </div>
        ) : events.length === 0 ? (
          <div className="flex flex-col justify-center items-center p-4 h-full text-center">
            <svg
              className="w-16 h-16 mb-4 text-[#4dd783]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1"
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              ></path>
            </svg>
            <h3 className="mb-2 text-xl font-bold">No Events Found</h3>
            <p className="text-sm">
              There are no upcoming events at this time. Please check back
              later.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(groupEventsByDate()).map(([date, dateEvents]) => (
              <div key={date} className="space-y-4">
                <h2 className="text-lg font-bold text-[#4dd783] px-2">
                  {date}
                </h2>

                {dateEvents.map((event) => (
                  <div
                    key={event.id}
                    className="p-4 bg-white rounded-lg border border-gray-100 shadow-sm"
                  >
                    <h3 className="mb-1 text-lg font-bold">{event.title}</h3>
                    <div className="flex items-center mb-2 text-sm">
                      <svg
                        className="mr-1 w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        ></path>
                      </svg>
                      <span>{formatEventDate(event.date)}</span>
                    </div>
                    <div className="flex items-center mb-2 text-sm">
                      <svg
                        className="mr-1 w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        ></path>
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        ></path>
                      </svg>
                      <span>{event.location}</span>

                      {event.lat && event.lng && userLocation && (
                        <span className="ml-2 text-xs text-[#6c757d] font-medium py-1 px-2 bg-[#f8f9fa] rounded-full">
                          {calculateDistance(event.lat, event.lng)}
                        </span>
                      )}
                    </div>
                    <p className="text-[#6c757d] border-t border-[#e9ecef] pt-4 mt-2 font-sans">
                      {event.description}
                    </p>

                    {event.url && (
                      <div className="mt-4">
                        <a
                          href={event.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#4dd783] font-medium hover:underline"
                        >
                          More details →
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Fallback dummy data if Supabase fetch fails
const dummyEvents: Event[] = [
  {
    id: "1",
    title: "420 Happy Hour at Cloudy Lounge",
    date: "2023-04-20T16:20:00",
    location: "Cloudy Lounge",
    address: "420 High St, NYC",
    description:
      "Join us for drink specials and good vibes. Live DJ and munchies provided!",
    lat: 40.7128,
    lng: -74.006,
    source: "nyc_open_data",
  },
  {
    id: "2",
    title: "Puff & Paint Night",
    date: "2023-04-25T19:00:00",
    location: "Green Gallery",
    address: "710 Amsterdam Ave, NYC",
    description:
      "Express your creativity while enjoying a relaxed atmosphere. All art supplies included.",
    lat: 40.7831,
    lng: -73.9712,
    source: "nyc_open_data",
  },
  {
    id: "3",
    title: "Comedy & Munchies Tour",
    date: "2023-05-01T20:00:00",
    location: "The Joint Comedy Club",
    address: "42 W 42nd St, NYC",
    description:
      "NYC's funniest comedians plus a curated menu of snacks. Limited seating available.",
    lat: 40.7551,
    lng: -73.9837,
    source: "ticketmaster",
    url: "https://www.ticketmaster.com/event/example",
  },
  {
    id: "4",
    title: "Elevated Yoga Session",
    date: "2023-05-10T10:00:00",
    location: "High Minds Wellness",
    address: "220 Park Ave, NYC",
    description:
      "Start your day with mindfulness and movement. Beginner-friendly session.",
    lat: 40.7467,
    lng: -73.9807,
    source: "nyc_open_data",
  },
  {
    id: "5",
    title: "Munchies Food Truck Festival",
    date: "2023-05-15T12:00:00",
    location: "Washington Square Park",
    address: "Washington Square Park, NYC",
    description:
      "The city's best food trucks gather for an afternoon of culinary delights.",
    lat: 40.7308,
    lng: -73.9973,
    source: "ticketmaster",
    image_url: "https://example.com/food-truck-festival.jpg",
  },
];
