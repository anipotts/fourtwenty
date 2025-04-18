"use client";

import React from "react";

type Tab = "radar" | "cloud" | "events";

interface BottomNavProps {
  activeTab: Tab;
  onChange: (tab: Tab) => void;
}

export default function BottomNav({ activeTab, onChange }: BottomNavProps) {
  return (
    <div className="fixed right-0 bottom-0 left-0 z-50">
      <div className="bg-[#f8f9fa] border-t border-gray-100 shadow-lg pb-safe">
        <nav className="flex justify-around items-center h-16 font-serif">
          <button
            onClick={() => onChange("radar")}
            className={`flex flex-col items-center justify-center w-full h-full ${
              activeTab === "radar" ? "text-[#4dd783]" : "text-[#495057]"
            }`}
          >
            <svg
              className="mb-1 w-5 h-5"
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
            <span className="text-xs font-medium">Eats</span>
          </button>

          <button
            onClick={() => onChange("cloud")}
            className={`flex flex-col items-center justify-center w-full h-full ${
              activeTab === "cloud" ? "text-[#4dd783]" : "text-[#495057]"
            }`}
          >
            <svg
              className="mb-1 w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                d="M5.03426 11.1174C3.29168 11.5494 2 13.1238 2 15C2 17.2091 3.79086 19 6 19H17C19.7614 19 22 16.7614 22 14C22 11.2386 19.7614 9 17 9C16.5971 9 16.2053 9.04766 15.83 9.13765L14.5 9.5"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d="M15.83 9.13765C15.2238 6.75905 13.0673 5 10.5 5C7.46243 5 5 7.46243 5 10.5C5 10.7087 5.01163 10.9147 5.03426 11.1174C5.03426 11.1174 5.1875 12 5.5 12.5"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />{" "}
            </svg>
            <span className="text-xs font-medium">Cloud</span>
          </button>

          <button
            onClick={() => onChange("events")}
            className={`flex flex-col items-center justify-center w-full h-full ${
              activeTab === "events" ? "text-[#4dd783]" : "text-[#495057]"
            }`}
          >
            <svg
              className="mb-1 w-5 h-5"
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
