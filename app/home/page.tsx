"use client";

import React, { useState } from "react";
import BottomNav from "@/components/BottomNav";
import RadarMap from "@/components/RadarMap";
import ThoughtWall from "@/components/ThoughtWall";
import EventList from "@/components/EventList";
import ErrorBoundary from "@/components/ErrorBoundary";

type Tab = "radar" | "wall" | "events";

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<Tab>("radar");

  return (
    <ErrorBoundary>
      <div className="bg-[#f8f9fa] min-h-[100dvh] text-[#495057] relative font-serif">
        <main className="h-[100dvh] pt-safe pb-16">
          {activeTab === "radar" && (
            <div className="h-full">
              <RadarMap />
            </div>
          )}

          {activeTab === "wall" && (
            <div className="h-full">
              <ThoughtWall />
            </div>
          )}

          {activeTab === "events" && (
            <div className="h-full">
              <EventList />
            </div>
          )}
        </main>

        <BottomNav activeTab={activeTab} onChange={setActiveTab} />
      </div>
    </ErrorBoundary>
  );
}
