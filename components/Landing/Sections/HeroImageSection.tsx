import { Dispatch, SetStateAction } from "react";
import { AnimatedSection } from "../../../layouts/AnimatedSection";
import DummySearchbar from "../Dummy/DummySearchbar";
import { GeneratedImageChatBubble } from "./ImageGenerationSection";
import { Safari } from "@/components/ui/safari";
import { ShineBorder } from "@/components/ui/shine-border";

export default function HeroImage() {
  return (
    <div className="w-screen flex items-center justify-center">
      <AnimatedSection className="flex items-center justify-center h-fit w-screen max-w-screen-lg lg:max-w-screen-xl  mt-14 sm:mb-0 mb-[20vh]">
        {/* <GridPattern
          width={20}
          height={20}
          x={-1}
          y={-1}
          className={cn(
            "[mask-image:radial-gradient(1000px_circle_at_center,white,transparent)] sm:max-h-[120vh] max-h-[70vh] top-[50vh]"
          )}
        /> */}

        <div className="relative sm:scale-100 scale-[175%]">
          <ShineBorder
            borderRadius={10}
            borderWidth={3}
            className="size-full w-fit !min-w-fit rounded-xl bg-zinc-800 p-0 animate-pulse-shadow relative"
            color={["#00bbff", "#27272a"]}
            duration={7}
          >
            <Safari
              className="w-full h-fit"
              imageSrc="/landing/hero_image_nosearchbar.webp"
              mode="simple"
              url="heygaia.io"
            />
            <div className="absolute text-white flex w-full sm:bottom-4 bottom-[-15px] justify-center left-0 items-center sm:scale-100 scale-50">
              <DummySearchbar />
            </div>
          </ShineBorder>

          {/* <div className="max-w-screen-xl w-screen bg-gradient-to-b from-[#00bbff30] animate-pulse-shadow to-black bg-zinc-950 outline outline-zinc-700 min-h-[90vh] rounded-2xl z-20 flex justify-center p-10">
            <div className="flex flex-col max-w-screen-md w-full gap-2">
              <SimpleChatBubbleUser>
                I have a meeting this weekend could you add it to my calendar?
              </SimpleChatBubbleUser>
              <CalendarBotMessage dummyAddToCalendar={() => {}} />
              <SimpleChatBubbleUser>
                Generate Image: Golden Retriever
              </SimpleChatBubbleUser>
              <SimpleChatBubbleBot parentClassName="!max-w-[300px]">
                <GeneratedImageChatBubble
                  selectedOption={{
                    title: "Golden Retriever",
                    prompt: "cute, golden retriever",
                    src: "/generated/golden_retriever.webp",
                  }}
                />
              </SimpleChatBubbleBot>
            </div>
          </div> */}

          <div className="sm:flex hidden absolute -left-28 top-0 h-full items-start animate-bounce3 ">
            <div className="bg-zinc-800 w-[250px] h-fit px-2 pb-2 rounded-3xl top-24 relative outline outline-2 outline-zinc-700 -rotate-2">
              <GeneratedImageChatBubble
                selectedOption={{
                  title: "Golden Retriever",
                  prompt: "cute, golden retriever",
                  src: "/generated/golden_retriever.webp",
                }}
              />
            </div>
          </div>

          <div className="sm:flex hidden absolute -right-28 top-0 h-full items-end">
            <div className="bg-zinc-800 w-[250px] h-[250px] rounded-xl bottom-24 relative outline outline-2 outline-zinc-700 flex items-center justify-center">
              <div className="pingspinner !min-h-[100px] !min-w-[100px]" />
              {/* update this */}
            </div>
          </div>
        </div>
      </AnimatedSection>
    </div>
  );
}
