"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  GoogleMap,
  useJsApiLoader,
  Marker,
  InfoWindow,
} from "@react-google-maps/api";

// Define venue type from Yelp API
interface Venue {
  id: string;
  name: string;
  imageUrl: string;
  url: string;
  address: string;
  rating: number;
  reviewCount: number;
  categories: string[];
  price: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  distance: number;
  isClosed: boolean;
}

// Define venue summary from OpenAI
interface VenueSummary {
  id: string;
  summary: string;
}

// Map container style
const containerStyle = {
  width: "100%",
  height: "100%",
};

// Default center coordinates (NYC)
const center = {
  lat: 40.7128,
  lng: -74.006,
};

// Map options
const defaultOptions = {
  disableDefaultUI: true,
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: false,
  styles: [
    {
      featureType: "all",
      elementType: "all",
      stylers: [{ saturation: -40 }, { hue: "#4dd783" }],
    },
    {
      featureType: "water",
      elementType: "all",
      stylers: [{ color: "#e9ecef" }],
    },
    {
      featureType: "road",
      elementType: "geometry",
      stylers: [{ color: "#ffffff" }],
    },
  ],
};

export default function RadarMap() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [venuesSummaries, setVenuesSummaries] = useState<{
    [key: string]: string;
  }>({});
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [mapCenter, setMapCenter] = useState(center);
  const [venuesLoading, setVenuesLoading] = useState(false);

  // Google Maps API key
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

  // Load Google Maps JS API
  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: apiKey,
  });

  // Map reference
  const mapRef = useRef<google.maps.Map | null>(null);

  // Handle map load
  const onLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  // Handle map unmount
  const onUnmount = useCallback(() => {
    mapRef.current = null;
  }, []);

  // Get user's location on component mount
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });
          setMapCenter({ lat: latitude, lng: longitude });
        },
        (error) => {
          console.error("Error getting location:", error);
        }
      );
    }
  }, []);

  // Fetch venues when user location changes
  useEffect(() => {
    if (!userLocation) return;

    const fetchVenues = async () => {
      try {
        setVenuesLoading(true);

        const response = await fetch(
          `/api/yelp?lat=${userLocation.lat}&lng=${userLocation.lng}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch venues");
        }

        const data = await response.json();
        setVenues(data);
      } catch (error) {
        console.error("Error fetching venues:", error);
      } finally {
        setVenuesLoading(false);
      }
    };

    fetchVenues();
  }, [userLocation]);

  // Fetch venue summary when a venue is selected
  const fetchVenueSummary = async (venue: Venue) => {
    // If we already have the summary, don't fetch again
    if (venuesSummaries[venue.id]) {
      return;
    }

    try {
      setSummaryLoading(true);

      const response = await fetch(`/api/summary?id=${venue.id}`);

      if (!response.ok) {
        throw new Error("Failed to fetch venue summary");
      }

      const data: VenueSummary = await response.json();

      setVenuesSummaries((prev) => ({
        ...prev,
        [venue.id]: data.summary,
      }));
    } catch (error) {
      console.error("Error fetching venue summary:", error);
    } finally {
      setSummaryLoading(false);
    }
  };

  // Format rating as stars
  const formatRating = (rating: number): string => {
    const fullStar = "★";
    const emptyStar = "☆";
    const stars = Math.round(rating * 2) / 2; // Round to nearest 0.5

    const fullStars = Math.floor(stars);
    const halfStar = stars % 1 !== 0;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

    return (
      fullStar.repeat(fullStars) +
      (halfStar ? "½" : "") +
      emptyStar.repeat(emptyStars)
    );
  };

  // Show error UI
  if (loadError || !apiKey) {
    return (
      <div className="flex items-center justify-center h-full w-full bg-[#f8f9fa] font-serif">
        <div className="p-8 max-w-md text-center bg-white rounded-xl border border-gray-100 shadow-md">
          <div className="mb-6 text-[#4dd783]">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="mx-auto w-16 h-16"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-[#495057] mb-3">
            Munchies Radar Coming Soon
          </h2>
          <p className="text-[#495057] mb-5">
            We're setting up our map to help you find the best munchies around
            NYC. Check back shortly!
          </p>
          <div className="inline-block text-sm text-[#6c757d] bg-[#f8f9fa] px-4 py-2 rounded-full border border-gray-100">
            {apiKey
              ? "Map service temporarily unavailable"
              : "API configuration in progress"}
          </div>
        </div>
      </div>
    );
  }

  // Show loading state
  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-full w-full bg-[#f8f9fa] font-serif">
        <div className="p-6 text-center">
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
            <h3 className="text-lg font-bold text-[#495057]">Loading Map</h3>
            <p className="text-[#6c757d] mt-2">Finding munchies near you...</p>
          </div>
        </div>
      </div>
    );
  }

  // Render map with venues
  return (
    <div className="flex flex-col h-full font-serif">
      <div className="px-4 py-6 bg-white border-b border-gray-200 shadow-sm">
        <h1 className="text-2xl font-bold text-[#4dd783] text-center">Eats</h1>
      </div>
      <div className="relative flex-1">
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={mapCenter}
          zoom={13}
          options={defaultOptions}
          onLoad={onLoad}
          onUnmount={onUnmount}
        >
          {/* User location marker */}
          {userLocation && (
            <Marker
              position={userLocation}
              icon={{
                path: google.maps.SymbolPath.CIRCLE,
                scale: 10,
                fillColor: "#4dd783",
                fillOpacity: 1,
                strokeColor: "white",
                strokeWeight: 2,
              }}
            />
          )}

          {/* Venue markers */}
          {venues.map((venue) => (
            <Marker
              key={venue.id}
              position={{
                lat: venue.coordinates.latitude,
                lng: venue.coordinates.longitude,
              }}
              onClick={() => {
                setSelectedVenue(venue);
                fetchVenueSummary(venue);
              }}
              icon={{
                url: venue.isClosed
                  ? "/images/marker-closed.svg"
                  : "/images/marker.svg",
                scaledSize: new google.maps.Size(30, 30),
              }}
            />
          ))}

          {/* Info window for selected venue */}
          {selectedVenue && (
            <InfoWindow
              position={{
                lat: selectedVenue.coordinates.latitude,
                lng: selectedVenue.coordinates.longitude,
              }}
              onCloseClick={() => setSelectedVenue(null)}
            >
              <div className="max-w-xs font-serif text-[#495057]">
                <h3 className="mb-1 text-lg font-bold">{selectedVenue.name}</h3>
                <div className="text-sm text-[#6c757d] mb-2">
                  {selectedVenue.categories.join(", ")} ·{" "}
                  {selectedVenue.price || "N/A"}
                </div>
                <div className="flex items-center mb-3 text-sm">
                  <span className="text-[#4dd783] mr-1">
                    {formatRating(selectedVenue.rating)}
                  </span>
                  <span className="text-[#495057]">
                    ({selectedVenue.reviewCount} reviews)
                  </span>
                </div>

                {venuesSummaries[selectedVenue.id] ? (
                  <p className="text-sm text-[#495057] mb-3 p-2 bg-[#f8f9fa] rounded-md italic">
                    "{venuesSummaries[selectedVenue.id]}"
                  </p>
                ) : summaryLoading ? (
                  <div className="flex justify-center items-center py-2">
                    <div className="w-5 h-5 border-t-2 border-[#4dd783] rounded-full animate-spin"></div>
                    <span className="ml-2 text-sm text-[#6c757d]">
                      Generating stoner take...
                    </span>
                  </div>
                ) : null}

                <div className="text-sm text-[#495057] mb-3">
                  {selectedVenue.address}
                </div>

                <a
                  href={selectedVenue.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-[#4dd783] font-medium hover:underline"
                >
                  View on Yelp →
                </a>
              </div>
            </InfoWindow>
          )}
        </GoogleMap>

        {/* Loading overlay for venues */}
        {venuesLoading && (
          <div className="absolute top-0 left-0 right-0 bg-[#212529] bg-opacity-70 text-white py-2 text-center text-sm">
            <div className="inline-block mr-2 w-4 h-4 rounded-full border-t-2 border-white animate-spin"></div>
            Searching for munchies nearby...
          </div>
        )}
      </div>
    </div>
  );
}
