import { Button as ShadcnButton } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { BrushIcon, Check, ChevronDown } from "lucide-react";

interface WritingStyleDropdownProps {
    writingStyle: string;
    setWritingStyle: (style: string) => void;
    handleAskGaia: (style: string) => void;
}

const writingStyles = [
    { id: "formal", label: "Formal" },
    { id: "friendly", label: "Friendly" },
    { id: "casual", label: "Casual" },
    { id: "persuasive", label: "Persuasive" },
    { id: "humorous", label: "Humorous" },
];

export const WritingStyleDropdown = ({
    writingStyle,
    setWritingStyle,
    handleAskGaia,
}: WritingStyleDropdownProps): JSX.Element => {
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
                            <span className="font-medium">Tone:</span>{" "}
                            <span>{writingStyles.find((s) => s.id === writingStyle)?.label}</span>
                            <ChevronDown color={undefined} width={20} />
                        </div>
                    </ShadcnButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="dark bg-zinc-900 border-none text-white">
                    {writingStyles.map((style) => (
                        <DropdownMenuItem
                            key={style.id}
                            onClick={() => {
                                setWritingStyle(style.id);
                                handleAskGaia(style.id);
                            }}
                            className="cursor-pointer focus:bg-zinc-600 focus:text-white"
                        >
                            <div className="flex justify-between w-full items-center">
                                {style.label}
                                {style.id === writingStyle && <Check className="h-4 w-4" />}
                            </div>
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}; 