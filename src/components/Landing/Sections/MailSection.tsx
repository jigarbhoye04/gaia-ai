import {
  BellRing,
  FileText,
  FolderOpen,
  Mail,
  MessageSquare,
  PenLineIcon,
  PenSquare,
  Search,
  Zap,
} from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";

import { Card } from "@/components/ui/card";

import { SectionHeading } from "../../../layouts/LandingSectionHeading";
import { cn } from "../../../lib/utils";
import { Mail01Icon } from "../../Misc/icons";

const images = [
  {
    id: "3",
    src: "/landing/mail/email3.webp",
    alt: "Mail Screenshot 3",
  },
  {
    id: "2",
    src: "/landing/mail/email2.webp",
    alt: "Mail Screenshot 2",
  },
  {
    id: "4",
    src: "/landing/mail/email4.webp",
    alt: "Mail Screenshot 4",
  },
  {
    id: "1",
    src: "/landing/mail/email1.webp",
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
    <div className="flex w-screen flex-col items-center justify-center">
      <div className="flex w-screen max-w-screen-xl flex-col space-y-5">
        <SectionHeading
          heading="The future of mail."
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
            <div className="relative aspect-video w-screen max-w-screen-xl overflow-hidden rounded-lg shadow-lg sm:min-h-[70vh]">
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

      <div className="mt-10 grid w-screen max-w-screen-xl grid-cols-1 gap-2 p-3 sm:gap-6 sm:p-0 md:grid-cols-2 lg:grid-cols-5">
        <BentoCard
          icon={<PenLineIcon className="h-5 w-5" />}
          title="Never write the same email twice"
          description="Easily personalize and send similar emails to different people without accidentally sending the exact same message twice."
        />

        <BentoCard
          icon={<BellRing className="h-5 w-5" />}
          title="Never miss important emails"
          description="Our smart system highlights important messages so they don't get lost in your busy inbox."
        />

        <BentoCard
          icon={<MessageSquare className="h-5 w-5" />}
          title="Chat to send emails"
          description="Just chat with our AI assistant to create and send emails - as simple as texting a friend."
        />

        <BentoCard
          icon={<FileText className="h-5 w-5" />}
          title="Summarisation"
          description="Turn long email threads into short, clear summaries with just one click."
        />

        <BentoCard
          icon={<Zap className="h-5 w-5" />}
          title="Built for speed"
          description="Work faster with shortcuts, quick replies, and a lightning-fast platform designed to save you time."
        />

        <BentoCard
          icon={<PenSquare className="h-5 w-5" />}
          title="Write emails with AI"
          description="Create perfect emails in seconds with our AI that learns your style and helps you write better messages."
        />

        <BentoCard
          icon={<FolderOpen className="h-5 w-5" />}
          title="Organize your inbox effortlessly"
          description="Smart filters and automatic categorization help you maintain a clean, organized inbox without any manual effort."
        />

        <BentoCard
          icon={<Search className="h-5 w-5" />}
          title="Find any email address"
          description="Quickly find anyone's email address with our built-in search tool - no more hunting for contact details."
        />

        <BentoCard
          icon={<Mail className="h-5 w-5" />}
          title="All your emails in one place"
          description="Manage all your email accounts in one simple, clean interface that makes email easy."
        />
      </div>
    </div>
  );
}

function BentoCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Card className="flex h-full flex-col rounded-2xl border-none bg-gradient-to-br from-primary/20 to-black p-5 outline-none">
      <div className="mb-2 text-primary">{icon}</div>
      <h3 className="relative z-[1] text-[1rem] font-semibold text-white">
        {title}
      </h3>
      <p className="relative z-[1] flex-grow text-sm text-white/80">
        {description}
      </p>
    </Card>
  );
}
