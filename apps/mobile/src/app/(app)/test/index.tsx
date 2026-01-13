import { ScrollView, View, Button, Platform } from "react-native";
import { Text } from "@/components/ui/text";
import {
  EmailAccordion,
  EmailComposeCard,
  SAMPLE_EMAIL_COMPOSE,
  SAMPLE_EMAILS,
} from "@/features/chat";
import { StyledSafeAreaView } from "@/lib/uniwind";
import { useNotificationContext } from "@/features/notifications/components/notification-provider";
import * as Notifications from "expo-notifications";
import { NotificationCard } from "@/features/chat";

export default function Test() {
  const { expoPushToken, notification, error, isRegistered, isLoading } =
    useNotificationContext();

  const sendTestNotification = async () => {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Test Notification",
          body: "This is a local test notification",
          sound: "default",
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: 2,
          repeats: false,
        },
      });
    } catch (err) {
      console.error("Failed to schedule notification:", err);
    }
  };

  const notificationData = {
    notifications: notification
      ? [
          {
            title: notification.request.content.title ?? undefined,
            body: notification.request.content.body ?? undefined,
            type: "local",
          },
        ]
      : [],
  };

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

        <View className="py-4 px-4 border-t border-gray-700">
          <Text className="text-lg font-semibold mb-2">Notification Test</Text>

          <Button
            title="Send Local Notification"
            onPress={sendTestNotification}
          />

          <View className="mt-4">
            {isLoading ? (
              <Text>Loading notification info...</Text>
            ) : error ? (
              <Text>Error: {error}</Text>
            ) : (
              <>
                <Text>Push Token: {expoPushToken ?? "Not available"}</Text>
                <Text>Registered: {isRegistered ? "Yes" : "No"}</Text>

                {/* Use your existing NotificationCard */}
                <NotificationCard data={notificationData} />
              </>
            )}
          </View>
        </View>
      </ScrollView>
    </StyledSafeAreaView>
  );
}
