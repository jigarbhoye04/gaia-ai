import { Tab, Tabs } from "@heroui/react";
import { List, Network } from "lucide-react";
import React, { useEffect, useState } from "react";

import {
  type Memory,
  type MemoryRelation,
} from "@/features/memory/api/memoryApi";
import MemoryGraph from "@/features/memory/components/MemoryGraph";
import MemoryManagement from "@/features/memory/components/MemoryManagement";

const mockMemoriesData = {
  memories: [
    {
      id: "b52208d3-1570-4a9a-8b06-91379b5f0789",
      content:
        "User and his girlfriend met and started their relationship at Tapi Diploma Engineering College in Surat.",
      user_id: "683094592b73305765dbb175",
      metadata: {
        type: "user_message",
        timestamp: "2025-06-20T21:29:46.102979+00:00",
        conversation_id: "06855d2c-6c24-7caa-8000-994c08346752",
      },
      categories: ["family"],
      created_at: "2025-06-20T14:29:52.340670-07:00",
      updated_at: "2025-06-20T14:29:52.360996-07:00",
      expiration_date: null,
      internal_metadata: null,
      deleted_at: null,
      relevance_score: null,
    },
    {
      id: "06c59741-7fb6-4cb9-9b1a-747981b8768a",
      content: "User was born in England but currently lives in Surat.",
      user_id: "683094592b73305765dbb175",
      metadata: {
        type: "user_message",
        timestamp: "2025-06-20T21:27:36.951664+00:00",
        conversation_id: "06855d22-c2e8-79c8-8000-920ebd260b28",
      },
      categories: ["personal_details"],
      created_at: "2025-06-20T14:27:48.452191-07:00",
      updated_at: "2025-06-20T14:27:48.480401-07:00",
      expiration_date: null,
      internal_metadata: null,
      deleted_at: null,
      relevance_score: null,
    },
    {
      id: "f7727295-f991-4df4-b69f-9c8e1d93a527",
      content: "Girlfriend Khyati was born in Surat.",
      user_id: "683094592b73305765dbb175",
      metadata: {
        type: "user_message",
        timestamp: "2025-06-20T21:27:27.592662+00:00",
        conversation_id: "06855d22-c2e8-79c8-8000-920ebd260b28",
      },
      categories: ["personal_details", "family"],
      created_at: "2025-06-20T14:27:32.230815-07:00",
      updated_at: "2025-06-20T14:27:32.302798-07:00",
      expiration_date: null,
      internal_metadata: null,
      deleted_at: null,
      relevance_score: null,
    },
    {
      id: "8c42f15b-9a87-4321-b5d3-42af8e9c1234",
      content:
        "User's girlfriend Khyati works as a software engineer at TechCorp.",
      user_id: "683094592b73305765dbb175",
      metadata: {
        type: "user_message",
        timestamp: "2025-06-20T21:30:15.123456+00:00",
        conversation_id: "06855d2c-6c24-7caa-8000-994c08346752",
      },
      categories: ["professional_details", "family"],
      created_at: "2025-06-20T14:30:20.456789-07:00",
      updated_at: "2025-06-20T14:30:20.456789-07:00",
      expiration_date: null,
      internal_metadata: null,
      deleted_at: null,
      relevance_score: null,
    },
    {
      id: "7d31e24a-8b76-4210-a4c2-31be7f8d2345",
      content: "User studied Computer Science and graduated in 2020.",
      user_id: "683094592b73305765dbb175",
      metadata: {
        type: "user_message",
        timestamp: "2025-06-20T21:31:30.654321+00:00",
        conversation_id: "06855d22-c2e8-79c8-8000-920ebd260b28",
      },
      categories: ["personal_details", "professional_details"],
      created_at: "2025-06-20T14:31:35.789012-07:00",
      updated_at: "2025-06-20T14:31:35.789012-07:00",
      expiration_date: null,
      internal_metadata: null,
      deleted_at: null,
      relevance_score: null,
    },
  ],
  relations: [
    {
      source: "683094592b73305765dbb175",
      source_type: "user",
      relationship: "girlfriend_of",
      target: "khyati",
      target_type: "person",
    },
    {
      source: "683094592b73305765dbb175",
      source_type: "user",
      relationship: "is_in_relationship_with",
      target: "girlfriend",
      target_type: "person",
    },
    {
      source: "tapi_diploma_engineering_college",
      source_type: "educational_institution",
      relationship: "located_in",
      target: "surat",
      target_type: "location",
    },
    {
      source: "683094592b73305765dbb175",
      source_type: "user",
      relationship: "born_in",
      target: "england",
      target_type: "location",
    },
    {
      source: "683094592b73305765dbb175",
      source_type: "user",
      relationship: "attended",
      target: "tapi_diploma_engineering_college",
      target_type: "educational_institution",
    },
    {
      source: "683094592b73305765dbb175",
      source_type: "user",
      relationship: "lives_in",
      target: "surat",
      target_type: "location",
    },
    {
      source: "khyati",
      source_type: "person",
      relationship: "works_at",
      target: "techcorp",
      target_type: "organization",
    },
    {
      source: "khyati",
      source_type: "person",
      relationship: "born_in",
      target: "surat",
      target_type: "location",
    },
    {
      source: "683094592b73305765dbb175",
      source_type: "user",
      relationship: "studied",
      target: "computer_science",
      target_type: "field_of_study",
    },
    {
      source: "683094592b73305765dbb175",
      source_type: "user",
      relationship: "graduated_in",
      target: "2020",
      target_type: "year",
    },
  ],
};

export default function MemoryGraphDemo() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [relations, setRelations] = useState<MemoryRelation[]>([]);
  const [selectedTab, setSelectedTab] = useState("graph");

  useEffect(() => {
    // Load the mock data
    setMemories(mockMemoriesData.memories as Memory[]);
    setRelations(mockMemoriesData.relations as MemoryRelation[]);
  }, []);

  return (
    <div className="h-screen bg-zinc-900 p-8">
      <h1 className="mb-6 text-2xl font-bold text-white">Memory Graph Demo</h1>
      <div className="h-5/6 rounded-lg bg-zinc-800 p-4">
        <Tabs
          selectedKey={selectedTab}
          onSelectionChange={(key) => setSelectedTab(key as string)}
          variant="underlined"
          classNames={{
            tabList:
              "gap-6 w-full relative rounded-none p-0 border-b border-divider",
            cursor: "w-full bg-primary",
            tab: "max-w-fit px-0 h-12",
            tabContent: "group-data-[selected=true]:text-primary",
          }}
        >
          <Tab
            key="graph"
            title={
              <div className="flex items-center gap-2">
                <Network className="h-4 w-4" />
                <span>Graph View</span>
              </div>
            }
          >
            <div className="mt-4 h-[500px] flex-1">
              <MemoryGraph
                memories={memories}
                relations={relations}
                onNodeClick={(node) => {
                  console.log("Node clicked:", node);
                }}
              />
            </div>
          </Tab>
          <Tab
            key="list"
            title={
              <div className="flex items-center gap-2">
                <List className="h-4 w-4" />
                <span>List View</span>
              </div>
            }
          >
            <div className="mt-4 h-[500px] overflow-y-auto">
              <MemoryManagement
                autoFetch={false}
                onFetch={() => {}}
                className="h-full"
              />
            </div>
          </Tab>
        </Tabs>
      </div>
    </div>
  );
}
