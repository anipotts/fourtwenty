"use client";

import React, { useEffect, useRef, useState } from "react";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

type CloudMessage = {
  id: string;
  content: string;
  created_at: string;
  nickname: string;
};

interface CloudRoomProps {
  roomId: string;
  roomName: string;
  nickname: string;
  onBack: () => void;
}

export default function CloudRoom({
  roomId,
  roomName,
  nickname,
  onBack,
}: CloudRoomProps) {
  const [messages, setMessages] = useState<CloudMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Create a supabase client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabase: SupabaseClient = createClient(supabaseUrl!, supabaseKey!);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Fetch messages
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const { data, error } = await supabase
          .from("cloud_messages")
          .select("*")
          .eq("room_id", roomId)
          .order("created_at", { ascending: true });

        if (error) throw error;

        setMessages(data || []);
      } catch (error) {
        console.error("Error fetching messages:", error);
        // Show empty array if there's an error
        setMessages([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();

    // Set up real-time subscription
    const subscription = supabase
      .channel(`room_${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "cloud_messages",
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          setMessages((current) => [...current, payload.new as CloudMessage]);
        }
      )
      .subscribe();

    // Cleanup subscription
    return () => {
      subscription.unsubscribe();
    };
  }, [roomId, supabase]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!newMessage.trim()) return;

    try {
      setSendingMessage(true);

      // Insert the message
      const { error } = await supabase.from("cloud_messages").insert([
        {
          room_id: roomId,
          content: newMessage.trim(),
          nickname,
        },
      ]);

      if (error) throw error;

      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Failed to send your message. Please try again.");
    } finally {
      setSendingMessage(false);
    }
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
        <h1 className="ml-2 text-xl font-bold text-[#4dd783]">{roomName}</h1>
      </div>

      <div className="overflow-y-auto flex-1 p-4">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <div className="flex flex-col items-center">
              <div className="rounded-full bg-[#e9ecef] h-12 w-12 mb-4 flex items-center justify-center">
                <svg
                  className="text-[#4dd783] h-6 w-6 animate-spin"
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
              <h3 className="text-base font-bold text-[#212529]">
                Loading cloud
              </h3>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex justify-center items-center h-full">
            <div className="p-6 max-w-md text-center">
              <div className="mb-5 text-[#4dd783]">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="mx-auto w-14 h-14"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    d="M5.03426 11.1174C3.29168 11.5494 2 13.1238 2 15C2 17.2091 3.79086 19 6 19H17C19.7614 19 22 16.7614 22 14C22 11.2386 19.7614 9 17 9C16.5971 9 16.2053 9.04766 15.83 9.13765L14.5 9.5"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M15.83 9.13765C15.2238 6.75905 13.0673 5 10.5 5C7.46243 5 5 7.46243 5 10.5C5 10.7087 5.01163 10.9147 5.03426 11.1174C5.03426 11.1174 5.1875 12 5.5 12.5"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <h2 className="text-lg font-bold text-[#212529] mb-2">
                Welcome to the cloud!
              </h2>
              <p className="text-[#495057] mb-4">
                Send the first message to start the conversation.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`p-3 rounded-lg max-w-[85%] ${
                  message.nickname === nickname
                    ? "bg-[#4dd783] text-white ml-auto"
                    : "bg-white border border-gray-100 mr-auto"
                }`}
              >
                <p className="mb-1">{message.content}</p>
                <div className="flex justify-between items-center text-xs">
                  <span
                    className={
                      message.nickname === nickname
                        ? "text-white/90 font-medium"
                        : "text-[#4dd783] font-bold"
                    }
                  >
                    {message.nickname}
                  </span>
                  <span
                    className={
                      message.nickname === nickname
                        ? "text-white/75"
                        : "text-[#6c757d]"
                    }
                  >
                    {new Date(message.created_at).toLocaleString(undefined, {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <div className="p-3 bg-white border-t border-gray-100">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 bg-[#f8f9fa] text-[#495057] px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4dd783] border border-gray-100"
            disabled={sendingMessage}
          />
          <button
            type="submit"
            disabled={sendingMessage || !newMessage.trim()}
            className="bg-[#4dd783] text-white px-5 py-3 rounded-lg font-bold disabled:opacity-50 hover:bg-[#3bb871] transition-colors"
          >
            {sendingMessage ? (
              <svg
                className="h-5 w-5 animate-spin"
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
            ) : (
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
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
