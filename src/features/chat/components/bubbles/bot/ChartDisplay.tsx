import React from "react";

interface ChartData {
  id: string;
  url: string;
  text: string;
}

interface ChartDisplayProps {
  charts: ChartData[];
}

const ChartDisplay: React.FC<ChartDisplayProps> = ({ charts }) => {
  if (!charts || charts.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 space-y-4">
      <div className="text-sm font-medium text-gray-300">
        Generated {charts.length} Chart{charts.length > 1 ? "s" : ""}
      </div>

      <div className="space-y-3">
        {charts.map((chart) => (
          <div key={chart.id} className="rounded-lg bg-white p-2">
            <img
              src={chart.url}
              alt={chart.text}
              className="h-auto w-full rounded"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChartDisplay;
