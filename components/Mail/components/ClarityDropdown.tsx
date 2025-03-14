import { Button as ShadcnButton } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { BrushIcon, Check, ChevronDown } from "lucide-react";

interface ClarityDropdownProps {
    clarityOption: string;
    setClarityOption: (option: string) => void;
    handleAskGaia: () => void;
}

const clarityOptions = [
    { id: "none", label: "None" },
    { id: "simplify", label: "Simplify" },
    { id: "rephrase", label: "Rephrase" },
];

export const ClarityDropdown = ({
    clarityOption,
    setClarityOption,
    handleAskGaia,
}: ClarityDropdownProps): JSX.Element => {
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
                            <span className="font-medium">Clarity:</span>{" "}
                            <span>{clarityOptions.find((opt) => opt.id === clarityOption)?.label}</span>
                            <ChevronDown color={undefined} width={20} />
                        </div>
                    </ShadcnButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="dark bg-zinc-900 border-none text-white">
                    {clarityOptions.map((opt) => (
                        <DropdownMenuItem
                            key={opt.id}
                            onClick={() => {
                                setClarityOption(opt.id);
                                handleAskGaia();
                            }}
                            className="cursor-pointer focus:bg-zinc-600 focus:text-white"
                        >
                            <div className="flex justify-between w-full items-center">
                                {opt.label}
                                {opt.id === clarityOption && <Check className="h-4 w-4" />}
                            </div>
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
};
