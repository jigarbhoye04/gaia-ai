import { EmailFrom } from "@/components/Mail/MailFrom";
import { formatTime } from "@/utils/mailUtils";
import { Spinner } from "@heroui/spinner";
import { Tooltip } from "@heroui/tooltip";
import { useState } from "react";
import { ListChildComponentProps } from "react-window";

export const Row = ({ index, style, data }: ListChildComponentProps) => {
    const { emails, isItemLoaded, openEmail } = data;

    if (!isItemLoaded(index)) {
        return (
            <div style={style} className="flex items-center justify-center">
                <Spinner />
            </div>
        );
    }

    const email = emails[index];
    if (!email) return null;

    const [title, setTitle] = useState("");
    const [subtitle, setSubtitle] = useState("");

    const fetchSummary = (isOpen: boolean) => {
        if (isOpen && !title && !subtitle) {
            setTitle(email.subject);
            setSubtitle(
                "Lorem ipsum, dolor sit amet consectetur adipisicing elit. Dignissimos, commodi."
            );
        }
    };

    return (
        <Tooltip
            showArrow
            placement="top"
            delay={400}
            closeDelay={0}
            shouldCloseOnInteractOutside={() => true}
            onOpenChange={fetchSummary}
            content={
                <div className="p-1 flex flex-col w-[300px]">
                    <div className="font-medium text-lg leading-tight">{title}</div>
                    <div>{subtitle}</div>
                </div>
            }
            onClose={() => {
                return !!title && !!subtitle;
            }}
            color="foreground"
            radius="sm"
        >
            <div
                className={`grid grid-cols-5 p-3 gap-5 items-center px-6 hover:bg-primary/20 hover:text-primary bg-black bg-opacity-45 transition-all duration-200 cursor-pointer ${email?.labelIds?.includes("UNREAD")
                    ? "font-medium"
                    : "font-normal text-foreground-400"
                    }`}
                style={style}
                onClick={() => openEmail(email)}
            >
                <div className="col-span-4 flex sm:items-center items-start sm:flex-row flex-col w-full">
                    <div className="flex-[0.3] truncate">
                        <EmailFrom from={email.from} />
                    </div>
                    <div className="flex-1 truncate max-w-[85vw] sm:text-lg text-sm">{email.subject}</div>
                </div>
                <div className="text-sm opacity-50 w-full text-nowrap text-right flex sm:items-center items-start h-full">{formatTime(email.time)}</div>
            </div>
        </Tooltip>
    );
};
