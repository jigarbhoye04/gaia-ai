import { BrainCircuitIcon } from "lucide-react";
import { useState } from "react";

import { AnimatedSection } from "../../../layouts/AnimatedSection";
import { SectionHeading } from "../../../layouts/LandingSectionHeading";
import {
  AiBrowserIcon,
  CheckmarkCircle02Icon,
  GlobalSearchIcon,
} from "../../Misc/icons";
import {
  SimpleChatBubbleBot,
  SimpleChatBubbleUser,
} from "../Dummy/SimpleChatBubbles";

function SearchWeb() {
  return (
    <AnimatedSection className="space-y-3">
      <SimpleChatBubbleUser>
        <div className="relative mb-2 box-border inline-flex h-7 min-w-min max-w-fit items-center justify-between whitespace-nowrap rounded-full bg-default/40 px-1 text-small text-default-700">
          <span className="flex-1 px-2 pr-1 font-normal text-inherit">
            <div className="flex items-center gap-1 font-medium text-white">
              Searching the Web
            </div>
          </span>
          <svg
            className="mr-1 max-h-[80%]"
            color="transparent"
            fill="white"
            height="22"
            viewBox="0 0 24 24"
            width="24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M3 12C7.5 12 12 7.5 12 3C12 7.5 16.5 12 21 12C16.5 12 12 16.5 12 21C12 16.5 7.5 12 3 12Z"
              stroke="currentColor"
              strokeLinejoin="round"
              strokeWidth="1.5"
            />
            <path
              d="M2 19.5C2.83333 19.5 4.5 17.8333 4.5 17C4.5 17.8333 6.16667 19.5 7 19.5C6.16667 19.5 4.5 21.1667 4.5 22C4.5 21.1667 2.83333 19.5 2 19.5Z"
              stroke="currentColor"
              strokeLinejoin="round"
              strokeWidth="1.5"
            />
            <path
              d="M16 5C17 5 19 3 19 2C19 3 21 5 22 5C21 5 19 7 19 8C19 7 17 5 16 5Z"
              stroke="currentColor"
              strokeLinejoin="round"
              strokeWidth="1.5"
            />
          </svg>
        </div>
        <div className="flex max-w-[25vw] text-wrap">
          Who is the current president of America?
        </div>
      </SimpleChatBubbleUser>

      <SimpleChatBubbleBot>
        <div className="flex flex-col gap-3">
          <div className="relative box-border inline-flex h-7 min-w-min max-w-fit items-center justify-between whitespace-nowrap rounded-full bg-primary/20 px-1 text-small text-primary-600">
            <svg
              className="max-h-[80%]"
              color="#00bbff"
              fill="none"
              height="20"
              viewBox="0 0 24 24"
              width="24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <ellipse
                cx="12"
                cy="12"
                rx="4"
                ry="10"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <path
                d="M2 12H22"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
              />
            </svg>
            <span className="flex-1 px-2 pl-1 font-normal text-inherit">
              <div className="flex items-center gap-1 font-medium text-primary">
                Live Search Results from the Web
              </div>
            </span>
          </div>
          <div className="prose dark:prose-invert sm:max-w-[500px]">
            <p>
              The current president of the United States is Donald John Trump,
              who was sworn into office on January 20, 2025, according to the
              information provided by USA Gov.
            </p>
          </div>
        </div>
      </SimpleChatBubbleBot>
      {/* <span className="text-xs text-white text-opacity-40 flex flex-col p-1 relative bottom-2">
        10:37 PM 25th Jan 2025
      </span> */}
    </AnimatedSection>
  );
}

function FetchWebpage() {
  return (
    <AnimatedSection className="space-y-3">
      <SimpleChatBubbleUser>
        <div className="relative mb-2 box-border inline-flex h-7 min-w-min max-w-fit items-center justify-between whitespace-nowrap rounded-full bg-default/40 px-1 text-small text-default-700">
          <svg
            className="lucide lucide-arrow-up-right max-h-[80%]"
            fill="none"
            height="20"
            stroke="white"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            width="24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M7 7h10v10" />
            <path d="M7 17 17 7" />
          </svg>
          <span className="flex-1 px-2 pl-1 font-normal text-inherit">
            <div className="flex items-center gap-1 text-white">
              Fetching
              <a
                className="font-medium !text-white transition-colors hover:!text-black"
                href="https://www.heroui.com/docs/components/modal"
                rel="noreferrer"
                target="_blank"
              >
                heroui.com/docs...
              </a>
            </div>
          </span>
        </div>
        How can I create a Modal with this component?
      </SimpleChatBubbleUser>

      <SimpleChatBubbleBot>
        <div className="relative box-border inline-flex h-7 min-w-min max-w-fit items-center justify-between whitespace-nowrap rounded-full bg-primary/20 px-1 text-small text-primary-600">
          <svg
            className="lucide lucide-arrow-up-right max-h-[80%]"
            fill="none"
            height="20"
            stroke="#00bbff"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            width="24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M7 7h10v10" />
            <path d="M7 17 17 7" />
          </svg>
          <span className="flex-1 px-2 pl-1 font-normal text-inherit">
            <div className="flex items-center gap-1 font-medium text-primary">
              Fetched
              <a
                className="font-medium !text-[#00bbff] transition-colors hover:!text-white"
                href="https://www.heroui.com/docs/components/modal"
                rel="noreferrer"
                target="_blank"
              >
                heroui.com/docs...
              </a>
            </div>
          </span>
        </div>
        <div className="mt-3 sm:max-w-[500px]">
          The webpage appears to be the documentation for HeroUI (previously
          NextUI), a React UI library. Here is an example of how to create a
          basic modal using HeroUI...
          <div />
        </div>
      </SimpleChatBubbleBot>
    </AnimatedSection>
  );
}

