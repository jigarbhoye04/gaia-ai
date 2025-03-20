import {
  ConnectionLineType,
  Edge,
  Node,
  ReactFlow,
  ReactFlowInstance,
} from "@xyflow/react";
import React from "react";

import { EdgeType, NodeData } from "@/types/goalTypes";

interface NodeTypes {
  [key: string]: React.ComponentType<{
    data: NodeData;
    [key: string]: unknown;
  }>;
}

interface GoalGraphProps {
  nodes: Node<NodeData>[];
  edges: Edge<EdgeType>[];
  nodeTypes: NodeTypes;
  handleInit: (
    reactFlowInstance: ReactFlowInstance<Node<NodeData>, Edge<EdgeType>>,
  ) => void;
}

const GoalGraph: React.FC<GoalGraphProps> = ({
  nodes,
  edges,
  nodeTypes,
  handleInit,
}) => {
  return (
    <ReactFlow
      fitView
      className="relative"
      connectionLineType={ConnectionLineType.SmoothStep}
      edges={edges}
      elementsSelectable={true}
      fitViewOptions={{ minZoom: 1.2 }}
      minZoom={0.2}
      nodeTypes={nodeTypes}
      nodes={nodes}
      nodesConnectable={false}
      nodesDraggable={false}
      style={{ background: "transparent" }}
      onInit={handleInit}
    />
  );
};

export default GoalGraph;
