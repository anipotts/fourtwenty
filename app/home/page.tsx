"use client";

import React, { useState, useEffect } from "react";
import BottomNav from "@/components/BottomNav";
import RadarMap from "@/components/RadarMap";
import ThoughtWall from "@/components/ThoughtWall";
import EventList from "@/components/EventList";
import ErrorBoundary from "@/components/ErrorBoundary";
import ChatInterface from "@/components/ChatInterface";
import ChatButton from "@/components/ChatButton";

type Tab = "radar" | "cloud" | "events";

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<Tab>("radar");
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Handle tab change and close chat
  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    setIsChatOpen(false);
  };

  // Determine if chat should be shown for the current tab
  const shouldShowChat =
    activeTab === "radar" || activeTab === "events" || activeTab === "cloud";

  // Determine chat title based on active tab
  const getChatTitle = () => {
    if (activeTab === "radar") return "420 Eats Assistant";
    if (activeTab === "events") return "420 Events Assistant";
    return "420 Assistant";
  };

  return (
    <ErrorBoundary>
      <div className="bg-[#f8f9fa] min-h-[100dvh] text-[#495057] relative font-serif">
        <main className="h-[100dvh] pt-safe pb-16">
          {activeTab === "radar" && (
            <div className="h-full">
              <RadarMap />
            </div>
          )}

          {activeTab === "cloud" && (
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

        {/* Chat button for opening the chat */}
        {shouldShowChat && (
          <ChatButton isOpen={isChatOpen} onClick={() => setIsChatOpen(true)} />
        )}

        {/* Chat interface */}
        <ChatInterface
          isOpen={isChatOpen && shouldShowChat}
          onClose={() => setIsChatOpen(false)}
          title={getChatTitle()}
        />

        <BottomNav activeTab={activeTab} onChange={handleTabChange} />
      </div>
    </ErrorBoundary>
  );
}
