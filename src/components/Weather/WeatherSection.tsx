import React from "react";
import { WeatherData } from "@/types/convoTypes";
import { WeatherCard } from "./WeatherCard";
import { AnimatedSection } from "@/layouts/AnimatedSection";

interface WeatherSectionProps {
  weather_data: WeatherData;
}

export default function WeatherSection({ weather_data }: WeatherSectionProps) {
  console.log(weather_data);
  if (!weather_data) {
    return (
      <div className="p-3 text-red-500">
        Error: Could not fetch weather data. Please try again later.
      </div>
    );
  }

  return (
    <AnimatedSection
      disableAnimation={false}
      className="mt-3 flex w-fit flex-col gap-1 rounded-2xl rounded-bl-none p-1"
    >
      <WeatherCard weatherData={weather_data} />
    </AnimatedSection>
  );
}
