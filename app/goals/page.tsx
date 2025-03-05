import { BookIcon1 } from "@/components/Misc/icons";
import { MultiStepLoader } from "@/components/ui/multi-step-loader";

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
import "@xyflow/react/dist/style.css";
import dagre from "dagre";
import { ArrowLeft, Clock, TriangleAlert } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { apiauth } from "@/utils/apiaxios";
import { toast } from "sonner";

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
              ? "!outline-[#00bbff] shadow-lg"
              : "outline-zinc-700"
          } ${
            data.isComplete
              ? "bg-[#00bbff73] outline-[#00bbff30] line-through"
              : "bg-zinc-800"
          } transition-all outline outline-[3px] p-4 rounded-lg text-white flex flex-row gap-1 max-w-[250px] min-w-[250px] text-center items-center justify-center`}
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
  }
);

export default function GoalPage() {
  const [goalData, setGoalData] = useState<GoalData | null>(null);
  const [loading, setLoading] = useState(true);
  const { id: goalId } = useParams();

  const [nodes, setNodes] = useState<Node<NodeData>[]>([]);
  const [edges, setEdges] = useState<Edge<EdgeType>[]>([]);
  const [openSidebar, setOpenSidebar] = useState(false);
  const [currentlySelectedNodeId, setCurrentlySelectedNodeId] = useState<
    string | null
  >(null);

  const nodeTypes = useMemo(
    () => ({
      customNode: (props: any) => (
        <CustomNode
          {...props}
          currentlySelectedNodeId={currentlySelectedNodeId}
          setCurrentlySelectedNodeId={setCurrentlySelectedNodeId}
          setOpenSidebar={setOpenSidebar}
        />
      ),
    }),
    [currentlySelectedNodeId]
  );

  const fetchGoalData = async () => {
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

        setCurrentlySelectedNodeId(updatedNodes[0].id);
        setOpenSidebar(true);
        setEdges(goal.roadmap.edges || []);
      } else {
        console.log("initialising roadmap web socket");
        initiateWebSocket(goalId as string, goal.title);
      }
    } catch (error) {
      console.error("Goal fetch error:", error);
      setGoalData(null);
    }
  };

  const initiateWebSocket = (goalId: string, goalTitle: string) => {
    const ws = new WebSocket(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}ws/roadmap`
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

  useEffect(() => {
    if (goalId) fetchGoalData();
  }, [goalId]);

  const handleInit = (
    reactFlowInstance: ReactFlowInstance<Node<NodeData>, Edge<EdgeType>>
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
      (node) => node.id === currentlySelectedNodeId
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
          : node
      )
    );

    // Update the server state
    try {
      await apiauth.patch(
        `/goals/${selectedNode.data.goalId}/roadmap/nodes/${selectedNode.id}`,
        { is_complete: updatedIsComplete }
      );

      toast.success(
        updatedIsComplete ? "Marked as completed!" : "Marked as not completed!"
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
            : node
        )
      );
    }
  };

  return (
    <ReactFlowProvider>
      <div className="flex flex-row justify-between h-full relative w-full">
        <div
          className={`${
            openSidebar ? "visible" : "hidden"
          } fixed right-3 bottom-3 bg-zinc-800 max-w-[350px] p-2 rounded-xl flex flex-col gap-3 z-10 shadow-lg outline outline-2 outline-zinc-950`}
        >
          <div className="p-4 space-y-2">
            <div className="text-xl font-medium ">
              {currentlySelectedNodeId &&
                nodes.find((node) => node.id === currentlySelectedNodeId)?.data
                  .label}
            </div>
            <div className="text-md -mt-2 text-foreground-600 pb-4">
              {currentlySelectedNodeId &&
                nodes
                  .find((node) => node.id === currentlySelectedNodeId)
                  ?.data?.details?.join(", ")}
            </div>
            <div className="space-y-4">
              {currentlySelectedNodeId &&
                (() => {
                  const selectedNode = nodes.find(
                    (node) => node.id === currentlySelectedNodeId
                  );
                  const estimatedTime = selectedNode?.data?.estimatedTime;

                  return estimatedTime ? (
                    <Chip
                      color="primary"
                      size="lg"
                      startContent={
                        <div className="flex items-center gap-1 text-md">
                          <Clock width={18} />
                          Estimated Time:
                        </div>
                      }
                      variant="flat"
                    >
                      <span className="text-white text-md pl-1">
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
                          (node) => node.id === currentlySelectedNodeId
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
                    (node) => node.id === currentlySelectedNodeId
                  );

                  return (
                    selectedNode?.data?.resources &&
                    selectedNode?.data?.resources?.length > 0 && (
                      <div className="bg-black bg-opacity-40 p-5 rounded-xl">
                        <div className="flex text-md font-medium gap-2 items-center pb-2">
                          <BookIcon1 width={18} />
                          Resources
                        </div>
                        <div className="text-sm">
                          {selectedNode.data.resources.map(
                            (resource, index) => (
                              <a
                                key={index}
                                className="hover:text-[#00bbff] underline underline-offset-4"
                                href={`https://www.google.com/search?q=${resource.split(
                                  "+"
                                )}`}
                                target="__blank"
                              >
                                <li>{resource}</li>
                              </a>
                            )
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
          className={`flex flex-wrap gap-4 justify-center items-center pb-8 h-screen text-background relative flex-row w-full min-w-full ${
            !loading ? "h-fit" : "h-screen"
          }`}
        >
          {loading ? (
            <div className="bg-black w-fit pt-9 pb-0 relative h-fit flex items-center justify-center rounded-xl bg-opacity-50 flex-col gap-10 overflow-hidden ">
              <div className="text-center space-y-2">
                <div className="font-medium text-xl text-foreground">
                  Creating your detailed Roadmap.
                </div>
                {goalData?.title}
                <div className="text-foreground-500 text-medium">
                  Please Wait. This may take a while.
                </div>

                <div className="text-red-500 flex items-center gap-2">
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
              <div className="flex flex-col justify-center items-center w-full">
                <div className="flex flex-row items-center justify-between w-full">
                  <Link href={"/goals"}>
                    <Button
                      className="text-white w-fit gap-1 px-0 font-normal"
                      variant={"link"}
                    >
                      <ArrowLeft width={17} />
                      All Goals
                    </Button>
                  </Link>
                  <div className="font-bold text-white text-2xl mt-1">
                    {goalData?.roadmap?.title || goalData?.title}
                  </div>
                  <div></div>
                </div>
                <div className="text-foreground-500 text-md mt-1 ">
                  {goalData?.roadmap?.description || goalData?.description}
                </div>
              </div>

              <div className="w-full h-full relative">
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
                >
                  {/* <ZoomSlider className="fixed bottom-[25px] !right-[150px]  !left-auto h-fit !top-auto z-30 dark" /> */}
                </ReactFlow>
              </div>
            </>
          )}
        </div>
        <div className="bg-custom-gradient2 left-0 absolute bottom-0 w-full h-[100px] z-[1] pointer-events-none" />
      </div>
    </ReactFlowProvider>
  );
}
