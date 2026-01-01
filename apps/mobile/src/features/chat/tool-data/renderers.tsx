import React from "react";
import { View } from "react-native";
import { Text } from "@/components/ui/text";
import { Card } from "heroui-native";

import { EmailComposeCard } from "../components/chat/email-compose-card";
import {
  EmailSentCard,
  EmailThreadCard,
  EmailFetchCard,
  CalendarOptionsCard,
  CalendarFetchCard,
  CalendarDeleteCard,
  CalendarEditCard,
  WeatherCard,
  SearchResultsCard,
  DeepResearchCard,
  ContactListCard,
  PeopleSearchCard,
  SupportTicketCard,
  NotificationCard,
  TodoCard,
  GoalCard,
  DocumentCard,
  GoogleDocsCard,
  CodeExecutionCard,
  IntegrationConnectionCard,
  RedditCard,
} from "./tool-cards";
import type { ToolDataEntry, EmailComposeData } from "./registry";

function UnsupportedToolCard({
  toolName,
  index,
}: {
  toolName: string;
  index: number;
}) {
  const displayName = toolName
    .replace(/_data$/, "")
    .replace(/_options$/, "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase());

  return (
    <Card
      key={`unsupported-${toolName}-${index}`}
      variant="secondary"
      className="mx-4 my-2 rounded-xl"
    >
      <Card.Body className="py-3 px-4">
        <Text className="text-muted text-sm">{displayName} result</Text>
      </Card.Body>
    </Card>
  );
}

const TOOL_RENDERERS: Record<
  string,
  (data: unknown, baseKey: string) => React.ReactNode
> = {
  email_compose_data: (data, baseKey) => {
    const emails = (Array.isArray(data) ? data : [data]) as EmailComposeData[];
    return (
      <React.Fragment key={baseKey}>
        {emails.map((email, i) => (
          <EmailComposeCard key={`${baseKey}-${i}`} data={email} />
        ))}
      </React.Fragment>
    );
  },

  email_sent_data: (data, baseKey) => {
    const emails = Array.isArray(data) ? data : [data];
    return (
      <React.Fragment key={baseKey}>
        {emails.map((email, i) => (
          <EmailSentCard key={`${baseKey}-${i}`} data={email} />
        ))}
      </React.Fragment>
    );
  },

  email_thread_data: (data, baseKey) => (
    <EmailThreadCard key={baseKey} data={data as any} />
  ),

  email_fetch_data: (data, baseKey) => {
    const emails = Array.isArray(data) ? data : [data];
    return <EmailFetchCard key={baseKey} data={emails as any} />;
  },

  calendar_options: (data, baseKey) => {
    const events = Array.isArray(data) ? data : [data];
    return <CalendarOptionsCard key={baseKey} data={events as any} />;
  },

  calendar_fetch_data: (data, baseKey) => {
    const events = Array.isArray(data) ? data : [data];
    return <CalendarFetchCard key={baseKey} data={events as any} />;
  },

  calendar_delete_options: (data, baseKey) => {
    const events = Array.isArray(data) ? data : [data];
    return <CalendarDeleteCard key={baseKey} data={events as any} />;
  },

  calendar_edit_options: (data, baseKey) => {
    const events = Array.isArray(data) ? data : [data];
    return <CalendarEditCard key={baseKey} data={events as any} />;
  },

  calendar_list_fetch_data: (data, baseKey) => {
    const calendars = Array.isArray(data) ? data : [data];
    return <CalendarFetchCard key={baseKey} data={calendars as any} />;
  },

  weather_data: (data, baseKey) => (
    <WeatherCard key={baseKey} data={data as any} />
  ),

  search_results: (data, baseKey) => (
    <SearchResultsCard key={baseKey} data={data as any} />
  ),

  deep_research_results: (data, baseKey) => (
    <DeepResearchCard key={baseKey} data={data as any} />
  ),

  contacts_data: (data, baseKey) => {
    const contacts = Array.isArray(data) ? data : [data];
    return <ContactListCard key={baseKey} data={contacts as any} />;
  },

  people_search_data: (data, baseKey) => {
    const people = Array.isArray(data) ? data : [data];
    return <PeopleSearchCard key={baseKey} data={people as any} />;
  },

  support_ticket_data: (data, baseKey) => {
    const tickets = Array.isArray(data) ? data : [data];
    return (
      <React.Fragment key={baseKey}>
        {tickets.map((ticket, i) => (
          <SupportTicketCard key={`${baseKey}-${i}`} data={ticket as any} />
        ))}
      </React.Fragment>
    );
  },

  notification_data: (data, baseKey) => (
    <NotificationCard key={baseKey} data={data as any} />
  ),

  todo_data: (data, baseKey) => <TodoCard key={baseKey} data={data as any} />,

  goal_data: (data, baseKey) => <GoalCard key={baseKey} data={data as any} />,

  document_data: (data, baseKey) => (
    <DocumentCard key={baseKey} data={data as any} />
  ),

  google_docs_data: (data, baseKey) => (
    <GoogleDocsCard key={baseKey} data={data as any} />
  ),

  code_data: (data, baseKey) => (
    <CodeExecutionCard key={baseKey} data={data as any} />
  ),

  integration_connection_required: (data, baseKey) => (
    <IntegrationConnectionCard key={baseKey} data={data as any} />
  ),

  integration_list_data: (_data, baseKey) => (
    <Card key={baseKey} variant="secondary" className="mx-4 my-2 rounded-xl">
      <Card.Body className="py-3 px-4">
        <Text className="text-foreground text-sm">Available Integrations</Text>
      </Card.Body>
    </Card>
  ),

  reddit_data: (data, baseKey) => {
    const items = Array.isArray(data) ? data : [data];
    return (
      <React.Fragment key={baseKey}>
        {items.map((item, i) => (
          <RedditCard key={`${baseKey}-${i}`} data={item as any} />
        ))}
      </React.Fragment>
    );
  },

  memory_data: (_data, baseKey) => (
    <Card key={baseKey} variant="secondary" className="mx-4 my-2 rounded-xl">
      <Card.Body className="py-3 px-4">
        <Text className="text-xs text-muted mb-1">Memory</Text>
        <Text className="text-foreground text-sm">Memory updated</Text>
      </Card.Body>
    </Card>
  ),
};

interface ToolDataRendererProps {
  toolData?: ToolDataEntry[];
}

export function ToolDataRenderer({ toolData }: ToolDataRendererProps) {
  if (!toolData || toolData.length === 0) {
    return null;
  }

  return (
    <View className="flex-col">
      {toolData.map((entry, index) => {
        const toolName = entry.tool_name;
        const renderer = TOOL_RENDERERS[toolName];
        const baseKey = `tool-${toolName}-${entry.timestamp || index}`;

        if (renderer) {
          return renderer(entry.data, baseKey);
        }

        return (
          <UnsupportedToolCard
            key={baseKey}
            toolName={toolName}
            index={index}
          />
        );
      })}
    </View>
  );
}

export { TOOL_RENDERERS };
