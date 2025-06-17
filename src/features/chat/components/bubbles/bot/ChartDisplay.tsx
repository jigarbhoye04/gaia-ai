import { Download, Maximize2, X } from "lucide-react";
import React, { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/shadcn/chart";

interface ChartData {
  id: string;
  url: string;
  text: string;
  type?: string;
  title?: string;
  description?: string;
  chart_data?: {
    type: string;
    title: string;
    x_label: string;
    y_label: string;
    x_unit?: string | null;
    y_unit?: string | null;
    elements: Array<{
      label: string;
      value: number;
      group: string;
    }>;
  };
}

interface ChartDisplayProps {
  charts: ChartData[];
}

const InteractiveChart: React.FC<{ chart: ChartData }> = ({ chart }) => {
  if (!chart.chart_data) return null;

  const { chart_data } = chart;
  const chartConfig = {
    value: {
      label: chart_data.y_label || "Value",
      color: "hsl(var(--chart-1))",
    },
  };

  // Transform data for recharts
  const data = chart_data.elements.map((element) => ({
    name: element.label,
    value: element.value,
    group: element.group,
  }));

  const renderChart = () => {
    switch (chart_data.type) {
      case "bar":
        return (
          <ChartContainer config={chartConfig} className="h-64 w-full">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="value" fill="var(--color-value)" />
            </BarChart>
          </ChartContainer>
        );
      case "line":
        return (
          <ChartContainer config={chartConfig} className="h-64 w-full">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line
                type="monotone"
                dataKey="value"
                stroke="var(--color-value)"
              />
            </LineChart>
          </ChartContainer>
        );
      case "pie":
        return (
          <ChartContainer config={chartConfig} className="h-64 w-full">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="var(--color-value)"
              />
              <ChartTooltip content={<ChartTooltipContent />} />
            </PieChart>
          </ChartContainer>
        );
      default:
        return (
          <div className="flex h-64 w-full items-center justify-center rounded bg-gray-100">
            <p className="text-gray-500">
              Unsupported chart type: {chart_data.type}
            </p>
          </div>
        );
    }
  };

  return (
    <div className="w-full">
      <div className="mb-2 text-sm font-medium text-gray-700">
        {chart_data.title}
      </div>
      {renderChart()}
    </div>
  );
};

const ChartDisplay: React.FC<ChartDisplayProps> = ({ charts }) => {
  const [selectedChart, setSelectedChart] = useState<ChartData | null>(null);
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>(
    {},
  );

  if (!charts || charts.length === 0) {
    return null;
  }

  const handleImageLoad = (chartId: string) => {
    setLoadingStates((prev) => ({ ...prev, [chartId]: false }));
  };

  const handleImageError = (chartId: string) => {
    setLoadingStates((prev) => ({ ...prev, [chartId]: false }));
  };

  const handleDownload = async (chart: ChartData) => {
    try {
      const response = await fetch(chart.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${chart.title || chart.text || "chart"}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Failed to download chart:", error);
    }
  };

  return (
    <>
      <div className="mt-4 space-y-4">
        <div className="text-sm font-medium text-gray-300">
          Generated {charts.length} Chart{charts.length > 1 ? "s" : ""}
        </div>

        {/* Grid layout for multiple charts */}
        <div className={`flex flex-col gap-3`}>
          {charts.map((chart) => (
            <div
              key={chart.id}
              className="group relative rounded-lg bg-white p-2 shadow-sm transition-shadow hover:shadow-md"
            >
              {/* Chart Title */}
              {chart.title && (
                <div className="mb-2 truncate text-sm font-medium text-gray-700">
                  {chart.title}
                </div>
              )}

              {/* Render based on chart type */}
              {chart.type === "interactive" && chart.chart_data ? (
                /* Interactive Chart */
                <div className="relative">
                  <InteractiveChart chart={chart} />
                  {/* Actions for interactive charts */}
                  <div className="absolute top-2 right-2 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedChart(chart);
                      }}
                      className="rounded-full bg-black/50 p-1.5 text-white transition-colors hover:bg-black/70"
                      title="View fullscreen"
                    >
                      <Maximize2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ) : (
                /* Static Chart Image */
                <div className="relative overflow-hidden rounded">
                  {loadingStates[chart.id] !== false && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                      <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-500" />
                    </div>
                  )}

                  <img
                    src={chart.url}
                    alt={chart.text}
                    className="h-auto w-full cursor-pointer rounded"
                    onLoad={() => handleImageLoad(chart.id)}
                    onError={() => handleImageError(chart.id)}
                    onClick={() => setSelectedChart(chart)}
                  />

                  {/* Hover Actions */}
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedChart(chart);
                      }}
                      className="rounded-full bg-black/50 p-1.5 text-white transition-colors hover:bg-black/70"
                      title="View fullscreen"
                    >
                      <Maximize2 className="h-3 w-3" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(chart);
                      }}
                      className="rounded-full bg-black/50 p-1.5 text-white transition-colors hover:bg-black/70"
                      title="Download chart"
                    >
                      <Download className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              )}

              {/* Chart Description */}
              {chart.description && (
                <div className="mt-2 line-clamp-2 text-xs text-gray-600">
                  {chart.description}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Fullscreen Modal */}
      {selectedChart && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="relative max-h-[90vh] max-w-[90vw] overflow-auto rounded-lg bg-white">
            {/* Modal Header */}
            <div className="sticky top-0 flex items-center justify-between border-b bg-white px-4 py-3">
              <div>
                <h3 className="font-medium text-gray-900">
                  {selectedChart.title || selectedChart.text}
                </h3>
                {selectedChart.description && (
                  <p className="mt-1 text-sm text-gray-600">
                    {selectedChart.description}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                {selectedChart.type !== "interactive" && (
                  <button
                    onClick={() => handleDownload(selectedChart)}
                    className="rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
                    title="Download chart"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                )}
                <button
                  onClick={() => setSelectedChart(null)}
                  className="rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
                  title="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-4">
              {selectedChart.type === "interactive" &&
              selectedChart.chart_data ? (
                <div className="h-96 w-full">
                  <InteractiveChart chart={selectedChart} />
                </div>
              ) : (
                <img
                  src={selectedChart.url}
                  alt={selectedChart.text}
                  className="h-auto w-full rounded"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChartDisplay;
