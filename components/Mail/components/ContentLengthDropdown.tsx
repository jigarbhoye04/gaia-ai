import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button as ShadcnButton } from "@/components/ui/button";
import { BrushIcon, Check, ChevronDown } from "lucide-react";
import { useState } from "react";

interface ContentLengthDropdownProps {
    contentLength: string;
    setContentLength: (length: string) => void;
    handleAskGaia: () => void;
}

const contentLengthOptions = [
    { id: "none", label: "None" },
    { id: "shorten", label: "Shorten" },
    { id: "lengthen", label: "Lengthen" },
    { id: "summarize", label: "Summarize" },
];

export const ContentLengthDropdown = ({
    contentLength,
    setContentLength,
    handleAskGaia,
}: ContentLengthDropdownProps): JSX.Element => {
    return (
        <div className="relative">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <ShadcnButton
                        className="font-normal text-sm text-[#00bbff] bg-[#00bbff40] hover:bg-[#00bbff20] outline-none border-none ring-0"
                        size="sm"
                    >
                        <div className="flex flex-row gap-1">
                            <BrushIcon color={undefined} width={20} height={20} />
                            <span className="font-medium">Content Length:</span>{" "}
                            <span>{contentLengthOptions.find((opt) => opt.id === contentLength)?.label || "None"}</span>
                            <ChevronDown color={undefined} width={20} />
                        </div>
                    </ShadcnButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="dark bg-zinc-900 border-none text-white">
                    {contentLengthOptions.map((opt) => (
                        <DropdownMenuItem
                            key={opt.id}
                            onClick={() => {
                                setContentLength(opt.id);
                                handleAskGaia();
                            }}
                            className="cursor-pointer focus:bg-zinc-600 focus:text-white"
                        >
                            <div className="flex justify-between w-full items-center">
                                {opt.label}
                                {opt.id === contentLength && <Check className="h-4 w-4" />}
                            </div>
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}; 