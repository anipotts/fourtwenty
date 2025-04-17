"use client";

import React from "react";
import { GoogleMap, useJsApiLoader } from "@react-google-maps/api";

const containerStyle = {
  width: "100%",
  height: "100%",
};

const center = {
  lat: 40.7128, // New York City coordinates
  lng: -74.006,
};

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
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: apiKey || "",
  });

  // Show a nice error UI instead of technical error message
  if (loadError || !apiKey) {
    return (
      <div className="flex items-center justify-center h-full w-full bg-[#f8f9fa]">
        <div className="text-center p-8 max-w-md bg-white rounded-xl border border-[#e9ecef] shadow-md">
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
          <h2 className="text-xl font-bold text-[#212529] mb-3">
            Munchies Radar Coming Soon
          </h2>
          <p className="text-[#495057] mb-5 font-sans">
            We're setting up our map to help you find the best munchies around
            NYC. Check back shortly!
          </p>
          <div className="inline-block text-sm text-[#6c757d] bg-[#f8f9fa] px-4 py-2 rounded-full border border-[#e9ecef]">
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
      <div className="flex items-center justify-center h-full w-full bg-[#f8f9fa]">
        <div className="text-center p-6">
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
            <h3 className="text-lg font-bold text-[#212529]">Loading Map</h3>
            <p className="text-[#6c757d] mt-2 font-sans">
              Finding munchies near you...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Map loaded successfully
  return (
    <div className="h-full flex flex-col">
      <div className="py-3 px-4 border-b border-[#e9ecef] bg-white shadow-sm">
        <h1 className="text-xl font-bold text-[#212529]">Munchies Radar</h1>
      </div>
      <div className="flex-1">
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={center}
          zoom={12}
          options={defaultOptions}
        >
          {/* Markers will be added here in a future implementation */}
        </GoogleMap>
      </div>
    </div>
  );
}
