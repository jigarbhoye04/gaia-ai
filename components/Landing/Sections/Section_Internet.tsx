/* eslint-disable prettier/prettier */
import { BrainCircuitIcon } from "lucide-react";
import { useState } from "react";

import {
  SimpleChatBubbleBot,
  SimpleChatBubbleUser,
} from "../../Chat/ChatBubbles/SimpleChatBubbles";
import { AiBrowserIcon, GlobalSearchIcon } from "../../Misc/icons";
import { AnimatedSection } from "../AnimatedSection";
import { SectionHeading } from "../SectionHeading";

function SearchWeb() {
  return (
    <AnimatedSection className="space-y-3">
      <SimpleChatBubbleUser>
        <div className="relative max-w-fit min-w-min inline-flex items-center justify-between box-border whitespace-nowrap px-1 h-7 text-small rounded-full bg-default/40 text-default-700 mb-2">
          <span className="flex-1 text-inherit font-normal px-2 pr-1">
            <div className="flex items-center gap-1 font-medium text-white">
              Searching the Web
            </div>
          </span>
          <svg
            className="max-h-[80%] mr-1"
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
        <div className="flex text-wrap max-w-[25vw]">
          Who is the current president of America?
        </div>
      </SimpleChatBubbleUser>

      <SimpleChatBubbleBot>
        <div className="flex flex-col gap-3">
          <div className="relative max-w-fit min-w-min inline-flex items-center justify-between box-border whitespace-nowrap px-1 h-7 text-small rounded-full bg-primary/20 text-primary-600">
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
            <span className="flex-1 text-inherit font-normal px-2 pl-1">
              <div className="font-medium flex items-center gap-1 text-primary">
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
        <div className="relative max-w-fit min-w-min inline-flex items-center justify-between box-border whitespace-nowrap px-1 h-7 text-small rounded-full bg-default/40 text-default-700 mb-2">
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
          <span className="flex-1 text-inherit font-normal px-2 pl-1">
            <div className="flex items-center gap-1 text-white ">
              Fetching
              <a
                className="!text-white font-medium hover:!text-black transition-colors"
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
        <div className="relative max-w-fit min-w-min inline-flex items-center justify-between box-border whitespace-nowrap px-1 h-7 text-small rounded-full bg-primary/20 text-primary-600">
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
          <span className="flex-1 text-inherit font-normal px-2 pl-1">
            <div className="font-medium flex items-center gap-1 text-primary">
              Fetched
              <a
                className="!text-[#00bbff] font-medium hover:!text-white transition-colors"
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
    <AnimatedSection className="w-screen justify-center items-center flex">
      <div className="max-w-screen-xl w-screen flex flex-col sm:space-y-10 space-y-5 ">
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
          heading={"Smarter Answers, Always Up-to-Date"}
          icon={
            <BrainCircuitIcon
              className="sm:min-w-[40px] min-w-[35px] sm:min-h-[40px] min-h-[40px]"
              color="#9b9b9b"
            />
          }
          subheading={
            "GAIA doesn’t just rely on preloaded knowledge—it actively searches the web for the latest and most relevant information."
          }
        />
        <div className="sm:justify-around justify-start items-center flex gap-11 w-screen-md sm:flex-row flex-col">
          <div
            className={`sm:w-[35vw] w-[95%] space-y-3 bg-zinc-900 outline outline-zinc-800 hover:outline-primary rounded-3xl p-5 hover:bg-[#00bbff40] transition-all hover:scale-105 hover:sm:w-[40vw] min-h-fit flex justify-center flex-col relative z-[1] ${
              hover2 ? "opacity-40" : "opacity-100"
            }`}
            onMouseOut={() => setHover1(false)}
            onMouseOver={() => setHover1(true)}
          >
            <div className="mb-6 sm:p-2 space-y-2">
              <div className="font-medium text-3xl flex items-center w-full justify-between">
                Web Search
                <GlobalSearchIcon
                  className="sm:size-[35px] size-[35px]"
                  color="#9b9b9b"
                />
              </div>
              <div className="text-foreground-500">
                {/* Use the Internet to fetch up-to-date answers */}
                Most AI models have a knowledge cutoff, but GAIA can fetch
                real-time updates from the internet. Whether it’s breaking news
                or the latest industry trends you’ll always get the freshest
                insights.
              </div>
            </div>
            <SearchWeb />
          </div>

          {/* <div
          className={`w-[30vw] space-y-3 bg-black rounded-3xl p-5 hover:bg-[#00bbff40] transition-all hover:scale-105 hover:w-[40vw] ${
            hover1 ? "opacity-40" : "opacity-100"
            }`} */}
          <div
            className={`sm:w-[35vw] w-[95%] space-y-3 bg-zinc-900 outline outline-zinc-800 hover:outline-primary rounded-3xl p-5 hover:bg-[#00bbff40] transition-all hover:scale-105 hover:sm:w-[40vw] min-h-fit flex justify-center flex-col relative z-[1] ${
              hover1 ? "opacity-40" : "opacity-100"
            }`}
            onMouseOut={() => setHover2(false)}
            onMouseOver={() => setHover2(true)}
          >
            <div className="mb-6 p-2 space-y-2">
              <div className="font-medium text-3xl flex items-center w-full justify-between">
                Fetch Webpages
                <AiBrowserIcon
                  className="sm:size-[35px] size-[35px]"
                  color="#9b9b9b"
                />
              </div>
              <div className="text-foreground-500">
                Ever Wished Your AI Assistant Could Read an Entire Webpage for
                You? Now it can! GAIA fetches webpages and understands their
                content, so you don’t have to waste time scrolling through
                endless text.
              </div>
            </div>
            <FetchWebpage />
          </div>
        </div>
      </div>
    </AnimatedSection>
  );
}
