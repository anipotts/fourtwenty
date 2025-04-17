"use client";

import React from "react";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

type Thought = {
  id: string;
  content: string;
  created_at: string;
  username: string;
};

export default function ThoughtWall() {
  const [thoughts, setThoughts] = React.useState<Thought[]>([]);
  const [newThought, setNewThought] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [submitLoading, setSubmitLoading] = React.useState(false);
  const [username, setUsername] = React.useState("");

  // Create a supabase client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabase: SupabaseClient = createClient(supabaseUrl!, supabaseKey!);

  // Fetch thoughts
  React.useEffect(() => {
    const fetchThoughts = async () => {
      try {
        const { data, error } = await supabase
          .from("thoughts")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(20);

        if (error) throw error;

        setThoughts(data || []);
      } catch (error) {
        console.error("Error fetching thoughts:", error);

        // Fallback to dummy data if there's an error
        setThoughts([
          {
            id: "1",
            content: "Just saw the most amazing sunset from Central Park ✨",
            created_at: new Date().toISOString(),
            username: "high_thoughts_420",
          },
          {
            id: "2",
            content: "These pretzels in Washington Square are LIFE",
            created_at: new Date(Date.now() - 3600000).toISOString(),
            username: "munchie_maven",
          },
          {
            id: "3",
            content:
              "Anyone catch that art installation on Houston? Mind blown.",
            created_at: new Date(Date.now() - 7200000).toISOString(),
            username: "creative_cloud",
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchThoughts();

    // Set up real-time subscription
    const subscription = supabase
      .channel("thoughts_changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "thoughts",
        },
        (payload) => {
          setThoughts((current) => [payload.new as Thought, ...current]);
        }
      )
      .subscribe();

    // Cleanup subscription
    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  // Clean text before submitting
  const cleanText = async (text: string): Promise<string> => {
    try {
      const response = await fetch("/api/clean", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        throw new Error("Failed to clean text");
      }

      const data = await response.json();
      return data.cleaned;
    } catch (error) {
      console.error("Error cleaning text:", error);
      return text; // Fallback to original text
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!newThought.trim() || !username.trim()) return;

    try {
      setSubmitLoading(true);

      // Clean the text first
      const cleanedText = await cleanText(newThought);

      // Insert the thought
      const { error } = await supabase.from("thoughts").insert([
        {
          content: cleanedText,
          username: username.trim() || "anonymous_user",
        },
      ]);

      if (error) throw error;

      setNewThought("");
    } catch (error) {
      console.error("Error posting thought:", error);
      alert("Failed to post your thought. Please try again.");
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#f8f9fa] text-[#495057] font-serif">
      <div className="py-6 px-4 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-[#4dd783] text-center">
          High-Thought Wall
        </h1>
      </div>

      <div className="flex-1 overflow-y-auto pb-20">
        {loading ? (
          <div className="flex items-center justify-center h-full">
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
                Loading thoughts
              </h3>
              <p className="text-[#6c757d] mt-2">Getting the latest vibes...</p>
            </div>
          </div>
        ) : thoughts.length === 0 ? (
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
                    d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-[#212529] mb-3">
                No thoughts yet
              </h2>
              <p className="text-[#495057] mb-5">
                Be the first to share your high thoughts with the community!
              </p>
            </div>
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {thoughts.map((thought) => (
              <div
                key={thought.id}
                className="bg-white p-5 rounded-lg border border-gray-100 shadow-sm"
              >
                <p className="text-[#212529] mb-4 text-lg">{thought.content}</p>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[#4dd783] font-bold">
                    {thought.username}
                  </span>
                  <span className="text-[#6c757d]">
                    {new Date(thought.created_at).toLocaleString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="fixed bottom-16 left-0 right-0 bg-white border-t border-gray-100 p-4 shadow-md">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex">
            <input
              type="text"
              value={username}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setUsername(e.target.value)
              }
              placeholder="Your nickname..."
              className="flex-1 bg-[#f8f9fa] text-[#495057] px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4dd783] border border-gray-100 mr-2"
              maxLength={20}
            />
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newThought}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setNewThought(e.target.value)
              }
              placeholder="Share your high thought..."
              className="flex-1 bg-[#f8f9fa] text-[#495057] px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4dd783] border border-gray-100"
            />
            <button
              type="submit"
              disabled={submitLoading || !newThought.trim() || !username.trim()}
              className="bg-[#4dd783] text-white px-6 py-3 rounded-lg font-bold disabled:opacity-50 hover:bg-[#3bb871] transition-colors"
            >
              {submitLoading ? "Sending..." : "Send"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
