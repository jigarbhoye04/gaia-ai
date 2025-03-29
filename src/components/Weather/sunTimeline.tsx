import { MoonIcon,SunIcon, SunriseIcon, SunsetIcon } from "lucide-react";
import React, { useEffect, useState } from "react";

interface SunTimelineProps {
  sunriseTimestamp: number;
  sunsetTimestamp: number;
  timezone: number;
  weatherTheme: {
    highlight: string;
    secondary: string;
  };
}

export const SunTimeline: React.FC<SunTimelineProps> = ({
  sunriseTimestamp,
  sunsetTimestamp,
  timezone,
  weatherTheme,
}) => {
  const [currentTime, setCurrentTime] = useState<number>(
    Math.floor(Date.now() / 1000),
  );

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Math.floor(Date.now() / 1000));
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  // Format time for display
  const formatTimeDisplay = (timestamp: number): string => {
    const date = new Date((timestamp + timezone) * 1000);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // Calculate progress percentage
  const calculateProgress = (): { percent: number; isDaytime: boolean } => {
    // Day length in seconds
    const dayLength = sunsetTimestamp - sunriseTimestamp;

    // Check if it's before sunrise
    if (currentTime < sunriseTimestamp) {
      return { percent: 0, isDaytime: false };
    }

    // Check if it's after sunset
    if (currentTime > sunsetTimestamp) {
      return { percent: 100, isDaytime: false };
    }

    // Calculate progress percentage during daytime
    const elapsedSinceSunrise = currentTime - sunriseTimestamp;
    const progress = (elapsedSinceSunrise / dayLength) * 100;
    return { percent: Math.min(100, Math.max(0, progress)), isDaytime: true };
  };

  const { percent, isDaytime } = calculateProgress();

  return (
    <div className="rounded-2xl bg-black/35 p-4 backdrop-blur-sm">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex flex-col items-start">
          <SunsetIcon className={`h-7 w-7 ${weatherTheme.highlight}`} />
          <span className="text-white">Sunset</span>
        </div>
        <div className="flex flex-col items-end">
          <SunriseIcon className={`h-7 w-7 ${weatherTheme.highlight}`} />
          <span className="text-white">Sunrise</span>
        </div>
      </div>

      {/* Timeline track */}
      <div className="relative h-2 w-full rounded-full bg-white/30">
        {/* Progress bar */}
        <div
          className={`absolute h-full rounded-full ${
            isDaytime ? "bg-amber-400" : "bg-blue-400/70"
          }`}
          style={{ width: `${percent}%` }}
        />

        {/* Current position indicator */}
        <div
          className="absolute top-1/2 z-10"
          style={{
            left: `${percent}%`,
            transform: "translate(-50%, -50%)",
          }}
        >
          {isDaytime ? (
            <SunIcon
              className="drop-shadow-glow h-7 w-7"
              color="#ffbe0d"
              fill="#ffbe0d"
            />
          ) : currentTime < sunriseTimestamp ? (
            <MoonIcon
              className="drop-shadow-glow h-7 w-7"
              color="#b0d3ff"
              fill="#b0d3ff"
            />
          ) : (
            <MoonIcon
              className="drop-shadow-glow h-7 w-7"
              color="#b0d3ff"
              fill="#b0d3ff"
            />
          )}
        </div>
      </div>

      {/* Time displays below the timeline */}
      <div className="mt-3 flex justify-between">
        <div className="flex flex-col items-center">
          <span className="font-medium text-white">
            {formatTimeDisplay(sunsetTimestamp)}
          </span>
        </div>
        <div className="flex flex-col items-center">
          <span className="font-medium text-white">
            {formatTimeDisplay(sunriseTimestamp)}
          </span>
        </div>
      </div>
    </div>
  );
};
