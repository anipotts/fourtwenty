import { createClient } from "@vercel/edge-config";
import { NextRequest, NextResponse } from "next/server";

// Define the response type from Yelp API
interface YelpVenue {
  id: string;
  name: string;
  url: string;
  image_url: string;
  location: {
    address1: string;
    city: string;
    state: string;
    zip_code: string;
    display_address: string[];
  };
  rating: number;
  review_count: number;
  categories: { alias: string; title: string }[];
  price?: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  distance: number;
  is_closed: boolean;
}

interface YelpResponse {
  businesses: YelpVenue[];
  total: number;
}

// Configure edge runtime
export const runtime = "edge";

/**
 * Edge function to fetch food venues from Yelp API
 * @param request - The NextRequest object containing query parameters
 * @returns A NextResponse with the venue data
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");

  // Validate parameters
  if (!lat || !lng) {
    return NextResponse.json(
      { error: "Missing required parameters: lat, lng" },
      { status: 400 }
    );
  }

  try {
    // Initialize edge config for caching
    const edgeConfig = createClient(process.env.EDGE_CONFIG!);

    // Check cache first
    const cacheKey = `yelp_venues_${lat}_${lng}`;
    const cachedData = await edgeConfig.get(cacheKey);

    if (cachedData) {
      return NextResponse.json(cachedData);
    }

    // Prepare API request
    const yelpUrl = new URL("https://api.yelp.com/v3/businesses/search");
    const params = new URLSearchParams({
      latitude: lat,
      longitude: lng,
      radius: "1000", // 1km
      categories: "food,restaurants",
      sort_by: "rating",
      limit: "15",
      open_now: "true",
    });

    yelpUrl.search = params.toString();

    // Make request to Yelp API
    const response = await fetch(yelpUrl.toString(), {
      headers: {
        Authorization: `Bearer ${process.env.YELP_API_KEY}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Yelp API error: ${response.status}`);
    }

    const data = (await response.json()) as YelpResponse;

    // Format the response for our frontend
    const venues = data.businesses.map((business) => ({
      id: business.id,
      name: business.name,
      url: business.url,
      imageUrl: business.image_url,
      address: business.location.display_address.join(", "),
      rating: business.rating,
      reviewCount: business.review_count,
      categories: business.categories.map((c) => c.title),
      price: business.price || "",
      coordinates: business.coordinates,
      distance: Math.round(business.distance),
      isClosed: business.is_closed,
    }));

    // Cache the response for 5 minutes
    try {
      await edgeConfig.set(cacheKey, venues, { ttl: 300 }); // 300 seconds = 5 minutes
    } catch (cacheError) {
      // Log cache error but continue serving the response
      console.error("Edge Config cache error:", cacheError);
    }

    return NextResponse.json(venues);
  } catch (error) {
    console.error("Yelp API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch venue data" },
      { status: 500 }
    );
  }
}
