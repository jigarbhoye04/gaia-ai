import { SystemPurpose } from "@/features/chat/api/chatApi";
import { ChatBubbleBotProps } from "@/types/features/chatBubbleTypes";
import { MessageType } from "@/types/features/convoTypes";

/**
 * Check if search results content exists
 */
export const hasSearchResults = (
  search_results?: ChatBubbleBotProps["search_results"],
): boolean => {
  return !!search_results;
};

/**
 * Check if deep search results content exists
 */
export const hasDeepSearchResults = (
  deep_research_results?: ChatBubbleBotProps["deep_research_results"],
): boolean => {
  return !!deep_research_results;
};

/**
 * Check if weather data content exists
 */
export const hasWeatherData = (
  weather_data?: ChatBubbleBotProps["weather_data"],
): boolean => {
  return !!weather_data;
};

/**
 * Check if text bubble should be shown (considering system-generated conversations)
 */
export const shouldShowTextBubble = (
  text: string,
  searchWeb?: boolean,
  deepSearchWeb?: boolean,
  pageFetchURLs?: string[],
  isConvoSystemGenerated?: boolean,
  systemPurpose?: SystemPurpose,
): boolean => {
  // Don't show text bubble when conversation is system generated for mail_processing
  const isEmailProcessingSystem =
    isConvoSystemGenerated && systemPurpose === SystemPurpose.EMAIL_PROCESSING;

  if (isEmailProcessingSystem) {
    return false;
  }

  const hasContent =
    !!searchWeb ||
    !!deepSearchWeb ||
    (!!pageFetchURLs && pageFetchURLs.length > 0) ||
    !!text.trim();

  return hasContent;
};

/**
 * Check if calendar options content exists
 */
export const hasCalendarOptions = (
  calendar_options?: ChatBubbleBotProps["calendar_options"],
): boolean => {
  return !!calendar_options;
};

/**
 * Check if calendar delete options content exists
 */
export const hasCalendarDeleteOptions = (
  calendar_delete_options?: ChatBubbleBotProps["calendar_delete_options"],
): boolean => {
  return !!calendar_delete_options;
};

/**
 * Check if calendar edit options content exists
 */
export const hasCalendarEditOptions = (
  calendar_edit_options?: ChatBubbleBotProps["calendar_edit_options"],
): boolean => {
  return !!calendar_edit_options;
};

/**
 * Check if email compose data content exists
 */
export const hasEmailComposeData = (
  email_compose_data?: ChatBubbleBotProps["email_compose_data"],
): boolean => {
  return !!email_compose_data;
};

/**
 * Check if todo data content exists
 */
export const hasTodoData = (
  todo_data?: ChatBubbleBotProps["todo_data"],
): boolean => {
  return !!todo_data;
};

/**
 * Check if document data content exists
 */
export const hasDocumentData = (
  document_data?: ChatBubbleBotProps["document_data"],
): boolean => {
  return !!document_data;
};

/**
 * Check if Google Docs data content exists
 */
export const hasGoogleDocsData = (
  google_docs_data?: ChatBubbleBotProps["google_docs_data"],
): boolean => {
  return !!google_docs_data;
};

/**
 * Check if goal data content exists
 */
export const hasGoalData = (
  goal_data?: ChatBubbleBotProps["goal_data"],
): boolean => {
  return !!goal_data;
};

/**
 * Check if code execution data content exists
 */
export const hasCodeData = (
  code_data?: ChatBubbleBotProps["code_data"],
): boolean => {
  return !!code_data;
};

/**
 * Check if web search indicators should be shown
 */
export const shouldShowWebSearchIndicator = (
  searchWeb?: boolean,
  search_results?: ChatBubbleBotProps["search_results"],
): boolean => {
  return !!(searchWeb || search_results);
};

/**
 * Check if deep search indicators should be shown
 */
export const shouldShowDeepSearchIndicator = (
  deepSearchWeb?: boolean,
  deep_research_results?: ChatBubbleBotProps["deep_research_results"],
): boolean => {
  return !!(deepSearchWeb || deep_research_results);
};

