import LargeHeader from "../shared/LargeHeader";

interface IntegrationCardProps {
  image?: string;
  alt?: string;
  className?: string;
  isBlurred?: boolean;
  isLarge?: boolean;
}

const IntegrationCard = ({
  image,
  alt = "Integration",
  className = "",
  isBlurred = false,
  isLarge = false,
}: IntegrationCardProps) => (
  <div
    className={`group relative flex aspect-square ${isLarge ? "w-28" : "w-24"} items-center justify-center rounded-2xl border border-zinc-800/50 bg-gradient-to-br from-zinc-900/50 to-zinc-800/30 shadow-2xl shadow-zinc-600/30 backdrop-blur-sm transition-all duration-300 ease-out hover:border-zinc-600/70 hover:from-zinc-800/70 hover:to-zinc-700/50 ${isBlurred ? "translate-y-1 scale-90 opacity-60 blur-[2px]" : ""} ${className} `}
  >
    {image ? (
      <img
        src={image}
        alt={alt}
        className={`${isLarge ? "h-16 w-16" : "h-15 w-15"} object-contain`}
      />
    ) : (
      <div className="h-8 w-8 animate-pulse rounded-lg bg-zinc-600/50" />
    )}
  </div>
);

const integrations = [
  // First row - 4 items (Google Workspace apps)
  [
    {
      image:
        "https://upload.wikimedia.org/wikipedia/commons/thumb/6/66/Google_Docs_2020_Logo.svg/640px-Google_Docs_2020_Logo.svg.png",
      alt: "Google Docs",
      isBlurred: true,
    },
    {
      image:
        "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ae/Google_Sheets_2020_Logo.svg/640px-Google_Sheets_2020_Logo.svg.png",
      alt: "Google Sheets",
    },
    {
      image:
        "https://upload.wikimedia.org/wikipedia/commons/thumb/1/16/Google_Slides_2020_Logo.svg/640px-Google_Slides_2020_Logo.svg.png",
      alt: "Google Slides",
    },
    {
      image:
        "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/figma/figma-original.svg",
      alt: "Figma",
      isBlurred: true,
    },
  ],
  // Second row - 5 items (Main productivity tools with Notion center)
  [
    {
      image:
        "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/trello/trello-plain.svg",
      alt: "Trello",
      isBlurred: true,
    },
    {
      image:
        "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Google_Calendar_icon_%282020%29.svg/640px-Google_Calendar_icon_%282020%29.svg.png",
      alt: "Google Calendar",
    },
    {
      image:
        "https://upload.wikimedia.org/wikipedia/commons/4/45/Notion_app_logo.png",
      alt: "Notion",
      isLarge: true,
    },
    {
      image:
        "https://upload.wikimedia.org/wikipedia/commons/7/7e/Gmail_icon_%282020%29.svg",
      alt: "Gmail",
    },
    {
      image:
        "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/linkedin/linkedin-original.svg",
      alt: "LinkedIn",
      isBlurred: true,
    },
  ],
  // Third row - 4 items (Dev and other tools)
  [
    {
      image:
        "https://cdn.brandfetch.io/idZAyF9rlg/theme/light/symbol.svg?c=1dxbfHSJFAPEGdCLU4o5B",
      alt: "GitHub",
      isBlurred: true,
    },
    {
      image:
        "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/WhatsApp.svg/1024px-WhatsApp.svg.png?20220228223904",
      alt: "WhatsApp",
    },
    {
      image:
        "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/slack/slack-original.svg",
      alt: "Slack",
    },
    {
      image:
        "https://cdn.creazilla.com/icons/3254448/todoist-icon-icon-original.svg",
      alt: "Todoist",
      isBlurred: true,
    },
  ],
];

export default function IntegrationsSection() {
  return (
    <section className="relative overflow-hidden px-4 py-20">
      <div className="relative mx-auto max-w-4xl">
        <LargeHeader
          chipText="Coming Soon"
          headingText="All Your Tools, One Assistant"
          subHeadingText={
            "GAIA plugs into your digital world — so it can actually do things, not just talk."
          }
        />

        {/* Integration Grid */}
        <div className="mt-14 flex flex-col items-center gap-5">
          {integrations.map((row, rowIndex) => (
            <div
              key={rowIndex}
              className={`flex items-center justify-start gap-3`}
            >
              {row.map((integration, cardIndex) => (
                <IntegrationCard
                  key={cardIndex}
                  image={integration.image}
                  alt={integration.alt}
                  isBlurred={integration.isBlurred}
                  isLarge={integration.isLarge}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
