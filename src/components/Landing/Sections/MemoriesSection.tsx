import {
  SimpleChatBubbleBot,
  SimpleChatBubbleUser,
} from "@/components/Landing/Dummy/SimpleChatBubbles";
import {
  Brain02Icon,
  BubbleConversationChatIcon,
  StickyNote01Icon,
} from "@/components/Misc/icons";
import { Chip } from "@heroui/chip";
import { Tab, Tabs } from "@heroui/tabs";
import { AnimatedSection } from "../../../layouts/AnimatedSection";
import { SectionHeading } from "../../../layouts/LandingSectionHeading";

function LocalNotecard({ plaintext }: { plaintext: string }) {
  return (
    <div className="bg-zinc-800 hover:bg-zinc-700 transition-all w-full rounded-xl text-foreground flex p-[1em] flex-col justify-start overflow-hidden gap-1 cursor-pointer h-full relative">
      <Chip className="mb-1" color="primary" size="sm" variant="flat">
        Auto Created by GAIA
      </Chip>
      <div className="font-normal text-md whitespace-wrap overflow-hidden overflow-ellipsis min-h-7 max-h-[100px]">
        {plaintext}
      </div>
    </div>
  );
}

export default function Section_Memories() {
  return (
    <div className="w-screen justify-center items-center flex relative z-[1]">
      <AnimatedSection className="max-w-screen-xl w-screen flex sm:flex-row flex-col justify-evenly items-start sm:space-x-10 space-x-5">
        <SectionHeading
          className="w-full"
          heading={"An Assistant That Remembers"}
          icon={
            <Brain02Icon
              className="sm:min-w-[40px] min-w-[35px] sm:min-h-[40px] min-h-[40px]"
              color="#9b9b9b"
            />
          }
          subheading={
            <div>
              GAIA remembers what matters to you. Your preferences, past
              conversations, and important details are saved, so you don’t have
              to repeat yourself.
              <br />
              <br />
              You can also store notes for things you want GAIA to remember,
              making every chat feel more personalized and helpful.
            </div>
          }
        />

        <div className="w-full sm:px-10 px-2 !m-0 !mt-0 h-[300px]">
          <Tabs
            aria-label="GAIA Notes Options"
            className="w-full overflow-hidden"
            classNames={{
              tabList: "w-full",
              tabContent: "group-data-[selected=true]:text-black font-medium",
            }}
            color="primary"
            radius="full"
          >
            <Tab
              key="chat"
              title={
                <div className="flex gap-2 items-center ">
                  <BubbleConversationChatIcon color={undefined} />
                  New Chat
                </div>
              }
            >
              <AnimatedSection className="space-y-4">
                <SimpleChatBubbleUser>What is my name?</SimpleChatBubbleUser>
                <SimpleChatBubbleBot>
                  Based on your saved notes, your name is Jake.
                </SimpleChatBubbleBot>
                <SimpleChatBubbleUser>
                  I need help with choosing a career path.
                </SimpleChatBubbleUser>
                <SimpleChatBubbleBot>
                  I remember you&apos;re a Computer Science student! Have you
                  thought about pursuing a career in software engineering, data
                  science, or perhaps cybersecurity?
                </SimpleChatBubbleBot>
              </AnimatedSection>
            </Tab>

            <Tab
              key="notes"
              title={
                <div className="flex gap-2 items-center">
                  <StickyNote01Icon color={undefined} />
                  Your Notes
                </div>
              }
            >
              <AnimatedSection className="grid sm:grid-cols-2 grid-cols-1 gap-2">
                <LocalNotecard plaintext={"My name is Jake"} />
                <LocalNotecard
                  plaintext={"Jake is a 3rd year Computer Science student"}
                />
              </AnimatedSection>
            </Tab>
          </Tabs>
        </div>
      </AnimatedSection>
    </div>
  );
}
