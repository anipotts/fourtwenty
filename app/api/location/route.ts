import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  const city = req.headers.get("x-vercel-ip-city") || null;
  const region = req.headers.get("x-vercel-ip-country-region") || null;
  const country = req.headers.get("x-vercel-ip-country") || null;
  const timezone = req.headers.get("x-vercel-ip-timezone") || null;

  // NYC = any of the 5 boroughs or surrounding metro
  const nycCities = [
    "new york",
    "brooklyn",
    "queens",
    "bronx",
    "manhattan",
    "staten island",
    "long island city",
    "astoria",
    "flushing",
    "jamaica",
    "harlem",
    "williamsburg",
  ];

  const isNYC =
    (city && nycCities.some((c) => city.toLowerCase().includes(c))) ||
    (city && region === "NY");

  // Admin override: ?admin=420 forces NYC mode for testing
  const isAdmin = req.nextUrl.searchParams.get("admin") === "420";

  return NextResponse.json({
    city: city ? decodeURIComponent(city) : null,
    region,
    country,
    timezone,
    isNYC: isAdmin || !!isNYC,
    isAdmin,
  });
}
