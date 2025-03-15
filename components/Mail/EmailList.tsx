import { FixedSizeList as List } from "react-window";
import InfiniteLoader from "react-window-infinite-loader";
import { EmailData } from "@/types/mailTypes";
import { Row } from "./MailRow";
import { Spinner } from "@heroui/spinner";

type EmailListProps = {
    emails: EmailData[];
    isLoading: boolean;
    hasNextPage: boolean;
    loadMoreItems: (startIndex: number, stopIndex: number) => Promise<void>;
    onEmailSelect: (email: EmailData) => void;
};

export default function EmailList({
    emails,
    isLoading,
    hasNextPage,
    loadMoreItems,
    onEmailSelect,
}: EmailListProps) {
    const isItemLoaded = (index: number) => !hasNextPage || index < emails.length;
    const itemCount = hasNextPage ? emails.length + 1 : emails.length;

    if (isLoading) {
        return <div className="flex justify-center items-center h-full w-full"><Spinner /></div>;
    }

    return (
        <InfiniteLoader
            isItemLoaded={isItemLoaded}
            itemCount={itemCount}
            loadMoreItems={loadMoreItems}
        >
            {({ onItemsRendered, ref }) => (
                <List
                    className="rounded-xl mt-3"
                    height={window.innerHeight - 100}
                    itemCount={itemCount}
                    itemSize={80}
                    onItemsRendered={onItemsRendered}
                    ref={ref}
                    width="100%"
                >
                    {({ index, style }) => (
                        <Row
                            index={index}
                            style={style}
                            data={{ emails, isItemLoaded, openEmail: onEmailSelect }}
                        />
                    )}
                </List>
            )}
        </InfiniteLoader>
    );
}
