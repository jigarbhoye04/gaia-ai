import { useLoading } from "@/hooks/useLoading";
import api from "@/utils/apiaxios";
import { Tooltip } from "@heroui/tooltip";
import { GlobeIcon } from "lucide-react";
import { ReactNode, useEffect, useRef, useState } from "react";

const CustomAnchor = ({
  href,
  children,
}: {
  href: string | undefined;
  children: ReactNode | string | null;
}) => {
  if (!href) return null;

  const { isLoading } = useLoading();
  const [metadata, setMetadata] = useState({
    title: "",
    description: "",
    favicon: "",
    website_name: "",
  });
  const prevHref = useRef<string | null>(null);
  const [validFavicon, setValidFavicon] = useState(true);
  const [tooltipOpen, setTooltipOpen] = useState(false);

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const response = await api.post("/fetch-url-metadata", {
          url: href,
        });
        const { title, description, favicon, website_name } = response.data;
        setMetadata({ title, description, favicon, website_name });
        setValidFavicon(true);
        prevHref.current = href ?? "";
      } catch (error) {
        console.error("Error fetching metadata:", error);
      }
    };

    if (!isLoading && prevHref.current !== href) {
      fetchMetadata();
    }
  }, [tooltipOpen, isLoading, href]);

  return (
    <Tooltip
      showArrow
      className="bg-zinc-950 text-white border-none outline-none p-3"
      content={
        <div className="flex flex-col gap-1">
          {(metadata.website_name || (metadata.favicon && validFavicon)) && (
            <div className="flex items-center gap-2">
              {metadata.favicon && validFavicon ? (
                <img
                  alt="Fav Icon"
                  className="w-[20px] h-[20px] rounded-full"
                  src={metadata.favicon}
                  onError={() => setValidFavicon(false)}
                />
              ) : (
                <GlobeIcon color="#9b9b9b" height={17} width={17} />
              )}
              {metadata.website_name && (
                <div className="truncate w-[300px] text-md">
                  {metadata.website_name}
                </div>
              )}
            </div>
          )}
          {metadata.title && (
            <div className="w-[300px] font-medium text-white text-md truncate">
              {metadata.title}
            </div>
          )}
          {metadata.description && (
            <div className="w-[300px] max-h-[100px] text-foreground-600 text-sm mb-2 overflow-hidden">
              {metadata.description}
            </div>
          )}
          <a
            className="w-[300px] text-primary text-xs truncate hover:underline"
            href={href}
            rel="noopener noreferrer"
            target="_blank"
          >
            {href.replace("https://", "")}
          </a>
        </div>
      }
      isOpen={tooltipOpen}
      onOpenChange={setTooltipOpen}
    >
      <a
        className="!text-[#00bbff] hover:underline font-medium hover:!text-white transition-all cursor-pointer"
        rel="noopener noreferrer"
        target="_blank"
        // {...props}
      >
        {children}
      </a>
    </Tooltip>
  );
};

export default CustomAnchor;
