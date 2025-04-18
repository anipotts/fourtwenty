import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

// Configure edge runtime
export const runtime = "edge";

// Define interface for OpenAI response
interface VenueSummary {
  id: string;
  summary: string;
}

/**
 * Edge function to generate stoner-friendly summaries of food venues
 * using OpenAI
 * @param request - The NextRequest object containing query parameters
 * @returns A NextResponse with the summary
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  // Validate parameters
  if (!id) {
    return NextResponse.json(
      { error: "Missing required parameter: id" },
      { status: 400 }
    );
  }

  try {
    // Fetch venue details from Yelp API
    const yelpResponse = await fetch(
      `https://api.yelp.com/v3/businesses/${id}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.YELP_API_KEY}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      }
    );

    if (!yelpResponse.ok) {
      throw new Error(`Yelp API error: ${yelpResponse.status}`);
    }

    const venueData = await yelpResponse.json();

    // Extract relevant details for the prompt
    const venueName = venueData.name;
    const categories = venueData.categories.map((c: any) => c.title).join(", ");
    const price = venueData.price || "unknown price";
    const rating = venueData.rating || "no rating";
    const reviewCount = venueData.review_count || 0;

    // Create OpenAI client
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Generate a stoner-friendly summary
    const prompt = `
    You are a helpful budtender who loves food and is providing advice to someone who's high.
    
    Venue: ${venueName}
    Categories: ${categories}
    Price: ${price}
    Rating: ${rating}/5 (${reviewCount} reviews)
    
    Write a 140-character-or-less fun, stoner-friendly summary of this place that tells why it would be a good munchies spot.
    Use casual, slightly silly language but still be informative.
    Do not use hashtags, emojis, or quotation marks.
    `;

    const chatCompletion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-3.5-turbo",
      max_tokens: 100,
      temperature: 0.7,
    });

    // Format the response
    const summary =
      chatCompletion.choices[0].message.content?.trim() ||
      "Chill spot for hungry stoners seeking tasty eats.";

    // Return the summary
    return NextResponse.json({
      id,
      summary,
    });
  } catch (error) {
    console.error("Summary API error:", error);
    return NextResponse.json(
      { error: "Failed to generate summary" },
      { status: 500 }
    );
  }
}
