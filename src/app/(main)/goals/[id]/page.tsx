"use client";

import "@xyflow/react/dist/style.css";

import { Checkbox } from "@heroui/checkbox";
import { Chip } from "@heroui/chip";
import {
  ConnectionLineType,
  Edge,
  Handle,
  Node,
  Position,
  ReactFlow,
  ReactFlowInstance,
  ReactFlowProvider,
} from "@xyflow/react";
import dagre from "dagre";
import { ArrowLeft, Clock, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { BookIcon1 } from "@/components/Misc/icons";
import { Button } from "@/components/ui/button";
import { MultiStepLoader } from "@/components/ui/multi-step-loader";
import { truncateTitle } from "@/lib/utils";
import { apiauth } from "@/utils/apiaxios";
export interface GoalData {
  id: string;
  created_at: Date;
  title: string;
  description: string;
  progress: number;
  roadmap: {
    title?: string;
    description?: string;
    nodes?: Array<NodeType>;
    edges?: Array<EdgeType>;
  };
}

export interface EdgeType extends Record<string, unknown> {
  id: string;
  source: string;
  target: string;
}

export interface NodeType {
  id: string;
  position: { x: number; y: number };
  data: NodeData;
}

export interface NodeData extends Record<string, unknown> {
  id: string;
  goalId?: string;
  label: string;
  details: string[];
  estimatedTime: string[];
  resources: string[];
  isComplete: boolean;
}

const CustomNode = React.memo(
  ({
    data,
    currentlySelectedNodeId,
    setCurrentlySelectedNodeId,
    setOpenSidebar,
  }: {
    data: NodeData;
    currentlySelectedNodeId: string | null;
    setCurrentlySelectedNodeId: React.Dispatch<
      React.SetStateAction<string | null>
    >;
    setOpenSidebar: React.Dispatch<React.SetStateAction<boolean>>;
  }) => {
    return (
      <>
        <Handle position={Position.Top} type="target" />

        <div
          className={`${
            currentlySelectedNodeId === data.id
              ? "shadow-lg !outline-[#00bbff]"
              : "outline-zinc-700"
          } ${
            data.isComplete
              ? "bg-[#00bbff73] line-through outline-[#00bbff30]"
              : "bg-zinc-800"
          } flex min-w-[250px] max-w-[250px] flex-row items-center justify-center gap-1 rounded-lg p-4 text-center text-white outline outline-[3px] transition-all`}
          onClick={() => {
            setCurrentlySelectedNodeId(data.id);
            setOpenSidebar(true);
          }}
        >
          {data.label}
        </div>

        <Handle position={Position.Bottom} type="source" />
      </>
    );
  },
);

CustomNode.displayName = "Custom Graph Node";

export default function GoalPage() {
  const [goalData, setGoalData] = useState<GoalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [nodes, setNodes] = useState<Node<NodeData>[]>([]);
  const [edges, setEdges] = useState<Edge<EdgeType>[]>([]);
  const [openSidebar, setOpenSidebar] = useState(false);
  const [currentlySelectedNodeId, setCurrentlySelectedNodeId] = useState<
    string | null
  >(null);
  const { id: goalId } = useParams();

  const nodeTypes = useMemo<{
    customNode: React.FC<{
      data: NodeData;
      currentlySelectedNodeId: string | null;
      setCurrentlySelectedNodeId: React.Dispatch<
        React.SetStateAction<string | null>
      >;
      setOpenSidebar: React.Dispatch<React.SetStateAction<boolean>>;
    }>;
  }>(
    () => ({
      customNode: (props) => (
        <CustomNode
          {...props}
          currentlySelectedNodeId={currentlySelectedNodeId}
          setCurrentlySelectedNodeId={setCurrentlySelectedNodeId}
          setOpenSidebar={setOpenSidebar}
        />
      ),
    }),
    [currentlySelectedNodeId],
  );

  const fetchGoalData = useCallback(async () => {
    try {
      if (!goalId) return;
      setLoading(true);
      const response = await apiauth.get(`/goals/${goalId}`);
      const goal = response.data;
      if (goal?.roadmap) {
        setGoalData(goal);
        setLoading(false);
        const graph = new dagre.graphlib.Graph();
        graph.setGraph({ rankdir: "TD" });
        graph.setDefaultEdgeLabel(() => ({}));
        goal.roadmap.nodes?.forEach((node: NodeType) => {
          graph.setNode(node.id, { width: 350, height: 100 });
        });
        goal.roadmap.edges?.forEach((edge: EdgeType) => {
          graph.setEdge(edge.source, edge.target);
        });
        dagre.layout(graph);
        const updatedNodes = goal.roadmap.nodes?.map((node: NodeType) => {
          const { x, y } = graph.node(node.id);
          return {
            id: node.id,
            position: { x, y },
            type: "customNode",
            data: { ...node.data, id: node.id, goalId: goal.id },
          };
        });
        setNodes(updatedNodes || []);
        setCurrentlySelectedNodeId(updatedNodes[0]?.id);
        setOpenSidebar(true);
        setEdges(goal.roadmap.edges || []);
      } else {
        console.log("initialising roadmap web socket");
        const initiateWebSocket = (goalId: string, goalTitle: string) => {
          const ws = new WebSocket(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}ws/roadmap`,
          );
          ws.onopen = () => {
            ws.send(JSON.stringify({ goal_id: goalId, goal_title: goalTitle }));
            console.log("WebSocket: Generating roadmap...");
          };
          ws.onmessage = (event) => {
            const jsonData = event.data.replace(/^data: /, "");
            const parsedData = JSON.parse(jsonData) || jsonData;
            console.log("Parsed WebSocket response:", parsedData);
          };
          ws.onerror = (error) => console.error("WebSocket error:", error);
          ws.onclose = () => {
            console.log("WebSocket closed.");
            fetchGoalData();
            setLoading(false);
          };
        };
        initiateWebSocket(goalId as string, goal.title);
      }
    } catch (error) {
      console.error("Goal fetch error:", error);
      setGoalData(null);
    }
  }, [goalId]);

  useEffect(() => {
    if (goalId) fetchGoalData();
  }, [goalId, fetchGoalData]);

  const handleInit = (
    reactFlowInstance: ReactFlowInstance<Node<NodeData>, Edge<EdgeType>>,
  ) => {
    const viewport = reactFlowInstance.getViewport();

    reactFlowInstance.setViewport({
      ...viewport,
      x: viewport.x + 75,
      y: -50,
      zoom: 1,
    });
  };

  // if (goalData === null && !loading) return <div>Page Not Found</div>;
  const handleCheckboxClick = async () => {
    if (!currentlySelectedNodeId) return;

    // Find the currently selected node
    const selectedNode = nodes.find(
      (node) => node.id === currentlySelectedNodeId,
    );

    if (!selectedNode) return;

    const updatedIsComplete = !selectedNode.data.isComplete;

    // Optimistically update the node state locally
    setNodes((prevNodes) =>
      prevNodes.map((node) =>
        node.id === currentlySelectedNodeId
          ? {
              ...node,
              data: {
                ...node.data,
                isComplete: updatedIsComplete,
              },
            }
          : node,
      ),
    );

    // Update the server state
    try {
      await apiauth.patch(
        `/goals/${selectedNode.data.goalId}/roadmap/nodes/${selectedNode.id}`,
        { is_complete: updatedIsComplete },
      );

      toast.success(
        updatedIsComplete ? "Marked as completed!" : "Marked as not completed!",
      );
    } catch (error) {
      console.error("Error updating node status:", error);
      toast.error("Could not mark as complete");

      // Revert the change if the update fails
      setNodes((prevNodes) =>
        prevNodes.map((node) =>
          node.id === currentlySelectedNodeId
            ? {
                ...node,
                data: {
                  ...node.data,
                  isComplete: !updatedIsComplete,
                },
              }
            : node,
        ),
      );
    }
  };

  const rawTitle = goalData?.roadmap?.title || goalData?.title || "New Goal";

  const truncatedTitle = useMemo(() => truncateTitle(rawTitle), [rawTitle]);

  return (
    <>
      <title id="chat_title">{`${truncatedTitle || "New Goal"} | GAIA`}</title>

      <ReactFlowProvider>
        <div className="relative flex h-full w-full flex-row justify-between">
          <div
            className={`${
              openSidebar ? "visible" : "hidden"
            } fixed bottom-3 right-3 z-10 flex max-w-[350px] flex-col gap-3 rounded-xl bg-zinc-800 p-2 shadow-lg outline outline-2 outline-zinc-950`}
          >
            <div className="space-y-2 p-4">
              <div className="text-xl font-medium">
                {currentlySelectedNodeId &&
                  nodes.find((node) => node.id === currentlySelectedNodeId)
                    ?.data.label}
              </div>
              <div className="text-md -mt-2 pb-4 text-foreground-600">
                {currentlySelectedNodeId &&
                  nodes
                    .find((node) => node.id === currentlySelectedNodeId)
                    ?.data?.details?.join(", ")}
              </div>
              <div className="space-y-4">
                {currentlySelectedNodeId &&
                  (() => {
                    const selectedNode = nodes.find(
                      (node) => node.id === currentlySelectedNodeId,
                    );
                    const estimatedTime = selectedNode?.data?.estimatedTime;

                    return estimatedTime ? (
                      <Chip
                        color="primary"
                        size="lg"
                        startContent={
                          <div className="text-md flex items-center gap-1">
                            <Clock width={18} />
                            Estimated Time:
                          </div>
                        }
                        variant="flat"
                      >
                        <span className="text-md pl-1 text-white">
                          {estimatedTime}
                        </span>
                      </Chip>
                    ) : null;
                  })()}

                {currentlySelectedNodeId && (
                  <Chip
                    color="success"
                    size="lg"
                    startContent={
                      <Checkbox
                        isSelected={
                          nodes.find(
                            (node) => node.id === currentlySelectedNodeId,
                          )?.data?.isComplete ?? false
                        }
                        onValueChange={handleCheckboxClick}
                        color="success"
                        // lineThrough
                        radius="full"
                      >
                        Mark as Complete
                      </Checkbox>
                    }
                    variant="flat"
                  />
                )}
              </div>
            </div>
            <div>
              {currentlySelectedNodeId && (
                <>
                  {(() => {
                    const selectedNode = nodes.find(
                      (node) => node.id === currentlySelectedNodeId,
                    );

                    return (
                      selectedNode?.data?.resources &&
                      selectedNode?.data?.resources?.length > 0 && (
                        <div className="rounded-xl bg-black bg-opacity-40 p-5">
                          <div className="text-md flex items-center gap-2 pb-2 font-medium">
                            <BookIcon1 width={18} />
                            Resources
                          </div>
                          <div className="text-sm">
                            {selectedNode.data.resources.map(
                              (resource, index) => (
                                <a
                                  key={index}
                                  className="underline underline-offset-4 hover:text-[#00bbff]"
                                  href={`https://www.google.com/search?q=${resource.split(
                                    "+",
                                  )}`}
                                  target="__blank"
                                >
                                  <li>{resource}</li>
                                </a>
                              ),
                            )}
                          </div>
                        </div>
                      )
                    );
                  })()}
                </>
              )}
            </div>
          </div>

          <div
            className={`relative flex h-screen w-full min-w-full flex-row flex-wrap items-center justify-center gap-4 pb-8 text-background ${
              loading ? "h-screen" : "h-fit"
            }`}
          >
            {loading ? (
              <div className="relative flex h-fit w-fit flex-col items-center justify-center gap-10 overflow-hidden rounded-xl bg-black bg-opacity-50 pb-0 pt-9">
                <div className="space-y-2 text-center">
                  <div className="text-xl font-medium text-foreground">
                    Creating your detailed Roadmap.
                  </div>
                  {goalData?.title}
                  <div className="text-medium text-foreground-500">
                    Please Wait. This may take a while.
                  </div>

                  <div className="flex items-center gap-2 text-red-500">
                    <TriangleAlert width={17} />
                    Do not leave this page while the roadmap is being generated.
                  </div>
                </div>
                <div className="px-32">
                  <MultiStepLoader
                    duration={4500}
                    loading={true}
                    loadingStates={[
                      { text: "Setting your goal... Let's get started!" },
                      { text: "Exploring your objectives... Almost there!" },
                      { text: "Adding some details to your vision..." },
                      { text: "Creating milestones to guide you..." },
                      { text: "Building your personalized roadmap..." },
                      { text: "Placing the first pieces of the puzzle..." },
                      {
                        text: "Connecting the dots... Things are coming together!",
                      },
                      { text: "Gathering the resources you’ll need..." },
                      { text: "Estimating time... Getting a clearer picture!" },
                      { text: "Putting the final touches on your plan..." },
                    ]}
                    loop={false}
                  />
                </div>
              </div>
            ) : (
              <>
                <div className="flex w-full flex-col items-center justify-center">
                  <div className="flex w-full flex-row items-center justify-between">
                    <Link href={"/goals"}>
                      <Button
                        className="w-fit gap-1 font-normal text-white"
                        variant={"ghost"}
                      >
                        <ArrowLeft width={17} />
                        All Goals
                      </Button>
                    </Link>
                    <div className="mt-1 text-2xl font-bold text-white">
                      {goalData?.roadmap?.title || goalData?.title}
                    </div>
                    <div></div>
                  </div>
                  <div className="text-md mt-1 text-foreground-500">
                    {goalData?.roadmap?.description || goalData?.description}
                  </div>
                </div>

                <div className="relative h-full w-full">
                  <ReactFlow
                    fitView
                    className="relative"
                    connectionLineType={ConnectionLineType.SmoothStep}
                    edges={edges}
                    elementsSelectable={true}
                    fitViewOptions={{ minZoom: 1.2 }}
                    minZoom={0.2}
                    // nodeTypes={nodeTypes}
                    nodes={nodes}
                    nodesConnectable={false}
                    nodesDraggable={false}
                    style={{ background: "transparent" }}
                    onInit={handleInit}
                  >
                    {/* <ZoomSlider className="fixed bottom-[25px] !right-[150px]  !left-auto h-fit !top-auto z-30 dark" /> */}
                  </ReactFlow>
                </div>
              </>
            )}
          </div>
          <div className="bg-custom-gradient2 pointer-events-none absolute bottom-0 left-0 z-[1] h-[100px] w-full" />
        </div>
      </ReactFlowProvider>
    </>
  );
}
