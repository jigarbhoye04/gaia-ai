import Image from "next/image";
import { useCallback, useEffect, useState } from "react";

import { SectionHeading } from "../../../layouts/LandingSectionHeading";
import { cn } from "../../../lib/utils";
import { Mail01Icon } from "../../Misc/icons";

const images = [
  {
    id: "3",
    src: "/landing/mail/email3.png",
    alt: "Mail Screenshot 3",
  },
  {
    id: "2",
    src: "/landing/mail/email2.png",
    alt: "Mail Screenshot 2",
  },
  {
    id: "4",
    src: "/landing/mail/email4.png",
    alt: "Mail Screenshot 4",
  },
  {
    id: "1",
    src: "/landing/mail/email1.png",
    alt: "Mail Screenshot 1",
  },
];

export default function MailSection() {
  const [activeImage, setActiveImage] = useState(images[0].id);

  // Auto-rotate images
  const nextImage = useCallback(() => {
    setActiveImage((prevId) => {
      const currentIndex = images.findIndex((img) => img.id === prevId);
      const nextIndex = (currentIndex + 1) % images.length;
      return images[nextIndex].id;
    });
  }, []);

  useEffect(() => {
    const timer = setInterval(nextImage, 4000);
    return () => clearInterval(timer);
  }, [nextImage]);

  return (
    <div className="flex w-screen items-center justify-center">
      <div className="flex w-screen max-w-screen-xl flex-col space-y-5">
        <SectionHeading
          heading="The future of mail is here."
          chipTitle="Mail"
          chipTitle2="Coming Soon"
          icon={
            <Mail01Icon
              className="size-[35px] sm:size-[35px]"
              color="#9b9b9b"
            />
          }
          subheading="GAIA summarizes emails, drafts with AI, adapts writing style, fetches recipient emails, supports multi-drafts, and auto-labels—ensuring you never miss important messages."
        />

        <div className="flex justify-center">
          <div className="relative w-full max-w-screen-xl">
            <div className="relative aspect-video min-h-[70vh] w-screen max-w-screen-xl overflow-hidden rounded-lg shadow-lg">
              {images.map((image) => (
                <div
                  key={image.id}
                  className={cn(
                    "absolute inset-0 h-full w-full cursor-pointer overflow-hidden rounded-xl transition-opacity duration-500 ease-in-out",
                    activeImage === image.id ? "opacity-100" : "opacity-0",
                  )}
                  onClick={nextImage}
                >
                  <Image
                    src={image.src}
                    alt={image.alt}
                    fill
                    className="w-full rounded-xl object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4 flex justify-center space-x-2">
          {images.map((image) => (
            <button
              key={image.id}
              onClick={() => setActiveImage(image.id)}
              className={cn(
                "max-h-[10px] min-h-[10px] min-w-[10px] max-w-[10px] rounded-full transition",
                activeImage === image.id
                  ? "bg-primary"
                  : "bg-gray-600 hover:bg-gray-400",
              )}
              aria-label={`Go to slide ${image.id}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