/**
 * Check if page fetch URLs should be shown
 */
export const shouldShowPageFetchURLs = (pageFetchURLs?: string[]): boolean => {
  return !!(pageFetchURLs && pageFetchURLs.length > 0);
};

/**
 * Check if text content exists
 */
export const hasTextContent = (text: string): boolean => {
  return !!text;
};

/**
 * Check if disclaimer should be shown
 */
export const shouldShowDisclaimer = (disclaimer?: string): boolean => {
  return !!disclaimer;
};

/**
 * Comprehensive check to determine if a bot message has any meaningful content
 */
export const isBotMessageEmpty = (props: ChatBubbleBotProps): boolean => {
  const {
    text,
    searchWeb,
    deepSearchWeb,
    pageFetchURLs,
    disclaimer,
    calendar_options,
    calendar_delete_options,
    calendar_edit_options,
    email_compose_data,
    weather_data,
    todo_data,
    goal_data,
    code_data,
    search_results,
    deep_research_results,
    document_data,
    google_docs_data,
    image_data,
    memory_data,
    isConvoSystemGenerated,
    systemPurpose,
  } = props;

  // Check all possible content types
  const hasAnyContent =
    hasSearchResults(search_results) ||
    hasDeepSearchResults(deep_research_results) ||
    hasWeatherData(weather_data) ||
    shouldShowTextBubble(
      text,
      searchWeb,
      deepSearchWeb,
      pageFetchURLs,
      isConvoSystemGenerated,
      systemPurpose,
    ) ||
    hasCalendarOptions(calendar_options) ||
    hasCalendarDeleteOptions(calendar_delete_options) ||
    hasCalendarEditOptions(calendar_edit_options) ||
    hasEmailComposeData(email_compose_data) ||
    hasTodoData(todo_data) ||
    hasDocumentData(document_data) ||
    hasGoogleDocsData(google_docs_data) ||
    hasGoalData(goal_data) ||
    hasCodeData(code_data) ||
    !!image_data ||
    !!memory_data;

  return !hasAnyContent;
};

/**
 * Check if a message pair (user + bot) should be filtered out
 * This checks if the bot message is completely empty of content
 */
export const shouldFilterMessagePair = (
  userMessage: MessageType,
  botMessage: MessageType,
): boolean => {
  // Only filter if this is actually a bot message
  if (botMessage.type !== "bot") {
    return false;
  }

  // Create a mock ChatBubbleBotProps from MessageType
  const botProps: ChatBubbleBotProps = {
    message_id: botMessage.message_id || "",
    text: botMessage.response || "",
    loading: botMessage.loading,
    searchWeb: botMessage.searchWeb,
    deepSearchWeb: botMessage.deepSearchWeb,
    disclaimer: botMessage.disclaimer,
    date: botMessage.date,
    setOpenImage: () => {}, // Mock function
    setImageData: () => {}, // Mock function
    pageFetchURLs: botMessage.pageFetchURLs,
    pinned: botMessage.pinned,
    calendar_options: botMessage.calendar_options,
    calendar_delete_options: botMessage.calendar_delete_options,
    calendar_edit_options: botMessage.calendar_edit_options,
    email_compose_data: botMessage.email_compose_data,
    weather_data: botMessage.weather_data,
    search_results: botMessage.search_results,
    deep_research_results: botMessage.deep_research_results,
    document_data: botMessage.document_data,
    image_data: botMessage.image_data,
    todo_data: botMessage.todo_data,
    code_data: botMessage.code_data,
    memory_data: botMessage.memory_data,
    goal_data: botMessage.goal_data,
    google_docs_data: botMessage.google_docs_data,
    isConvoSystemGenerated: false, // This will be set by the calling component
    systemPurpose: undefined, // This will be set by the calling component
  };

  return isBotMessageEmpty(botProps);
};

/**
 * Filter out empty message pairs from a conversation
 * This will remove user+bot message pairs where the bot response is completely empty
 */
