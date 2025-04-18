"use client";

import React, { useEffect, useState } from "react";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

type CloudRoom = {
  id: string;
  name: string;
  join_code: string;
  created_at: string;
};

interface CloudListProps {
  nickname: string;
  onSelectRoom: (roomId: string, roomName: string) => void;
  onCreateNew: () => void;
  onJoinRoom: () => void;
}

export default function CloudList({
  nickname,
  onSelectRoom,
  onCreateNew,
  onJoinRoom,
}: CloudListProps) {
  const [rooms, setRooms] = useState<CloudRoom[]>([]);
  const [loading, setLoading] = useState(true);

  // Create a supabase client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabase: SupabaseClient = createClient(supabaseUrl!, supabaseKey!);

  // Fetch rooms the user has joined
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        // Get all rooms the user has joined
        const { data, error } = await supabase
          .from("cloud_participants")
          .select(
            `
            room_id,
            cloud_rooms (
              id,
              name,
              join_code,
              created_at
            )
          `
          )
          .eq("nickname", nickname);

        if (error) throw error;

        // Format the data
        const formattedRooms = data
          .map((item: any) => item.cloud_rooms)
          .filter(Boolean)
          .sort(
            (a: CloudRoom, b: CloudRoom) =>
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime()
          );

        setRooms(formattedRooms);
      } catch (error) {
        console.error("Error fetching rooms:", error);
        setRooms([]);
      } finally {
        setLoading(false);
      }
    };

    if (nickname) {
      fetchRooms();
    } else {
      setLoading(false);
    }
  }, [nickname, supabase]);

  return (
    <div className="flex flex-col h-full bg-[#f8f9fa] text-[#495057] font-serif">
      <div className="px-4 py-6 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-[#4dd783] text-center">
          My Clouds
        </h1>
      </div>

      <div className="grid grid-cols-2 gap-3 p-4">
        {/* Create New Cloud Button */}
        <button
          onClick={onCreateNew}
          className="flex flex-col items-center justify-center p-4 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow transition-all"
        >
          <div className="rounded-full bg-[#f1f8e9] p-3 mb-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-7 w-7 text-[#4dd783]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
          </div>
          <span className="text-[#212529] font-medium text-sm text-center">
            Create Cloud
          </span>
        </button>

        {/* Join Cloud Button */}
        <button
          onClick={onJoinRoom}
          className="flex flex-col items-center justify-center p-4 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow transition-all"
        >
          <div className="rounded-full bg-[#f1f8e9] p-3 mb-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-7 w-7 text-[#4dd783]"
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
          <span className="text-[#212529] font-medium text-sm text-center">
            Join Cloud
          </span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 pb-20">
        <h2 className="text-lg font-bold mb-3 text-[#212529]">Your Clouds</h2>

        {loading ? (
          <div className="flex justify-center items-center p-8">
            <div className="flex flex-col items-center">
              <div className="rounded-full bg-[#e9ecef] h-10 w-10 mb-3 flex items-center justify-center">
                <svg
                  className="text-[#4dd783] h-5 w-5 animate-spin"
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
              <p className="text-sm text-[#6c757d]">Loading your clouds...</p>
            </div>
          </div>
        ) : rooms.length === 0 ? (
          <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
            <p className="text-center text-[#6c757d]">
              {nickname
                ? "You haven't joined any clouds yet"
                : "Enter your nickname to see your clouds"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {rooms.map((room) => (
              <button
                key={room.id}
                onClick={() => onSelectRoom(room.id, room.name)}
                className="block w-full text-left bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow transition-all"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-[#212529]">{room.name}</h3>
                    <p className="text-xs text-[#6c757d] mt-1">
                      Code: {room.join_code}
                    </p>
                  </div>
                  <div className="rounded-full bg-[#f1f8e9] p-2">
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
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
