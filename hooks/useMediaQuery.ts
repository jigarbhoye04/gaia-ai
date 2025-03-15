"use client";

import { useState, useEffect } from "react";

const useMediaQuery = (query: string): boolean => {
  // Prevent SSR mismatches by defaulting to `false` on the server
  const isClient = typeof window !== "undefined";
  const [matches, setMatches] = useState<boolean>(
    isClient ? window.matchMedia(query).matches : false
  );

  useEffect(() => {
    if (!isClient) return; // Ensure this only runs on the client

    const mediaQueryList = window.matchMedia(query);
    const updateMatches = () => setMatches(mediaQueryList.matches);

    updateMatches(); // Immediately apply the correct value
    mediaQueryList.addEventListener("change", updateMatches);

    return () => mediaQueryList.removeEventListener("change", updateMatches);
  }, [query, isClient]);

  return matches;
};

export default useMediaQuery;
