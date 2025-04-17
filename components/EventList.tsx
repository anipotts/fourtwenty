"use client";

import React from "react";

type Event = {
  id: string;
  title: string;
  date: string;
  location: string;
  description: string;
};

const dummyEvents: Event[] = [
  {
    id: "1",
    title: "420 Happy Hour at Cloudy Lounge",
    date: "2023-04-20T16:20:00",
    location: "Cloudy Lounge, 420 High St, NYC",
    description:
      "Join us for drink specials and good vibes. Live DJ and munchies provided!",
  },
  {
    id: "2",
    title: "Puff & Paint Night",
    date: "2023-04-25T19:00:00",
    location: "Green Gallery, 710 Amsterdam Ave, NYC",
    description:
      "Express your creativity while enjoying a relaxed atmosphere. All art supplies included.",
  },
  {
    id: "3",
    title: "Comedy & Munchies Tour",
    date: "2023-05-01T20:00:00",
    location: "The Joint Comedy Club, 42 W 42nd St, NYC",
    description:
      "NYC's funniest comedians plus a curated menu of snacks. Limited seating available.",
  },
  {
    id: "4",
    title: "Elevated Yoga Session",
    date: "2023-05-10T10:00:00",
    location: "High Minds Wellness, 220 Park Ave, NYC",
    description:
      "Start your day with mindfulness and movement. Beginner-friendly session.",
  },
  {
    id: "5",
    title: "Munchies Food Truck Festival",
    date: "2023-05-15T12:00:00",
    location: "Washington Square Park, NYC",
    description:
      "The city's best food trucks gather for an afternoon of culinary delights.",
  },
];

export default function EventList() {
  return (
    <div className="h-full flex flex-col">
      <div className="py-3 px-4 border-b border-[#e9ecef] bg-white shadow-sm">
        <h1 className="text-xl font-bold text-[#212529]">Event Compass</h1>
      </div>

      <div className="flex-1 overflow-y-auto pb-20 bg-[#f8f9fa]">
        {dummyEvents.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center p-8 max-w-md">
              <div className="mb-6 text-[#4dd783]">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-16 w-16 mx-auto"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-[#212529] mb-3">
                No events found
              </h2>
              <p className="text-[#495057] mb-5 font-sans">
                Check back soon for upcoming events in your area!
              </p>
            </div>
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {dummyEvents.map((event) => (
              <div
                key={event.id}
                className="bg-white rounded-lg p-5 border border-[#e9ecef] shadow-sm"
              >
                <h2 className="text-xl font-bold text-[#212529] mb-3">
                  {event.title}
                </h2>
                <div className="flex items-center text-[#4dd783] mb-3">
                  <svg
                    className="w-5 h-5 mr-2"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <span className="font-bold">
                    {new Date(event.date).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <div className="text-[#495057] mb-4">
                  <svg
                    className="w-5 h-5 mr-2 inline-block"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  <span>{event.location}</span>
                </div>
                <p className="text-[#6c757d] border-t border-[#e9ecef] pt-4 mt-2 font-sans">
                  {event.description}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
