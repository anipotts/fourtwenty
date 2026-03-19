"use client";

import { useEffect, useState } from "react";

interface LocationData {
  city: string | null;
  region: string | null;
  country: string | null;
  isNYC: boolean;
  isAdmin: boolean;
}

export function useLocation() {
  const [location, setLocation] = useState<LocationData | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const admin = params.get("admin");
    const url = admin ? `/api/location?admin=${admin}` : "/api/location";

    fetch(url)
      .then((res) => res.json())
      .then(setLocation)
      .catch(() => setLocation({ city: null, region: null, country: null, isNYC: false, isAdmin: false }));
  }, []);

  return location;
}
