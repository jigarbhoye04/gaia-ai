import type React from "react";

import { Tab, Tabs } from "@heroui/tabs";
import { Download, GlobeIcon, Move, ZoomIn, ZoomOut } from "lucide-react";
import mermaid from "mermaid";
import { Button } from "@heroui/button";
import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

// import { Prism, type SyntaxHighlighterProps } from "react-syntax-highlighter";
// import { PrismLight as SyntaxHighlighter } from "react-syntax-highlighter";
import { Tooltip } from "@heroui/tooltip";
import {
  PrismAsyncLight,
  SyntaxHighlighterProps,
} from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import remarkGfm from "remark-gfm";

import { Task01Icon, TaskDone01Icon } from "../Misc/icons";
import SuspenseLoader from "../Misc/SuspenseLoader";

import api from "@/utils/apiaxios";
import { useLoading } from "@/contexts/LoadingContext";
const ReactMarkdown = lazy(() => import("react-markdown"));
const SyntaxHighlighter =
  PrismAsyncLight as any as React.FC<SyntaxHighlighterProps>;

interface MarkdownRendererProps {
  content: string;
}

mermaid.initialize({});

const CodeBlock = ({ node, inline, className, children, ...props }: any) => {
  const { isLoading } = useLoading();
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState("code");
  const [scale, setScale] = useState(1.5);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [startPosition, setStartPosition] = useState({ x: 0, y: 0 });
  const mermaidRef = useRef<HTMLDivElement>(null);
  const match = /language-(\w+)/.exec(className || "");
  const isMermaid = match && match[1] === "mermaid";

  useEffect(() => {
    mermaid.contentLoaded();
  }, [isLoading, activeTab]);

  useEffect(() => {
    if (!isLoading) setActiveTab("preview");
  }, [isLoading]);

  const handleCopy = () => {
    navigator.clipboard.writeText(String(children).replace(/\n$/, ""));
    setCopied(true);
    setTimeout(() => setCopied(false), 4000);
  };

  const handleZoomIn = () => setScale((prev) => Math.min(prev + 0.1, 4));
  const handleZoomOut = () => setScale((prev) => Math.max(prev - 0.1, 0.5));

  const resetZoom = () => setScale(1.5);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      setIsDragging(true);
      setStartPosition({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      });
    },
    [position]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isDragging) {
        setPosition({
          x: e.clientX - startPosition.x,
          y: e.clientY - startPosition.y,
        });
      }
    },
    [isDragging, startPosition]
  );

  const handleMouseUp = () => setIsDragging(false);

  const handleDownload = () => {
    if (!mermaidRef.current) return;

    const svgData = new XMLSerializer().serializeToString(
      mermaidRef.current.querySelector("svg")!
    );
    const svgBlob = new Blob([svgData], {
      type: "image/svg+xml;charset=utf-8",
    });
    const svgUrl = URL.createObjectURL(svgBlob);
    const downloadLink = document.createElement("a");

    downloadLink.href = svgUrl;
    downloadLink.download = "mermaid-diagram.svg";
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault(); // This will now work because we're using a non-passive event listener
    const delta = e.deltaY * -0.01;

    setScale((prevScale) => Math.min(Math.max(prevScale + delta, 0.5), 3));
  }, []);

  useEffect(() => {
    const element = mermaidRef.current;

    if (element) {
      element.addEventListener("wheel", handleWheel, { passive: false });

      return () => {
        element.removeEventListener("wheel", handleWheel);
      };
    }
  }, [handleWheel]);

  if (isMermaid) {
    return (
      <div className="relative flex flex-col gap-0 bg-zinc-900 !pb-0 !rounded-t-[10px] w-[40vw]">
        <Tabs
          className="px-3"
          disabledKeys={isLoading ? ["editor"] : []}
          selectedKey={activeTab}
          variant="underlined"
          onSelectionChange={(key) => {
            setActiveTab(key as string);
            setTimeout(() => {
              mermaid.contentLoaded();
            }, 10);
          }}
        >
          <Tab key="preview" className="p-0" title="Flowchart">
            <div className="p-4 bg-white relative overflow-hidden h-[400px]">
              <div
                ref={mermaidRef}
                className="mermaid absolute select-none"
                style={{
                  transform: `scale(${scale}) translate(${position.x}px, ${position.y}px)`,
                  transformOrigin: "0 0",
                  cursor: isDragging ? "grabbing" : "grab",
                }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                // onWheel={handleWheel}
              >
                {String(children).replace(/\n$/, "")}
              </div>
              <div className="absolute bottom-2 right-2 flex gap-2">
                <Button size="sm" onClick={handleZoomIn}>
                  <ZoomIn size={16} />
                </Button>
                <Button size="sm" onClick={handleZoomOut}>
                  <ZoomOut size={16} />
                </Button>
                <Button size="sm" onClick={resetZoom}>
                  Reset Zoom
                </Button>
                <Button
                  size="sm"
                  onClick={() => setPosition({ x: -50, y: -50 })}
                >
                  {" "}
                  {/* Update 3: Reset position */}
                  <Move size={16} />
                </Button>
                <Button size="sm" onClick={handleDownload}>
                  <Download size={16} />
                </Button>
              </div>
            </div>
          </Tab>
          <Tab key="code" title="Code">
            <SyntaxHighlighter
              {...(props as any)}
              showLineNumbers
              PreTag="div"
              className="m-0 p-0 !bg-black !text-[10px]"
              language="mermaid"
              style={vscDarkPlus}
            >
              {String(children).replace(/\n$/, "")}
            </SyntaxHighlighter>
          </Tab>
        </Tabs>
        <Button
          className="absolute top-2 right-2 text-foreground hover:text-gray-300 text-xs"
          size="sm"
          variant="light"
          onPress={handleCopy}
        >
          {copied ? (
            <div className="flex flex-row gap-1 items-center">
              <TaskDone01Icon color="foreground" width={21} />
              <p>Copied!</p>
            </div>
          ) : (
            <div className="flex flex-row gap-1 items-center">
              <Task01Icon color="foreground" width={21} />
              <p>Copy Code</p>
            </div>
          )}
        </Button>
      </div>
    );
  }

  return (
    <>
      {!inline && match ? (
        <div className="relative flex flex-col gap-0 ">
          <div className="flex justify-between items-center bg-zinc-900  text-white px-4 py-1 !rounded-t-[10px] !rounded-b-none mb-[-0.5em] !sticky top-0">
            <span className="text-sm font-mono monospace">{match[1]}</span>
            <Button
              className="text-foreground hover:text-gray-300 text-xs"
              size="sm"
              variant="light"
              onPress={handleCopy}
            >
              {copied ? (
                <div className="flex flex-row gap-1 items-center">
                  <TaskDone01Icon color="foreground" width={21} />
                  <p>Copied!</p>
                </div>
              ) : (
                <div className="flex flex-row gap-1 items-center">
                  <Task01Icon color="foreground" width={21} />
                  <p>Copy Code</p>
                </div>
              )}
            </Button>
          </div>
          <SyntaxHighlighter
            showLineNumbers
            PreTag="div"
            className="m-0 !bg-black !text-[10px] max-w-[35vw] overflow-x-visible"
            language={match[1]}
            style={vscDarkPlus}
          >
            {String(children).replace(/\n$/, "")}
          </SyntaxHighlighter>
        </div>
      ) : (
        <code
          className={`${className} bg-black bg-opacity-40 rounded-sm`}
          {...props}
        >
          {children}
        </code>
      )}
    </>
  );
};