export const filterEmptyMessagePairs = (
  messages: MessageType[],
  isConvoSystemGenerated: boolean = false,
  systemPurpose?: SystemPurpose,
): MessageType[] => {
  const filteredMessages: MessageType[] = [];

  for (let i = 0; i < messages.length; i++) {
    const currentMessage = messages[i];

    // If this is a user message, check if the next message (bot response) is empty
    if (currentMessage.type === "user" && i + 1 < messages.length) {
      const nextMessage = messages[i + 1];

      if (nextMessage.type === "bot") {
        // Create bot props with conversation context
        const botProps: ChatBubbleBotProps = {
          message_id: nextMessage.message_id || "",
          text: nextMessage.response || "",
          loading: nextMessage.loading,
          searchWeb: nextMessage.searchWeb,
          deepSearchWeb: nextMessage.deepSearchWeb,
          disclaimer: nextMessage.disclaimer,
          date: nextMessage.date,
          setOpenImage: () => {}, // Mock function
          setImageData: () => {}, // Mock function
          pageFetchURLs: nextMessage.pageFetchURLs,
          pinned: nextMessage.pinned,
          calendar_options: nextMessage.calendar_options,
          calendar_delete_options: nextMessage.calendar_delete_options,
          calendar_edit_options: nextMessage.calendar_edit_options,
          email_compose_data: nextMessage.email_compose_data,
          weather_data: nextMessage.weather_data,
          search_results: nextMessage.search_results,
          deep_research_results: nextMessage.deep_research_results,
          document_data: nextMessage.document_data,
          image_data: nextMessage.image_data,
          todo_data: nextMessage.todo_data,
          code_data: nextMessage.code_data,
          memory_data: nextMessage.memory_data,
          goal_data: nextMessage.goal_data,
          google_docs_data: nextMessage.google_docs_data,
          isConvoSystemGenerated,
          systemPurpose,
        };

        // If the bot message is not empty, include both user and bot messages
        if (!isBotMessageEmpty(botProps)) {
          filteredMessages.push(currentMessage);
          filteredMessages.push(nextMessage);
        }
        // If bot message is empty, skip both messages (don't add them to filtered)

        // Skip the next iteration since we've already processed the bot message
        i++;
      } else {
        // If next message is not a bot message, include the current user message
        filteredMessages.push(currentMessage);
      }
    } else if (currentMessage.type === "bot") {
      // Standalone bot message (not part of a pair)
      const botProps: ChatBubbleBotProps = {
        message_id: currentMessage.message_id || "",
        text: currentMessage.response || "",
        loading: currentMessage.loading,
        searchWeb: currentMessage.searchWeb,
        deepSearchWeb: currentMessage.deepSearchWeb,
        disclaimer: currentMessage.disclaimer,
        date: currentMessage.date,
        setOpenImage: () => {}, // Mock function
        setImageData: () => {}, // Mock function
        pageFetchURLs: currentMessage.pageFetchURLs,
        pinned: currentMessage.pinned,
        calendar_options: currentMessage.calendar_options,
        calendar_delete_options: currentMessage.calendar_delete_options,
        calendar_edit_options: currentMessage.calendar_edit_options,
        email_compose_data: currentMessage.email_compose_data,
        weather_data: currentMessage.weather_data,
        search_results: currentMessage.search_results,
        deep_research_results: currentMessage.deep_research_results,
        document_data: currentMessage.document_data,
        image_data: currentMessage.image_data,
        todo_data: currentMessage.todo_data,
        code_data: currentMessage.code_data,
        memory_data: currentMessage.memory_data,
        goal_data: currentMessage.goal_data,
        google_docs_data: currentMessage.google_docs_data,
        isConvoSystemGenerated,
        systemPurpose,
      };

      // Only include if not empty
      if (!isBotMessageEmpty(botProps)) {
        filteredMessages.push(currentMessage);
      }
    } else {
      // Standalone user message
      filteredMessages.push(currentMessage);
    }
  }

  return filteredMessages;
};
