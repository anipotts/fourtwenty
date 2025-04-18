"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import CloudList from "./CloudList";
import CloudCreate from "./CloudCreate";
import CloudJoin from "./CloudJoin";
import CloudRoom from "./CloudRoom";
import CloudShare from "./CloudShare";

type ViewState =
  | "list" // Show list of joined rooms
  | "create" // Create new room
  | "join" // Join a room with code
  | "room" // Inside a room
  | "share"; // Share room details

export default function ThoughtWall() {
  const [nickname, setNickname] = useState("");
  const [viewState, setViewState] = useState<ViewState>("list");
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [activeRoomName, setActiveRoomName] = useState<string | null>(null);
  const [activeRoomCode, setActiveRoomCode] = useState<string | null>(null);
  const [showNicknameModal, setShowNicknameModal] = useState(false);
  const [nicknameInputValue, setNicknameInputValue] = useState("");
  const [nicknameError, setNicknameError] = useState("");

  // Create a supabase client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabase = createClient(supabaseUrl!, supabaseKey!);

  // Load nickname from local storage on mount
  useEffect(() => {
    const savedNickname = localStorage.getItem("cloud_nickname");
    if (savedNickname) {
      setNickname(savedNickname);
    } else {
      setShowNicknameModal(true);
    }
  }, []);

  // Save nickname to local storage when it changes
  useEffect(() => {
    if (nickname) {
      localStorage.setItem("cloud_nickname", nickname);
    }
  }, [nickname]);

  // Handle fetching room code when needed
  useEffect(() => {
    const fetchRoomCode = async () => {
      if (viewState === "share" && activeRoomId && !activeRoomCode) {
        try {
          const { data, error } = await supabase
            .from("cloud_rooms")
            .select("join_code")
            .eq("id", activeRoomId)
            .single();

          if (error) throw error;

          setActiveRoomCode(data.join_code);
        } catch (error) {
          console.error("Error fetching room code:", error);
        }
      }
    };

    fetchRoomCode();
  }, [viewState, activeRoomId, activeRoomCode, supabase]);

  // Handle room selection
  const handleSelectRoom = (roomId: string, roomName: string) => {
    setActiveRoomId(roomId);
    setActiveRoomName(roomName);
    setViewState("room");
  };

  // Handle room creation
  const handleRoomCreated = (roomId: string, roomName: string) => {
    setActiveRoomId(roomId);
    setActiveRoomName(roomName);
    setActiveRoomCode(null); // Reset room code
    setViewState("share");
  };

  // Handle back button
  const handleBack = () => {
    if (viewState === "room" || viewState === "share") {
      setViewState("list");
    } else {
      setViewState("list");
    }
  };

  // Handle share button in room
  const handleShare = () => {
    setViewState("share");
  };

  // Handle nickname submission
  const handleNicknameSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const trimmedNickname = nicknameInputValue.trim();

    if (!trimmedNickname) {
      setNicknameError("Nickname cannot be empty");
      return;
    }

    if (trimmedNickname.length < 2) {
      setNicknameError("Nickname must be at least 2 characters");
      return;
    }

    if (trimmedNickname.length > 20) {
      setNicknameError("Nickname must be at most 20 characters");
      return;
    }

    setNickname(trimmedNickname);
    setShowNicknameModal(false);
    setNicknameError("");
  };

  return (
    <div className="relative h-full">
      {/* Nickname Modal */}
      {showNicknameModal && (
        <div className="flex fixed inset-0 z-50 justify-center items-center p-4 bg-black bg-opacity-50">
          <div className="p-6 w-full max-w-sm bg-white rounded-lg shadow-xl">
            <h2 className="text-xl font-bold text-[#212529] mb-4">
              Enter Your Nickname
            </h2>

            <p className="text-[#6c757d] mb-5">
              Your nickname will be used in all clouds you join or create
            </p>

            {nicknameError && (
              <div className="p-3 mb-4 text-sm text-red-700 bg-red-50 rounded-lg border border-red-100">
                {nicknameError}
              </div>
            )}

            <form onSubmit={handleNicknameSubmit}>
              <input
                type="text"
                value={nicknameInputValue}
                onChange={(e) => setNicknameInputValue(e.target.value)}
                placeholder="Your nickname"
                className="w-full bg-[#f8f9fa] text-[#495057] px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4dd783] border border-gray-200 mb-4"
                maxLength={20}
                autoFocus
              />

              <button
                type="submit"
                className="w-full bg-[#4dd783] text-white py-3 rounded-lg font-bold disabled:opacity-50 hover:bg-[#3bb871] transition-colors"
              >
                Continue
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Main content based on view state */}
      {viewState === "list" && (
        <CloudList
          nickname={nickname}
          onSelectRoom={handleSelectRoom}
          onCreateNew={() => setViewState("create")}
          onJoinRoom={() => setViewState("join")}
        />
      )}

      {viewState === "create" && (
        <CloudCreate
          nickname={nickname}
          onRoomCreated={handleRoomCreated}
          onBack={handleBack}
        />
      )}

      {viewState === "join" && (
        <CloudJoin
          nickname={nickname}
          onRoomJoined={handleSelectRoom}
          onBack={handleBack}
        />
      )}

      {viewState === "room" && activeRoomId && activeRoomName && (
        <div className="relative h-full">
          <CloudRoom
            roomId={activeRoomId}
            roomName={activeRoomName}
            nickname={nickname}
            onBack={handleBack}
          />

          {/* Share button */}
          <button
            onClick={handleShare}
            className="absolute right-4 bottom-20 bg-[#4dd783] text-white p-3 rounded-full shadow-lg hover:bg-[#3bb871] transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
              />
            </svg>
          </button>
        </div>
      )}

      {viewState === "share" &&
        activeRoomId &&
        activeRoomName &&
        activeRoomCode && (
          <CloudShare
            roomName={activeRoomName}
            joinCode={activeRoomCode}
            onBack={() => setViewState("room")}
          />
        )}

      {/* Nickname change button - bottom left */}
      <button
        onClick={() => {
          setNicknameInputValue(nickname);
          setShowNicknameModal(true);
        }}
        className="fixed right-4 bottom-20 bg-white text-[#495057] p-2 rounded-full shadow-lg border border-gray-200 hover:bg-gray-50 transition-colors"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 text-[#4dd783]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
      </button>
    </div>
  );
}
