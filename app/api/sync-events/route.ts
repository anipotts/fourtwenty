import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

// Configure edge runtime
export const runtime = "edge";

// Define interface for events
interface Event {
  id: string;
  title: string;
  description: string;
  start_time: string;
  end_time?: string;
  location: string;
  address: string;
  lat?: number;
  lng?: number;
  url?: string;
  image_url?: string;
  source: "nyc_open_data" | "ticketmaster";
  created_at: string;
}

/**
 * API route to sync events from NYC Open Data and Ticketmaster
 * Designed to be called by a Vercel cron job
 */
export async function GET() {
  try {
    // Initialize Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Get today's date for filtering
    const today = new Date();
    const formattedDate = today.toISOString().split("T")[0];

    // Fetch events from NYC Open Data
    const nycEvents = await fetchNycOpenDataEvents(formattedDate);

    // Fetch events from Ticketmaster
    const ticketmasterEvents = await fetchTicketmasterEvents(formattedDate);

    // Combine events
    const allEvents = [...nycEvents, ...ticketmasterEvents];

    // Upsert events to Supabase
    const { error, count } = await supabase
      .from("events")
      .upsert(allEvents, {
        onConflict: "id",
        ignoreDuplicates: false,
      })
      .select("count");

    if (error) {
      throw error;
    }

    // Return success response
    return NextResponse.json({
      success: true,
      message: `Successfully synced ${allEvents.length} events, ${count} updated/inserted.`,
      eventsCount: {
        nyc: nycEvents.length,
        ticketmaster: ticketmasterEvents.length,
        total: allEvents.length,
      },
    });
  } catch (error) {
    console.error("Event sync error:", error);
    return NextResponse.json(
      { error: "Failed to sync events" },
      { status: 500 }
    );
  }
}

/**
 * Fetch events from NYC Open Data API
 */
async function fetchNycOpenDataEvents(date: string): Promise<Event[]> {
  try {
    // NYC Open Data API for events
    // Query for events happening today or in the future
    const url = `https://data.cityofnewyork.us/resource/6v4b-5runz.json?$where=start_date_time>='${date}T00:00:00.000'`;

    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`NYC Open Data API error: ${response.status}`);
    }

    const data = await response.json();

    // Transform the response to our Event format
    // Filter for events with "cannabis", "marijuana", "420", etc. in title or description
    return data
      .filter((event: any) => {
        const title = event.event_name?.toLowerCase() || "";
        const desc = event.event_description?.toLowerCase() || "";
        const keywords = [
          "cannabis",
          "marijuana",
          "weed",
          "420",
          "hemp",
          "cbd",
        ];
        return keywords.some(
          (word) => title.includes(word) || desc.includes(word)
        );
      })
      .map((event: any) => ({
        id: `nyc_${event.event_id || Date.now()}`,
        title: event.event_name || "NYC Event",
        description: event.event_description || "",
        start_time: event.start_date_time || "",
        end_time: event.end_date_time || "",
        location: event.event_location || "",
        address: event.event_address || "",
        lat: event.latitude ? parseFloat(event.latitude) : undefined,
        lng: event.longitude ? parseFloat(event.longitude) : undefined,
        url: event.event_url || "",
        image_url: event.event_featured_image || "",
        source: "nyc_open_data" as const,
        created_at: new Date().toISOString(),
      }));
  } catch (error) {
    console.error("Error fetching NYC Open Data events:", error);
    return []; // Return empty array on error rather than failing completely
  }
}

/**
 * Fetch events from Ticketmaster API
 */
async function fetchTicketmasterEvents(date: string): Promise<Event[]> {
  try {
    // Only proceed if API key exists
    if (!process.env.TICKETMASTER_API_KEY) {
      console.warn(
        "Ticketmaster API key not found, skipping Ticketmaster events"
      );
      return [];
    }

    // Ticketmaster API for events
    const url = new URL(
      "https://app.ticketmaster.com/discovery/v2/events.json"
    );
    const params = new URLSearchParams({
      apikey: process.env.TICKETMASTER_API_KEY,
      keyword: "420,cannabis,marijuana",
      city: "New York",
      startDateTime: `${date}T00:00:00Z`,
      sort: "date,asc",
      size: "100",
    });

    url.search = params.toString();

    const response = await fetch(url.toString(), {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Ticketmaster API error: ${response.status}`);
    }

    const data = await response.json();

    // Handle case where no events are found
    if (!data._embedded || !data._embedded.events) {
      return [];
    }

    // Transform the response to our Event format
    return data._embedded.events.map((event: any) => {
      // Extract venue information
      const venue = event._embedded?.venues?.[0] || {};

      return {
        id: `tm_${event.id}`,
        title: event.name || "Ticketmaster Event",
        description: event.description || event.info || "",
        start_time: event.dates?.start?.dateTime || "",
        end_time: event.dates?.end?.dateTime || "",
        location: venue.name || "",
        address: [
          venue.address?.line1,
          venue.city?.name,
          venue.state?.stateCode,
        ]
          .filter(Boolean)
          .join(", "),
        lat: venue.location?.latitude
          ? parseFloat(venue.location.latitude)
          : undefined,
        lng: venue.location?.longitude
          ? parseFloat(venue.location.longitude)
          : undefined,
        url: event.url || "",
        image_url:
          event.images?.find(
            (img: any) => img.ratio === "16_9" && img.width > 500
          )?.url ||
          event.images?.[0]?.url ||
          "",
        source: "ticketmaster" as const,
        created_at: new Date().toISOString(),
      };
    });
  } catch (error) {
    console.error("Error fetching Ticketmaster events:", error);
    return []; // Return empty array on error rather than failing completely
  }
}
