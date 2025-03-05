interface ColoredLineProps {
  color?: string;
  width?: string;
  className?: string;
}

export const ColoredLine = ({
  color = "white",
  width = "100%",
  className,
}: ColoredLineProps) => (
  <hr
    className={className}
    style={{
      height: 2,
      borderColor: color,
      width: width,
    }}
  />
);

export default function Hr({ width = "95%" }) {
  return (
    <div className="hr_container">
      <ColoredLine color={"rgba(128, 128, 128, 0.2)"} width={width} />
    </div>
  );
}
