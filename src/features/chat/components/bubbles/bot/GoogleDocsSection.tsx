import { Button } from "@heroui/button";
import Image from "next/image";
import React from "react";

import { GoogleDocsData } from "@/types/features/toolDataTypes";

interface GoogleDocsSectionProps {
  google_docs_data: GoogleDocsData;
}

const GoogleDocsSection: React.FC<GoogleDocsSectionProps> = ({
  google_docs_data,
}) => {
  const { documents, message, action } = google_docs_data;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (documents)
    return (
      <div className="mt-3 h-fit">
        <div className="mb-2">
          <span className="text-sm text-gray-600">{message}</span>
        </div>
        <div className="space-y-2 space-x-2">
          {documents.map((doc) => (
            <Button
              key={doc.id}
              as={"a"}
              href={doc.url}
              target="_blank"
              variant="flat"
              startContent={
                <Image
                  src={"/icons/google_docs.webp"}
                  alt="Google docs logo"
                  width={25}
                  height={25}
                />
              }
              className="max-w-60 min-w-60 justify-start py-7"
            >
              <div className="flex flex-1 flex-col items-start">
                <span className="text-left text-sm font-medium">
                  {doc.title}
                </span>
                <div className="flex gap-2 text-xs opacity-70">
                  <span>Modified: {formatDate(doc.modified_time)}</span>
                  {action && (
                    <span className="capitalize">
                      {action === "create"
                        ? "Created"
                        : action === "update"
                          ? "Updated"
                          : action === "share"
                            ? "Shared"
                            : action === "list"
                              ? "Listed"
                              : action}
                    </span>
                  )}
                </div>
              </div>
            </Button>
          ))}
        </div>
      </div>
    );
};

export default GoogleDocsSection;
