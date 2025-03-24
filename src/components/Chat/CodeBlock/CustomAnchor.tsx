import { Spinner } from "@heroui/spinner";
import { Tooltip } from "@heroui/tooltip";
import { GlobeIcon } from "lucide-react";
import Image from "next/image";
import { ReactNode, useEffect, useRef, useState } from "react";

import { useLoading } from "@/hooks/useLoading";
import api from "@/utils/apiaxios";

const CustomAnchor = ({
  href,
  children,
}: {
  href: string | undefined;
  children: ReactNode | string | null;
}) => {
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
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!href || prevHref.current === href) return;

    const fetchMetadata = async () => {
      setLoading(true);
      try {
        const response = await api.post("/fetch-url-metadata", {
          url: href,
        });
        const { title, description, favicon, website_name } = response.data;
        setMetadata({ title, description, favicon, website_name });
        setValidFavicon(true);
        prevHref.current = href;
      } catch (error) {
        console.error("Error fetching metadata:", error);
      } finally {
        setLoading(false);
      }
    };

    if (!isLoading) {
      fetchMetadata();
    }
  }, [href, isLoading]);

  if (!href) return null;

  return (
    <Tooltip
      showArrow
      className="border-2 border-solid border-zinc-700 bg-zinc-950 p-3 text-white shadow-lg outline-none"
      content={
        loading ? (
          <div className="p-5">
            <Spinner color="primary" />
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            {(metadata.website_name || (metadata.favicon && validFavicon)) && (
              <div className="flex items-center gap-2">
                {metadata.favicon && validFavicon ? (
                  <Image
                    width={20}
                    height={20}
                    alt="Fav Icon"
                    className="h-[20px] w-[20px] rounded-full"
                    src={metadata.favicon}
                    onError={() => setValidFavicon(false)}
                  />
                ) : (
                  <GlobeIcon color="#9b9b9b" height={17} width={17} />
                )}
                {metadata.website_name && (
                  <div className="text-md w-[300px] truncate">
                    {metadata.website_name}
                  </div>
                )}
              </div>
            )}
            {metadata.title && (
              <div className="text-md w-[300px] truncate font-medium text-white">
                {metadata.title}
              </div>
            )}
            {metadata.description && (
              <div className="mb-2 max-h-[100px] w-[300px] overflow-hidden text-sm text-foreground-600">
                {metadata.description}
              </div>
            )}
            <a
              className="w-[300px] truncate text-xs text-primary hover:underline"
              href={href}
              rel="noopener noreferrer"
              target="_blank"
            >
              {href.replace("https://", "")}
            </a>
          </div>
        )
      }
      isOpen={tooltipOpen}
      onOpenChange={setTooltipOpen}
    >
      <a
        className="cursor-pointer font-medium !text-[#00bbff] transition-all hover:!text-white hover:underline"
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
