import { NextRequest, NextResponse } from "next/server";
import Filter from "bad-words";

// Configure edge runtime
export const runtime = "edge";

/**
 * Edge function to clean user-generated text by filtering profanity
 * @param request - The NextRequest object containing the text to clean
 * @returns A NextResponse with the cleaned text
 */
export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();

    // Validate input
    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid parameter: text" },
        { status: 400 }
      );
    }

    // Initialize profanity filter
    const filter = new Filter();

    // Add additional cannabis-friendly words to the whitelist
    const cannabisTerms = [
      "weed",
      "cannabis",
      "marijuana",
      "joint",
      "blunt",
      "doobie",
      "bong",
      "pipe",
      "herb",
      "grass",
      "pot",
      "dope",
      "stoned",
      "high",
      "baked",
    ];

    // Remove these terms from the blacklist if they're present
    cannabisTerms.forEach((term) => {
      if (filter.list.includes(term)) {
        filter.removeWords(term);
      }
    });

    // Clean the text
    const cleaned = filter.clean(text);

    // Return the cleaned text
    return NextResponse.json({ original: text, cleaned });
  } catch (error) {
    console.error("Text cleaning error:", error);
    return NextResponse.json(
      { error: "Failed to process text" },
      { status: 500 }
    );
  }
}
