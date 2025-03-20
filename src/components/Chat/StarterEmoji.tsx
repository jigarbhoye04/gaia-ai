"use client";

import { Tooltip } from "@heroui/tooltip";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";

import smiley1 from "../Smileys/1.webp";
import smiley2 from "../Smileys/2.webp";
import smiley3 from "../Smileys/3.webp";
import smiley4 from "../Smileys/4.webp";
import smiley5 from "../Smileys/5.webp";
import smiley6 from "../Smileys/6.webp";
import smiley7 from "../Smileys/7.webp";
import smiley8 from "../Smileys/8.webp";
import smiley9 from "../Smileys/9.webp";
import smiley10 from "../Smileys/10.webp";
import smiley11 from "../Smileys/11.webp";
import smiley12 from "../Smileys/12.webp";
import smiley13 from "../Smileys/13.webp";
import smiley14 from "../Smileys/14.webp";
import smiley15 from "../Smileys/15.webp";
import smiley16 from "../Smileys/16.webp";
import smiley23 from "../Smileys/23.webp";
import smiley24 from "../Smileys/24.webp";

export default function StarterEmoji() {
  const smileys = [
    smiley1,
    smiley2,
    smiley3,
    smiley4,
    smiley5,
    smiley6,
    smiley7,
    smiley1,
    smiley8,
    smiley9,
    smiley10,
    smiley11,
    smiley12,
    smiley13,
    smiley14,
    smiley15,
    smiley16,
    smiley1,
    smiley23,
    smiley24,
  ];

  const [currentSmiley, setCurrentSmiley] = useState(1);

  const changeSmiley = useCallback(() => {
    const randomIndex = Math.floor(Math.random() * smileys.length);
    setCurrentSmiley(randomIndex);
  }, [smileys.length]);

  useEffect(() => {
    const timer = setTimeout(changeSmiley, 1500);
    return () => clearTimeout(timer);
  }, [changeSmiley]);

  return (
    <Tooltip
      color="primary"
      content="My name is gaia, I am your personal AI assistant!"
      placement="top"
    >
      <Image
        alt="Smiley"
        className="starter_emoji"
        src={smileys[currentSmiley]}
        onClick={changeSmiley}
        width={48}
        height={48}
      />
    </Tooltip>
  );
}
