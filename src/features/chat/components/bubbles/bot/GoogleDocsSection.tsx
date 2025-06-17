import { Button } from "@heroui/button";
import { FileText } from "lucide-react";
import React from "react";

import { GoogleDocsData } from "@/types/features/toolDataTypes";

interface GoogleDocsSectionProps {
  google_docs_data: GoogleDocsData;
}

const GoogleDocsSection: React.FC<GoogleDocsSectionProps> = ({
  google_docs_data,
}) => {
  const { title, url, action } = google_docs_data;

  return (
    <div className="mt-3">
      <Button
        color="primary"
        variant="flat"
        size="sm"
        startContent={<FileText size={16} />}
        onClick={() => window.open(url, "_blank")}
        className="w-fit"
      >
        <div className="flex flex-col items-start">
          <span className="text-sm font-medium">{title}</span>
          {action && (
            <span className="text-xs capitalize opacity-70">
              {action === "create"
                ? "Created"
                : action === "update"
                  ? "Updated"
                  : action === "share"
                    ? "Shared"
                    : action}
            </span>
          )}
        </div>
      </Button>
    </div>
  );
};

export default GoogleDocsSection;
