interface IntegrationCardProps {
  image?: string;
  alt?: string;
  className?: string;
}

export default function Integrations() {
  const IntegrationCard = ({
    image,
    alt = "Integration",
    className = "",
  }: IntegrationCardProps) => (
    <div
      className={`flex aspect-square w-30 items-center justify-center rounded-3xl bg-zinc-900 outline-1 outline-zinc-800 ${className}`}
    >
      {image ? (
        <img src={image} alt={alt} className="h-16 w-16 object-contain" />
      ) : (
        <div className="h-8 w-8 rounded-lg bg-zinc-700" />
      )}
    </div>
  );

  return (
    <div className="flex flex-col items-center gap-4">
      {/* First row - 5 columns */}
      <div className="flex gap-4">
        <IntegrationCard
          image="https://upload.wikimedia.org/wikipedia/commons/4/45/Notion_app_logo.png"
          alt="Integration 1"
          className="blur-[2px]"
        />
        <IntegrationCard
          image="https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Google_%22G%22_logo.svg/480px-Google_%22G%22_logo.svg.png"
          alt="Integration 2"
        />
        <IntegrationCard
          image="/path-to-integration-3.png"
          alt="Integration 3"
        />
        <IntegrationCard
          image="/path-to-integration-4.png"
          alt="Integration 4"
        />
        <IntegrationCard
          image="/path-to-integration-5.png"
          alt="Integration 5"
        />
      </div>

      {/* Second row - 4 columns */}
      <div className="flex gap-4">
        <IntegrationCard
          image="/path-to-integration-6.png"
          alt="Integration 6"
        />
        <IntegrationCard
          image="/path-to-integration-7.png"
          alt="Integration 7"
        />
        <IntegrationCard
          image="/path-to-integration-8.png"
          alt="Integration 8"
        />
        <IntegrationCard
          image="/path-to-integration-9.png"
          alt="Integration 9"
          className="border-2 border-blue-500"
        />
      </div>
    </div>
  );
}