export function CustomAnchor({ props }: { props: any }) {
  const { isLoading } = useLoading();
  const [metadata, setMetadata] = useState({
    title: "",
    description: "",
    favicon: "",
    website_name: "",
  });

  const prevHref = useRef(null);
  const [validFavicon, setValidFavicon] = useState(true);
  const [tooltipOpen, setTooltipOpen] = useState(false);

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const response = await api.post("/fetch-url-metadata", {
          url: props.href,
        });
        const { title, description, favicon, website_name } = response.data;

        setMetadata({ title, description, favicon, website_name });
        setValidFavicon(true);
        prevHref.current = props.href;
      } catch (error) {
        console.error("Error fetching metadata:", error);
      }
    };

    if (!isLoading && prevHref.current != props.href) fetchMetadata();
  }, [tooltipOpen]);

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
                  alt={"Fav Icon"}
                  className="size-[20px] rounded-full"
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
            <div className="w-[300px] font-medium  text-white text-md truncate">
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
            href={props.href}
            rel="noopener noreferrer"
            target="_blank"
          >
            {props.href.replace("https://", "")}
          </a>
        </div>
      }
      isOpen={tooltipOpen}
      onOpenChange={setTooltipOpen}
    >
      <a
        className="!text-[#00bbff] hover:underline font-medium hover:!text-white transition-all"
        href={props.href}
        rel="noopener noreferrer"
        target="_blank"
      >
        {props.children}
      </a>
    </Tooltip>
  );
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
}) => {
  return (
    <div className="prose dark:prose-invert max-w-none">
      <Suspense fallback={<SuspenseLoader />}>
        <ReactMarkdown
          components={{
            code: CodeBlock,
            h1: ({ node, ...props }) => (
              <h1 className="text-3xl font-bold mt-6 mb-4" {...props} />
            ),
            h2: ({ node, ...props }) => (
              <h2 className="text-2xl font-bold mt-5 mb-3" {...props} />
            ),
            h3: ({ node, ...props }) => (
              <h3 className="text-xl font-bold mt-4 mb-2" {...props} />
            ),
            ul: ({ node, ...props }) => (
              <ul className="list-disc pl-6 mb-4" {...props} />
            ),
            ol: ({ node, ...props }) => (
              <ol className="list-decimal pl-6 mb-4" {...props} />
            ),
            // li: ({ node, ...props }) => <li className="mb-1" {...props} />,
            a: ({ node, ...props }) => <CustomAnchor props={props} />,
            blockquote: ({ node, ...props }) => (
              <blockquote
                className="border-l-4 border-gray-300 pl-4 italic my-4"
                {...props}
              />
            ),
            img: ({ node, ...props }) => (
              <img
                alt={"image"}
                className="max-w-full h-auto my-4"
                {...props}
              />
            ),
            table: ({ node, ...props }) => (
              <div className="overflow-x-auto">
                <table
                  className="min-w-full border-collapse border border-gray-300 rounded-md"
                  {...props}
                />
              </div>
            ),
            thead: ({ node, ...props }) => (
              <thead className="bg-gray-200 bg-opacity-20" {...props} />
            ),
            tbody: ({ node, ...props }) => <tbody {...props} />,
            tr: ({ node, ...props }) => (
              <tr className="border-b border-gray-300" {...props} />
            ),
            th: ({ node, ...props }) => (
              <th className="px-4 py-2 text-left font-bold" {...props} />
            ),
            td: ({ node, ...props }) => <td className="px-4 py-2" {...props} />,
          }}
          remarkPlugins={[remarkGfm]}
        >
          {content}
        </ReactMarkdown>
      </Suspense>
    </div>
  );
};

export default MarkdownRenderer;