export default function Internet() {
  const [hover1, setHover1] = useState(false);
  const [hover2, setHover2] = useState(false);

  return (
    <AnimatedSection className="flex w-screen items-center justify-center">
      <div className="flex w-screen max-w-screen-xl flex-col space-y-5">
        {/* 
      <div className="max-w-screen-xl w-screen flex flex-row justify-evenly items-start sm:space-x-10 space-x-5 ">
        
        */}
        {/* <div className="sm:text-5xl text-4xl font-bold flex items-center gap-4 ">
          <InternetIcon
            color="#ffffff80"
            className="sm:size-[55px] size-[45px]"
          />
          Use the Internet
        </div>
        <div>utilise the power of the web to</div> */}

        <SectionHeading
          heading={"Smarter Answers"}
          icon={
            <BrainCircuitIcon
              className="min-h-[40px] min-w-[35px] sm:min-h-[40px] sm:min-w-[40px]"
              color="#9b9b9b"
            />
          }
          className="flex items-center justify-center text-center"
          headingClassName="text-5xl"
          // subheading={
          //   "GAIA doesn’t just rely on preloaded knowledge—it actively searches the web for the latest and most relevant information."
          // }
        />
        <div className="w-screen-md flex flex-col items-center justify-start gap-11 sm:flex-row sm:justify-around">
          <AnimatedSection
            className={`relative z-[1] flex min-h-fit w-[95%] flex-col justify-center space-y-3 rounded-3xl bg-zinc-900 p-5 outline outline-zinc-800 transition-all hover:scale-105 hover:bg-[#00bbff40] hover:outline-primary sm:w-1/2 hover:sm:w-[60%] ${
              hover2 ? "opacity-40" : "opacity-100"
            }`}
            onMouseOut={() => setHover1(false)}
            onMouseOver={() => setHover1(true)}
          >
            <div className="space-y-2 sm:p-2">
              <div className="flex w-full items-center justify-between text-3xl font-medium">
                Web Search
                <GlobalSearchIcon
                  className="size-[35px] sm:size-[35px]"
                  color="#9b9b9b"
                />
              </div>
              <div className="text-foreground-500">
                Most AI models have a knowledge cutoff, but GAIA can fetch
                real-time updates from the internet. Whether it's breaking news
                or the latest industry trends, you'll always have access to the
                most up-to-date insights.
              </div>
            </div>

            <div className="space-y-2 px-10">
              <div className="flex items-start gap-2">
                <CheckmarkCircle02Icon width={25} height={25} color="#00bbff" />
                Real-time answers, never outdated.
              </div>
              <div className="flex items-start gap-2">
                <CheckmarkCircle02Icon width={25} height={25} color="#00bbff" />
                Instant fact-checking from live sources.
              </div>
              <div className="flex items-start gap-2">
                <CheckmarkCircle02Icon width={25} height={25} color="#00bbff" />
                Goes beyond preloaded AI knowledge.
              </div>
            </div>
            {/* <SearchWeb /> */}
          </AnimatedSection>

          <AnimatedSection
            className={`relative z-[1] flex min-h-fit w-[95%] flex-col justify-center space-y-3 rounded-3xl bg-zinc-900 p-5 outline outline-zinc-800 transition-all hover:scale-105 hover:bg-[#00bbff40] hover:outline-primary sm:w-1/2 hover:sm:w-[60%] ${
              hover1 ? "opacity-40" : "opacity-100"
            }`}
            onMouseOut={() => setHover2(false)}
            onMouseOver={() => setHover2(true)}
          >
            <div className="space-y-2 p-2">
              <div className="flex w-full items-center justify-between text-3xl font-medium">
                Fetch Webpages
                <AiBrowserIcon
                  className="size-[35px] sm:size-[35px]"
                  color="#9b9b9b"
                />
              </div>
              <div className="text-foreground-500">
                Wish your AI assistant could access and read a whole webpage for
                you? Now GAIA can! It fetches and understands web content, so
                you don’t have to waste time scrolling through endless text.
              </div>
            </div>

            <div className="space-y-2 px-10">
              <div className="flex items-start gap-2">
                <CheckmarkCircle02Icon width={25} height={25} color="#00bbff" />
                Summarizes any webpage in seconds, saving time.
              </div>
              <div className="flex items-start gap-2">
                <CheckmarkCircle02Icon width={25} height={25} color="#00bbff" />
                One-click webpage analysis for instant understanding.
              </div>
              <div className="flex items-start gap-2">
                <CheckmarkCircle02Icon width={25} height={25} color="#00bbff" />
                No more scrolling through endless text on websites.
              </div>
            </div>
            {/* <FetchWebpage /> */}
          </AnimatedSection>
        </div>
      </div>
    </AnimatedSection>
  );
}
