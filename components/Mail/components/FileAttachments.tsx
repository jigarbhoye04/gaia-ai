import { Button } from "@heroui/button";
import { X } from "lucide-react";
import { getFileIcon } from "../utils/fileUtils";

interface FileAttachmentsProps {
    attachments: File[];
    onRemove: (index: number) => void;
}

/**
 * Displays a list of file attachments with their icons, names, sizes and remove button
 */
export const FileAttachments = ({ attachments, onRemove }: FileAttachmentsProps): JSX.Element | null => {
    if (attachments.length === 0) return null;

    return (
        <div className="bg-zinc-800 p-3 mt-2 rounded-md">
            <h3 className="text-sm text-gray-300 wmb-2">Attachments ({attachments.length})</h3>
            <div className="flex flex-wrap gap-2">
                {attachments.map((file, index) => (
                    <div key={index} className="bg-zinc-700 rounded-md py-1 px-2 flex items-center gap-2 max-w-[250px]">
                        <div className="flex-shrink-0">
                            {getFileIcon(file.name)}
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between">
                                <span className="text-xs truncate font-medium block">{file.name}</span>
                            </div>
                            <span className="text-xs text-gray-400">
                                {(file.size / 1024).toFixed(0)} KB
                            </span>
                        </div>
                        <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            onPress={() => onRemove(index)}
                            className="text-gray-400 hover:text-white p-0 min-w-0 h-auto bg-transparent flex-shrink-0"
                        >
                            <X size={14} />
                        </Button>
                    </div>
                ))}
            </div>
        </div>
    );
};

