import { Button } from "@heroui/button";
import Link from "next/link";
import React from "react";

import WordPullUp from "../MagicUI/word-pull-up";
import { ColoredLine } from "./HorizontalRuler";

export default function TextInformation({
  alignleft = true,
  title,
  description = [],
  btntext,
  btnicon,
  btnhref = "/",
  button = (
    <Button
      className="w-fit text-lg font-medium"
      color="primary"
      endContent={btnicon}
      radius="md"
      size="lg"
      onClick={(e) => e.preventDefault()}
    >
      <Link href={btnhref}>{btntext}</Link>
    </Button>
  ),
}: {
  alignleft?: boolean;
  title: string;
  description?: string[];
  button?: React.ReactNode;
  btntext?: string;
  btnicon?: React.ReactNode;
  btnhref?: string;
}) {
  return (
    <div
      className={`flex h-screen w-full flex-col items-center justify-around px-[10%] py-[10%] md:h-[80vh] ${
        alignleft ? "text-left" : "text-right"
      }`}
    >
      <div
        className={`flex flex-col gap-5 pb-[10%] md:w-[70%] ${
          alignleft ? "items-start" : "items-end"
        }`}
      >
        <WordPullUp
          className={`z-1 relative text-4xl font-medium md:text-6xl ${
            alignleft ? "text-left" : "text-right"
          }`}
          words={title}
        />
        <div className="text-md display z-2 relative flex flex-col gap-2 text-zinc-400 md:text-2xl">
          {description.map((entry, index) => (
            <span key={index}>{entry}</span>
          ))}
        </div>
        {button}
      </div>
      <ColoredLine color={"rgba(128, 128, 128, 0.2)"} width={"50%"} />
    </div>
  );
}
