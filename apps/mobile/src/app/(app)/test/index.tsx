import { View, ScrollView } from "react-native";
import { StyledSafeAreaView } from "@/lib/uniwind";
import {
  EmailAccordion,
  SAMPLE_EMAILS,
  EmailComposeCard,
  SAMPLE_EMAIL_COMPOSE,
} from "@/features/chat";
import { Text } from "@/components/ui/text";

export default function Test() {
  return (
    <StyledSafeAreaView className="flex-1 bg-background">
      <ScrollView className="flex-1">
        <View className="py-4">
          <Text className="text-lg font-semibold px-4 mb-4">
            Email Accordion Test
          </Text>
          <EmailAccordion emails={SAMPLE_EMAILS} />
        </View>

        <View className="py-4">
          <Text className="text-lg font-semibold px-4 mb-4">
            Email Compose Card
          </Text>
          <EmailComposeCard data={SAMPLE_EMAIL_COMPOSE} />
        </View>
      </ScrollView>
    </StyledSafeAreaView>
  );
}
