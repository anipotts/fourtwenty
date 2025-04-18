"use client";

import React, { useState } from "react";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

interface CloudJoinProps {
  nickname: string;
  onRoomJoined: (roomId: string, roomName: string) => void;
  onBack: () => void;
}

export default function CloudJoin({
  nickname,
  onRoomJoined,
  onBack,
}: CloudJoinProps) {
  const [joinCode, setJoinCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState("");

  // Create a supabase client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabase: SupabaseClient = createClient(supabaseUrl!, supabaseKey!);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!joinCode.trim()) {
      setError("Please enter a join code");
      return;
    }

    if (!nickname.trim()) {
      setError("Please enter your nickname first");
      return;
    }

    try {
      setJoining(true);
      setError("");

      // Find the room with this join code
      const { data: room, error: roomError } = await supabase
        .from("cloud_rooms")
        .select("*")
        .eq("join_code", joinCode.trim())
        .single();

      if (roomError) {
        if (roomError.code === "PGRST116") {
          throw new Error(
            "Cloud not found. Please check the join code and try again."
          );
        }
        throw roomError;
      }

      // Check if user is already a participant
      const { data: existingParticipant, error: participantCheckError } =
        await supabase
          .from("cloud_participants")
          .select("*")
          .eq("room_id", room.id)
          .eq("nickname", nickname.trim())
          .single();

      if (!participantCheckError && existingParticipant) {
        // User is already in this room with this nickname, just join it
        onRoomJoined(room.id, room.name);
        return;
      }

      // Add the user as a participant
      const { error: participantError } = await supabase
        .from("cloud_participants")
        .insert([
          {
            room_id: room.id,
            nickname: nickname.trim(),
          },
        ]);

      if (participantError) throw participantError;

      // Navigate to the room
      onRoomJoined(room.id, room.name);
    } catch (error: any) {
      console.error("Error joining cloud:", error);
      setError(error.message || "Failed to join cloud. Please try again.");
    } finally {
      setJoining(false);
    }
  };

  // Format join code input (digits only, max 4)
  const handleJoinCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow digits and limit to 4 characters
    const formattedValue = value.replace(/\D/g, "").substring(0, 4);
    setJoinCode(formattedValue);
  };

  return (
    <div className="flex flex-col h-full bg-[#f8f9fa] text-[#495057] font-serif">
      <div className="px-4 py-3 border-b border-gray-200 flex items-center">
        <button
          onClick={onBack}
          className="text-[#495057] p-2 hover:bg-gray-100 rounded-full"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
        <h1 className="ml-2 text-xl font-bold text-[#4dd783]">Join Cloud</h1>
      </div>

      <div className="p-6 flex-1">
        <div className="max-w-md mx-auto">
          <div className="mb-8 text-center">
            <div className="inline-block p-4 bg-[#f1f8e9] rounded-full mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-10 w-10 text-[#4dd783]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-[#212529] mb-2">
              Join a Cloud
            </h2>
            <p className="text-[#6c757d]">
              Enter the 4-digit code from your friend
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label
                htmlFor="joinCode"
                className="block text-[#495057] font-medium"
              >
                4-Digit Code
              </label>
              <input
                id="joinCode"
                type="text"
                inputMode="numeric"
                value={joinCode}
                onChange={handleJoinCodeChange}
                placeholder="Enter 4-digit code"
                className="w-full bg-white text-[#495057] px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4dd783] border border-gray-200 text-center text-2xl tracking-widest"
                maxLength={4}
                disabled={joining}
              />
              <p className="text-xs text-[#6c757d] text-center">
                Ask your friend to share their cloud code with you
              </p>
            </div>

            <button
              type="submit"
              disabled={joining || joinCode.length !== 4 || !nickname.trim()}
              className="w-full bg-[#4dd783] text-white py-3 rounded-lg font-bold disabled:opacity-50 hover:bg-[#3bb871] transition-colors"
            >
              {joining ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                  Joining...
                </span>
              ) : (
                "Join Cloud"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
