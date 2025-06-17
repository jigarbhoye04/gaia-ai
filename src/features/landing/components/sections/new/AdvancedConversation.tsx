


import { FeatureCard } from "../../shared/FeatureCard";
import LargeHeader from "../../shared/LargeHeader";

const featureCards = [
  {
    imageSrc: "/landing/mail.png",
    title: "Upload & Understand Files",
    description:
      "Drop in PDFs, docs, or images—GAIA reads and extracts the key insights instantly.",
    icon: "📄",
  },
  {
    imageSrc: "/landing/mail.png",
    title: "Generate Images from Ideas",
    description:
      "Turn natural language into visual concepts without leaving the conversation.",
    reverse: true,
    icon: "🎨",
  },
  {
    imageSrc: "/landing/mail.png",
    title: "Create Flowcharts Instantly",
    description:
      "Describe any logic or process—GAIA transforms it into clean, structured diagrams.",
    icon: "📊",
  },
  {
    imageSrc: "/landing/mail.png",
    title: "Star Important Threads",
    description:
      "Save critical conversations and reference them easily anytime.",
    reverse: true,
    icon: "⭐",
  },
  {
    imageSrc: "/landing/mail.png",
    title: "Pin Key Messages",
    description:
      "Keep your most relevant messages front and center—never lose track again.",
  },
  {
    imageSrc: "/landing/mail.png",
    title: "Search Across Conversations",
    description:
      "Quickly find past messages, files, or threads with intelligent memory search.",
  },
];

export default function AdvancedConversation() {
  return (
    <div className="flex flex-col items-center justify-center gap-10 p-10">
      <LargeHeader
        headingText="Smarter Conversations"
        subHeadingText={"Finally, AI that feels like it's made for you."}
      />
      <div className="grid h-full w-full max-w-5xl grid-cols-3 grid-rows-3 gap-4">
        {featureCards.map((card, index) => (
          <FeatureCard
            key={index}
            imageSrc={card.imageSrc}
            title={card.title}
            description={card.description}
            small={true}
            icon={card.icon}
            reverse
          />
        ))}
      </div>
    </div>
  );
}
