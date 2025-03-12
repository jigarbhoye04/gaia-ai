import { IntentType } from "@/types/convoTypes";

export const useIntentParser = () => {
  let finalIntent: IntentType = { intent: undefined, calendar_options: null };

  const parseIntent = (dataJson: any) => {
    if (dataJson?.intent) {
      finalIntent = {
        intent: dataJson.intent,
        calendar_options: Array.isArray(dataJson.calendar_options)
          ? dataJson.calendar_options
          : dataJson.calendar_options
          ? [dataJson.calendar_options]
          : null,
      };
    }
  };

  return { finalIntent, parseIntent };
};
