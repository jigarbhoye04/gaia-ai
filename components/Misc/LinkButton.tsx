import { Button, ButtonProps } from "@heroui/button";
import Link from "next/link";

interface LinkButtonProps extends ButtonProps {
  href: string;
  external?: boolean;
}

export function LinkButton({
  href,
  external = false,
  children,
  ...props
}: LinkButtonProps) {
  if (external) {
    return (
      <Button
        as="a"
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        variant="light"
        className="font-medium text-md text-zinc-300"
        {...props}
      >
        {children}
      </Button>
    );
  }

  return (
    <Button
      as={Link}
      href={href}
      variant="light"
      radius="sm"
      style={{ padding: "9px", height: "27px", width: "fit-content" }}
      className="font-medium text-md text-start text-zinc-300"
      {...props}
    >
      {children}
    </Button>
  );
}
