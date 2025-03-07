import GmailBody from "@/components/Mail/GmailBody";
import { parseEmail } from "@/utils/mailUtils";
import he from "he";
import { User } from "@heroui/user";
import { Drawer } from "vaul";
import { MagicWand05Icon, StarsIcon } from "../Misc/icons";
import { Chip } from "@heroui/chip";
import { EmailData } from "@/types/mailTypes";
import { XIcon } from "lucide-react";
import { Tooltip } from "@heroui/tooltip";
import { Button } from "@heroui/button";

interface ViewEmailProps {
  mail: EmailData | null;
  onOpenChange: () => void;
}

function AISummary() {
  return (
    <>
      <div className="bg-zinc-800 outline outline-2 outline-zinc-700 p-2 w-fit rounded-xl shadow-md flex flex-col mb-3">
        <div className="text-sm font-medium text-white flex items-center gap-3 relative">
          <Chip
            classNames={{
              content:
                "text-sm relative !flex flex-row text-primary items-center gap-1 pl-3 font-medium",
            }}
            variant="flat"
            color="primary"
          >
            <StarsIcon
              width={17}
              height={17}
              color={undefined}
              fill={"#00bbff"}
            />
            <span>GAIA Email Summary</span>
          </Chip>
        </div>
        <p className="text-sm text-white p-2">
          Lorem ipsum dolor sit amet consectetur adipisicing elit. Nisi magnam
          doloribus tempore molestiae nemo debitis blanditiis. Consequatur iusto
          impedit atque aliquid maiores, cupiditate id autem porro temporibus
          est! Nemo necessitatibus quod officia cupiditate doloribus quidem
          nihil temporibus, ullam, voluptates soluta reprehenderit maxime
          dolorum minus accusantium aperiam quas voluptatibus! Dolore, aliquid
          ratione facilis voluptates corrupti sit molestias? Ipsam enim, dicta
          iusto vitae, autem nostrum illo accusamus iste ea deleniti aliquam
          quas sapiente reiciendis. Nobis placeat tempore assumenda fuga modi.
          Esse minima quaerat accusantium, alias facere vero voluptas suscipit
          quod quo repellendus magni molestiae quis eum, rem nisi cumque a
          laborum libero?
        </p>
      </div>
    </>
  );
}

export default function ViewEmail({ mail, onOpenChange }: ViewEmailProps) {
  const { name: nameFrom, email: emailFrom } = parseEmail(mail?.from);

  return (
    <Drawer.Root direction="right" open={!!mail} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-md" />
        <Drawer.Content
          className="right-0 top-2 bottom-2 fixed z-10 outline-none w-[50vw] flex"
          style={
            { "--initial-transform": "calc(100% + 8px)" } as React.CSSProperties
          }
        >
          <div className="bg-zinc-900 h-full w-full grow p-6 pt-4 flex flex-col rounded-l-2xl overflow-y-auto relative">
            <div className="w-full relative">
              <Tooltip content="Close" color="foreground">
                <div className="cursor-pointer absolute right-0 top-0">
                  <XIcon width={18} onClick={onOpenChange} />
                </div>
              </Tooltip>
            </div>

            <header className="flex items-center gap-2 mb-2">
              <Button
                // variant="faded"
                color="primary"
                className="font-medium"
                startContent={<MagicWand05Icon color={undefined} />}
              >
                Summarise
              </Button>
              <Button
                variant="faded"
                color="primary"
                className="font-medium"
                isDisabled
                startContent={<MagicWand05Icon color={undefined} />}
              >
                Categorise
              </Button>
            </header>

            <AISummary />

            {/* <div className="flex items-center gap-4"> */}
            {/* <Chip
                className="flex w-fit py-6 mb-2 overflow-hidden"
                radius="sm"
                variant="flat"
              >
                <div className="absolute inset-0 border-l-[3px] border-primary" />
                <div className="text-xs space-x-1 ">
                  <span className="text-gray-300 font-medium">To:</span>
                  <span className="text-gray-400">{emailFrom}</span>
                </div>
                <div className="font-medium">{nameFrom}</div>
              </Chip>

              <Chip
                className="flex w-fit py-6 mb-2 overflow-hidden"
                radius="sm"
                variant="flat"
              >
                <div className="absolute inset-0 border-l-[4px] border-success" />
                <div className="text-xs space-x-1 ">
                  <span className="text-gray-300 font-medium">To:</span>
                  <span className="text-gray-400">{emailTo}</span>
                </div>
                <div className="font-medium">{nameTo}</div>
              </Chip>
            /* </div>
               */}

            {mail?.subject && (
              <Drawer.Title className="font-medium text-foreground">
                {mail?.subject}
              </Drawer.Title>
            )}

            <Drawer.Description className="text-foreground-600 space-y-4">
              {mail?.snippet && (
                <>
                  <p className="text-md text-muted-foreground">
                    {he.decode(mail.snippet)}
                  </p>
                  <User
                    avatarProps={{
                      src: "/profile_photo/profile_photo.webp",
                      size: "sm",
                    }}
                    description={emailFrom}
                    name={nameFrom}
                    classNames={{
                      name: "font-medium",
                      description: "text-gray-400",
                    }}
                  />
                </>
              )}

              {mail && (
                <div>
                  <hr className="my-4 border-gray-700" />
                  <GmailBody email={mail} />
                </div>
              )}
            </Drawer.Description>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
