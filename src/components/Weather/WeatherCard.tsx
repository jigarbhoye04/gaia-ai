import React from "react";
import { WeatherData } from "@/types/convoTypes";
import {
  CloudRainIcon,
  CloudIcon,
  SunIcon,
  CloudLightningIcon,
  ClockIcon,
  WindIcon,
  DropletIcon,
  EyeIcon,
  CloudSnowIcon,
  CloudFogIcon,
  CloudDrizzleIcon,
  SunriseIcon,
  SunsetIcon,
} from "lucide-react";

interface WeatherCardProps {
  weatherData: WeatherData;
}

// Helper function to convert Kelvin to Celsius
const kelvinToCelsius = (kelvin: number) => {
  return Math.round(kelvin - 273.15);
};

// Helper function to convert timestamp to readable time, taking into account timezone
const formatTime = (timestamp: number, timezone: number): string => {
  const date = new Date((timestamp + timezone) * 1000);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

// Helper function to get weather icon
const getWeatherIcon = (weatherId: number) => {
  // Weather condition codes: https://openweathermap.org/weather-conditions
  if (weatherId >= 200 && weatherId < 300) {
    return <CloudLightningIcon className="h-10 w-10 text-yellow-400" />;
  } else if (weatherId >= 300 && weatherId < 400) {
    return <CloudDrizzleIcon className="h-10 w-10 text-blue-300" />;
  } else if (weatherId >= 500 && weatherId < 600) {
    return <CloudRainIcon className="h-10 w-10 text-blue-400" />;
  } else if (weatherId >= 600 && weatherId < 700) {
    return <CloudSnowIcon className="h-10 w-10 text-blue-100" />;
  } else if (weatherId >= 700 && weatherId < 800) {
    return <CloudFogIcon className="h-10 w-10 text-gray-400" />;
  } else if (weatherId === 800) {
    return <SunIcon className="h-10 w-10 text-yellow-400" />;
  } else if (weatherId > 800) {
    return <CloudIcon className="h-10 w-10 text-gray-300" />;
  }
  return <CloudIcon className="h-10 w-10 text-gray-300" />; // Default
};

export const WeatherCard: React.FC<WeatherCardProps> = ({ weatherData }) => {
  const temp = kelvinToCelsius(weatherData.main.temp);
  const feelsLike = kelvinToCelsius(weatherData.main.feels_like);
  const weatherIcon = getWeatherIcon(weatherData.weather[0].id);
  const sunriseTime = formatTime(weatherData.sys.sunrise, weatherData.timezone);
  const sunsetTime = formatTime(weatherData.sys.sunset, weatherData.timezone);

  return (
    <div className="w-full max-w-md rounded-xl bg-zinc-800 p-4 shadow-md">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">
            {weatherData.location.city}, {weatherData.location.region}
          </h2>
          <p className="text-sm text-zinc-400">
            {weatherData.location.country}
          </p>
          <div className="mt-4 flex items-center">
            <span className="text-4xl font-bold text-white">{temp}°C</span>
            <span className="ml-2 text-sm text-zinc-400">
              Feels like: {feelsLike}°C
            </span>
          </div>
          <p className="mt-1 text-sm capitalize text-zinc-300">
            {weatherData.weather[0].description}
          </p>
        </div>
        <div className="flex flex-col items-center">
          {weatherIcon}
          <span className="mt-2 text-sm text-zinc-400">
            {weatherData.weather[0].main}
          </span>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="flex items-center">
          <WindIcon className="mr-2 h-5 w-5 text-blue-400" />
          <span className="text-sm text-zinc-300">
            Wind: {weatherData.wind.speed} m/s
          </span>
        </div>
        <div className="flex items-center">
          <DropletIcon className="mr-2 h-5 w-5 text-blue-400" />
          <span className="text-sm text-zinc-300">
            Humidity: {weatherData.main.humidity}%
          </span>
        </div>
        <div className="flex items-center">
          <SunriseIcon className="mr-2 h-5 w-5 text-yellow-400" />
          <span className="text-sm text-zinc-300">Sunrise: {sunriseTime}</span>
        </div>
        <div className="flex items-center">
          <SunsetIcon className="mr-2 h-5 w-5 text-orange-400" />
          <span className="text-sm text-zinc-300">Sunset: {sunsetTime}</span>
        </div>
        {weatherData.visibility && (
          <div className="flex items-center">
            <EyeIcon className="mr-2 h-5 w-5 text-blue-400" />
            <span className="text-sm text-zinc-300">
              Visibility: {(weatherData.visibility / 1000).toFixed(1)} km
            </span>
          </div>
        )}
        <div className="flex items-center">
          <ClockIcon className="mr-2 h-5 w-5 text-blue-400" />
          <span className="text-sm text-zinc-300">
            Pressure: {weatherData.main.pressure} hPa
          </span>
        </div>
      </div>
    </div>
  );
};
