import { Button } from "@heroui/button";
import { AiSearch02Icon } from "../../Misc/icons";
import { Tag, TagInput } from "emblor";
import { SetStateAction } from "react";

interface EmailRecipientsProps {
    toEmails: Tag[];
    setToEmails: React.Dispatch<React.SetStateAction<Tag[]>>;
    ccEmails: Tag[];
    setCcEmails: React.Dispatch<React.SetStateAction<Tag[]>>;
    bccEmails: Tag[];
    setBccEmails: React.Dispatch<React.SetStateAction<Tag[]>>;
    showCcBcc: boolean;
    setShowCcBcc: React.Dispatch<React.SetStateAction<boolean>>;
    activeTagIndex: number | null;
    setActiveTagIndex: React.Dispatch<React.SetStateAction<number | null>>;
    onOpenAiModal: () => void;
}

/**
 * Email recipients component that handles To, CC, and BCC fields
 */
export const EmailRecipients = ({
    toEmails,
    setToEmails,
    ccEmails,
    setCcEmails,
    bccEmails,
    setBccEmails,
    showCcBcc,
    setShowCcBcc,
    activeTagIndex,
    setActiveTagIndex,
    onOpenAiModal
}: EmailRecipientsProps): JSX.Element => {
    return (
        <>
            {/* To Field */}
            <div className="relative">
                <TagInput
                    styleClasses={{
                        inlineTagsContainer:
                            "bg-zinc-800 border border-t-0 border-x-0 !border-b-zinc-600 border-b-2 p-2 rounded-none",
                        tag: { body: "p-0 bg-white/20 pl-3 text-sm border-none" },
                    }}
                    shape="pill"
                    animation="fadeIn"
                    placeholder="To"
                    tags={toEmails}
                    setTags={setToEmails}
                    activeTagIndex={activeTagIndex}
                    setActiveTagIndex={setActiveTagIndex}
                />
                <Button
                    isIconOnly
                    className="absolute right-[3px] top-[3px]"
                    size="sm"
                    color="primary"
                    onPress={onOpenAiModal}
                >
                    <AiSearch02Icon color={undefined} width={19} />
                </Button>
            </div>

            {/* CC and BCC Fields */}
            {showCcBcc && (
                <>
                    <div className="relative">
                        <TagInput
                            styleClasses={{
                                inlineTagsContainer: "bg-zinc-800 border border-t-0 border-x-0 !border-b-zinc-600 border-b-2 p-2 rounded-none",
                                tag: { body: "p-0 bg-white/20 pl-3 text-sm border-none" },
                            }}
                            shape="pill"
                            animation="fadeIn"
                            placeholder="Cc"
                            tags={ccEmails}
                            setTags={setCcEmails}
                            activeTagIndex={null}
                            setActiveTagIndex={function (value: SetStateAction<number | null>): void {
                                // No implementation needed for CC field
                            }}
                        />
                    </div>
                    <div className="relative">
                        <TagInput
                            styleClasses={{
                                inlineTagsContainer: "bg-zinc-800 border border-t-0 border-x-0 !border-b-zinc-600 border-b-2 p-2 rounded-none",
                                tag: { body: "p-0 bg-white/20 pl-3 text-sm border-none" },
                            }}
                            shape="pill"
                            animation="fadeIn"
                            placeholder="Bcc"
                            tags={bccEmails}
                            setTags={setBccEmails}
                            activeTagIndex={null}
                            setActiveTagIndex={function (value: SetStateAction<number | null>): void {
                                // No implementation needed for BCC field
                            }}
                        />
                    </div>
                </>
            )}

            {/* Show/Hide CC/BCC Toggle */}
            <div className="flex justify-between items-center">
                <Button
                    variant="light"
                    size="sm"
                    onPress={() => setShowCcBcc(!showCcBcc)}
                    className="text-xs text-gray-400 hover:text-white"
                >
                    {showCcBcc ? "Hide" : "Show"} Cc/Bcc
                </Button>
            </div>
        </>
    );
};

