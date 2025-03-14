import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import { SentIcon } from "@/components/Misc/icons";
import { useState } from "react";

interface AIDraftInputProps {
    prompt: string;
    setPrompt: (prompt: string) => void;
    handleAskGaia: () => void;
    loading: boolean;
}

export const AIDraftInput = ({
    prompt,
    setPrompt,
    handleAskGaia,
    loading,
}: AIDraftInputProps): JSX.Element => {
    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (loading) return;
        if (e.key === "Enter") {
            e.preventDefault();
            handleAskGaia();
        }
    };

    return (
        <div className="flex gap-3">
            <Input
                placeholder="What is the email about?"
                radius="full"
                classNames={{ inputWrapper: "pr-1 pl-0" }}
                className="pr-1"
                variant="faded"
                size="lg"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={handleKeyPress}
                startContent={<div className="pingspinner size-[20px]" />}
                endContent={
                    <Button
                        isIconOnly={loading}
                        color="primary"
                        radius="full"
                        onPress={handleAskGaia}
                        isLoading={loading}
                    >
                        <div className="flex w-fit px-14 gap-2 items-center text-medium">
                            {!loading && (
                                <>
                                    AI Compose
                                    <SentIcon
                                        color={undefined}
                                        width={25}
                                        className="min-w-[25px]"
                                    />
                                </>
                            )}
                        </div>
                    </Button>
                }
            />
        </div>
    );
}; 