import React from "react";
import { Tabs, Tab } from "@heroui/tabs";
import FlowchartPreview from "./FlowchartPreview";
import MermaidCode from "./MermaidCode";

interface MermaidTabsProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (key: string) => void;
  isLoading: boolean;
  syntaxHighlighterProps?: any;
}

const MermaidTabs: React.FC<MermaidTabsProps> = ({
  children,
  activeTab,
  onTabChange,
  isLoading,
  syntaxHighlighterProps,
}) => {
  return (
    <Tabs
      className="px-3"
      disabledKeys={isLoading ? ["editor"] : []}
      selectedKey={activeTab}
      variant="underlined"
      onSelectionChange={(key) => onTabChange(key as string)}
    >
      <Tab key="preview" className="p-0" title="Flowchart">
        <FlowchartPreview>{children}</FlowchartPreview>
      </Tab>
      <Tab key="code" title="Code">
        <MermaidCode syntaxHighlighterProps={syntaxHighlighterProps}>
          {children}
        </MermaidCode>
      </Tab>
    </Tabs>
  );
};

export default MermaidTabs;
