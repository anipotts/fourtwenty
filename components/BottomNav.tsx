"use client";

import React from "react";

type Tab = "radar" | "wall" | "events";

interface BottomNavProps {
  activeTab: Tab;
  onChange: (tab: Tab) => void;
}

export default function BottomNav({ activeTab, onChange }: BottomNavProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      <div className="bg-[#f8f9fa] border-t border-gray-100 shadow-lg pb-safe">
        <nav className="flex justify-around items-center h-16 font-serif">
          <button
            onClick={() => onChange("radar")}
            className={`flex flex-col items-center justify-center w-full h-full ${
              activeTab === "radar" ? "text-[#4dd783]" : "text-[#495057]"
            }`}
          >
            <svg
              className="h-5 w-5 mb-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <span className="text-xs font-medium">Radar</span>
          </button>

          <button
            onClick={() => onChange("wall")}
            className={`flex flex-col items-center justify-center w-full h-full ${
              activeTab === "wall" ? "text-[#4dd783]" : "text-[#495057]"
            }`}
          >
            <svg
              className="h-5 w-5 mb-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
              />
            </svg>
            <span className="text-xs font-medium">Wall</span>
          </button>

          <button
            onClick={() => onChange("events")}
            className={`flex flex-col items-center justify-center w-full h-full ${
              activeTab === "events" ? "text-[#4dd783]" : "text-[#495057]"
            }`}
          >
            <svg
              className="h-5 w-5 mb-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span className="text-xs font-medium">Events</span>
          </button>
        </nav>
      </div>
    </div>
  );
}
