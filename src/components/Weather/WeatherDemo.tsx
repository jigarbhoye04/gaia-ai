import React from "react";

import { WeatherData } from "@/types/convoTypes";

import { WeatherCard } from "./WeatherCard";

// Sample weather data for demonstration
const sampleWeatherData: WeatherData = {
  coord: {
    lon: -74.006,
    lat: 40.7143,
  },
  weather: [
    {
      id: 800,
      main: "Clear",
      description: "clear sky",
      icon: "01d",
    },
  ],
  main: {
    temp: 288.15, // 15°C
    feels_like: 287.15, // 14°C
    temp_min: 285.15,
    temp_max: 290.15,
    pressure: 1013,
    humidity: 65,
  },
  visibility: 10000,
  wind: {
    speed: 3.6,
    deg: 250,
  },
  dt: 1679825600,
  sys: {
    country: "US",
    sunrise: 1679742000,
    sunset: 1679786400,
  },
  timezone: -14400,
  name: "New York",
  location: {
    city: "New York",
    country: "United States",
    region: "New York",
  },
};

export const WeatherDemo: React.FC = () => {
  return (
    <div className="p-4">
      <h1 className="mb-4 text-2xl font-bold">Weather Component Demo</h1>
      <div className="mb-6">
        <h2 className="mb-2 text-xl">Weather Card Component</h2>
        <WeatherCard weatherData={sampleWeatherData} />
      </div>
    </div>
  );
};
