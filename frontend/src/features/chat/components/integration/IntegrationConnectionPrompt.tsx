import { Button } from "@heroui/button";
import { Card, CardBody } from "@heroui/card";
import { ExternalLink, Settings, Zap } from "lucide-react";
import Image from "next/image";
import React from "react";

import { useIntegrations } from "@/features/integrations/hooks/useIntegrations";
import { IntegrationConnectionData } from "@/types/features/integrationTypes";

interface IntegrationConnectionPromptProps {
  data: IntegrationConnectionData;
}

export const IntegrationConnectionPrompt: React.FC<
  IntegrationConnectionPromptProps
> = ({ data }) => {
  const { connectIntegration } = useIntegrations();

  const handleConnect = async () => {
    try {
      await connectIntegration(data.integration_id);
    } catch (error) {
      console.error("Failed to connect integration:", error);
    }
  };

  const handleOpenSettings = () => {
    window.open(data.settings_url, "_blank");
  };

  return (
    <Card className="w-full max-w-md border-yellow-500/20 bg-yellow-500/5">
      <CardBody className="p-4">
        <div className="flex items-start gap-3">
          {/* Integration Icon */}
          <div className="flex-shrink-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-500/20">
              <Image
                src={data.integration_icon}
                alt={data.integration_name}
                width={24}
                height={24}
                className="h-6 w-6 object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            </div>
          </div>

          {/* Content */}
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-500" />
              <span className="text-sm font-medium text-yellow-200">
                Integration Required
              </span>
            </div>

            <h3 className="mb-1 text-sm font-semibold text-white">
              Connect {data.integration_name}
            </h3>

            <p className="mb-3 text-xs text-zinc-400">{data.message}</p>

            {/* Features */}
            {data.integration_features.length > 0 && (
              <div className="mb-3">
                <p className="mb-1 text-xs font-medium text-zinc-300">
                  Features:
                </p>
                <div className="flex flex-wrap gap-1">
                  {data.integration_features.map((feature, index) => (
                    <span
                      key={index}
                      className="inline-block rounded-full bg-yellow-500/10 px-2 py-0.5 text-xs text-yellow-300"
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                size="sm"
                color="warning"
                variant="solid"
                startContent={<ExternalLink className="h-3 w-3" />}
                onClick={handleConnect}
                className="flex-1 text-black"
              >
                Connect Now
              </Button>
              <Button
                size="sm"
                variant="flat"
                isIconOnly
                onClick={handleOpenSettings}
                className="border-zinc-600 text-zinc-400 hover:text-white"
              >
                <Settings className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
};
