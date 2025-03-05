import { Tooltip } from "@heroui/tooltip";
import { useEffect, useState } from "react";

import Image from "next/image";

export default function StarterEmoji() {
  const smileys = [
    "/smileys/smiley1.webp",
    "/smileys/smiley2.webp",
    "/smileys/smiley3.webp",
    "/smileys/smiley4.webp",
    "/smileys/smiley5.webp",
    "/smileys/smiley6.webp",
    "/smileys/smiley7.webp",
    "/smileys/smiley8.webp",
    "/smileys/smiley9.webp",
    "/smileys/smiley10.webp",
    "/smileys/smiley11.webp",
    "/smileys/smiley12.webp",
    "/smileys/smiley13.webp",
    "/smileys/smiley14.webp",
    "/smileys/smiley15.webp",
    "/smileys/smiley16.webp",
    "/smileys/smiley17.webp",
    "/smileys/smiley18.webp",
    "/smileys/smiley19.webp",
    "/smileys/smiley20.webp",
    "/smileys/smiley21.webp",
    "/smileys/smiley22.webp",
    "/smileys/smiley23.webp",
    "/smileys/smiley24.webp",
  ];
  const [currentSmiley, setCurrentSmiley] = useState(1);

  const changeSmiley = () => {
    const randomIndex = Math.floor(Math.random() * smileys.length);

    setCurrentSmiley(randomIndex);
  };

  useEffect(() => {
    const timer = setTimeout(changeSmiley, 1500);

    return () => clearTimeout(timer);
  }, [currentSmiley]);

  return (
    <Tooltip
      color="primary"
      content="My name is gaia, I am your personal AI assistant!"
      placement="top"
    >
      {/* <img
        alt="Smiley"
        className="starter_emoji"
        src={smileys[currentSmiley]}
        onClick={changeSmiley}
      />
       */}
      <Image
        alt="Smiley"
        className="starter_emoji"
        src={smileys[currentSmiley]}
        onClick={changeSmiley}
      />
    </Tooltip>
  );
}
