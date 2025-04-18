import { Chip } from "@heroui/chip";
import { Tab, Tabs } from "@heroui/tabs";

import {
  SimpleChatBubbleBot,
  SimpleChatBubbleUser,
} from "@/components/Landing/Dummy/SimpleChatBubbles";
import {
  Brain02Icon,
  BubbleConversationChatIcon,
  StickyNote01Icon,
} from "@/components/Misc/icons";

import { SectionHeading } from "../../../layouts/LandingSectionHeading";

function LocalNotecard({ plaintext }: { plaintext: string }) {
  return (
    <div className="relative flex h-full w-full cursor-pointer flex-col justify-start gap-1 overflow-hidden rounded-xl bg-zinc-800 p-[1em] text-foreground transition-all hover:bg-zinc-700">
      <Chip className="mb-1" color="primary" size="sm" variant="flat">
        Auto Created by GAIA
      </Chip>
      <div className="text-md whitespace-wrap max-h-[100px] min-h-7 overflow-hidden text-ellipsis font-normal">
        {plaintext}
      </div>
    </div>
  );
}

export default function Section_Memories() {
  return (
    <div className="relative z-1 flex w-screen items-center justify-center">
      <div className="flex w-screen max-w-(--breakpoint-xl) flex-col items-start justify-evenly space-x-5 sm:flex-row sm:space-x-10">
        <SectionHeading
          className="w-full"
          heading={"An Assistant That Remembers"}
          icon={
            <Brain02Icon
              className="min-h-[40px] min-w-[35px] sm:min-h-[40px] sm:min-w-[40px]"
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

        <div className="m-0! mt-0! h-[300px] w-full px-2 sm:px-10">
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
                <div className="flex items-center gap-2">
                  <BubbleConversationChatIcon color={undefined} />
                  New Chat
                </div>
              }
            >
              <div className="space-y-4">
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
              </div>
            </Tab>

            <Tab
              key="notes"
              title={
                <div className="flex items-center gap-2">
                  <StickyNote01Icon color={undefined} />
                  Your Notes
                </div>
              }
            >
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <LocalNotecard plaintext={"My name is Jake"} />
                <LocalNotecard
                  plaintext={"Jake is a 3rd year Computer Science student"}
                />
              </div>
            </Tab>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
