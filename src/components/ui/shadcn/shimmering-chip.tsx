interface ShinyTextProps {
  text: string;
  disabled?: boolean;
  speed?: number;
  className?: string;
}

const ShinyText = ({
  text,
  disabled = false,
  speed = 5,
  className = "",
}: ShinyTextProps) => {
  const animationDuration = `${speed}s`;

  return (
    <div className={className}>
      <div
        className={`inline-block bg-clip-text text-[#b5b5b5a4] ${disabled ? "" : "animate-shine"} `}
        style={{
          backgroundImage:
            "linear-gradient(120deg, rgba(255, 255, 255, 0) 40%, rgba(255, 255, 255, 0.8) 50%, rgba(255, 255, 255, 0) 60%)",
          backgroundSize: "200% 100%",
          WebkitBackgroundClip: "text",
          animationDuration,
        }}
      >
        {text}
      </div>
    </div>
  );
};

export default ShinyText;
