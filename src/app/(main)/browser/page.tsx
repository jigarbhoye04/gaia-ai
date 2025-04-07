"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar } from "@heroui/avatar";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Input } from "@heroui/input";
import { Tooltip } from "@heroui/tooltip";
import { ResetIcon } from "@radix-ui/react-icons";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Brain,
  CircleArrowRight,
  Globe,
  Layout,
  Loader,
  Plug,
  RefreshCw,
  SendIcon,
  X,
  Zap,
} from "lucide-react";
import Image from "next/image";
import { ChangeEvent, KeyboardEvent, useEffect, useRef, useState } from "react";

interface Thoughts {
  evaluation?: string;
  memory?: string;
  next_goal?: string;
  evaluation_previous_goal?: string;
}

interface Action {
  navigate?: { url: string };
  click?: { selector: string };
  done?: { text: string; success: boolean };
  search_google?: { query: string };
  go_to_url?: { url: string };
  [key: string]: any;
}

interface StepData {
  step: number;
  thoughts?: Thoughts;
  actions?: Action[];
  url?: string;
  title?: string;
  screenshot?: string;
  screenshot_url?: string;

  data?: {
    step: number;
    thoughts: Thoughts;
    actions: Action[];
    url: string;
    title: string;
    screenshot_url?: string;
  };
}

interface TaskResult {
  history: Array<{
    model_output: {
      current_state: {
        evaluation_previous_goal?: string;
        memory?: string;
        next_goal?: string;
      };
      action: Action[];
    };
    result: Array<{
      is_done: boolean;
      success?: boolean;
      extracted_content?: string;
      include_in_memory?: boolean;
    }>;
    state: {
      tabs: Array<{
        page_id: number;
        url: string;
        title: string;
      }>;
      screenshot?: string;
      interacted_element: any[];
      url: string;
      title: string;
    };
    metadata: {
      step_start_time: number;
      step_end_time: number;
      input_tokens: number;
      step_number: number;
    };
  }>;
  session_id: string;
  screenshots?: string[];
}

type MessageRole = "user" | "assistant" | "system";

interface Message {
  role: MessageRole;
  content: string;
  stepData?: StepData;
}

const BrowserSidebar = ({
  isOpen,
  onToggle,
  steps,
  currentStepIndex,
  setCurrentStepIndex,
}: {
  isOpen: boolean;
  onToggle: () => void;
  steps: Message[];
  currentStepIndex: number;
  setCurrentStepIndex: (index: number) => void;
}) => {
  const validSteps = steps.filter(
    (step) =>
      step.role === "assistant" &&
      step.stepData &&
      (step.stepData.url || step.stepData.thoughts || step.stepData.actions),
  );

  // Update current step whenever valid steps change to show the latest step
  useEffect(() => {
    if (validSteps.length > 0) {
      setCurrentStepIndex(validSteps.length - 1);
    }
  }, [validSteps.length, setCurrentStepIndex]);

  const currentStep = validSteps[currentStepIndex];

  const goToPreviousStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  const goToNextStep = () => {
    if (currentStepIndex < validSteps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    }
  };

  if (!currentStep || validSteps.length === 0) {
    return null;
  }

  return (
    <div
      className={`relative h-full flex-shrink-0 overflow-hidden rounded-2xl border-l border-zinc-800 bg-zinc-900 shadow-xl transition-all duration-300 ease-in-out ${
        isOpen ? "w-[40vw]" : "w-0"
      }`}
    >
      {/* Toggle button for sidebar */}
      <button
        onClick={onToggle}
        className="absolute -left-12 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-l-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
      >
        {isOpen ? <ArrowRight size={20} /> : <ArrowLeft size={20} />}
      </button>

      {/* Sidebar Content */}
      <div className="flex h-full flex-col overflow-hidden">
        {/* Header */}
        <div className="flex w-full items-center justify-between gap-3 border-b border-zinc-800 bg-zinc-900 p-4">
          <div className="grid w-full grid-cols-[auto_1fr] items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="text-sm text-zinc-300">
                Step {currentStepIndex + 1} of {validSteps.length}
              </div>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
              <div
                className="h-full bg-primary transition-all duration-300 ease-in-out"
                style={{
                  width: `${((currentStepIndex + 1) / validSteps.length) * 100}%`,
                }}
              />
            </div>
          </div>

          <Button
            isIconOnly
            size="sm"
            variant="light"
            className="rounded-full"
            onPress={onToggle}
          >
            <X size={18} />
          </Button>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1">
          <div className="space-y-2 p-4">
            {/* URL display */}
            {currentStep.stepData?.url && (
              <div className="flex items-center gap-2 rounded-lg text-sm">
                <Button
                  size="sm"
                  variant="flat"
                  as="a"
                  href={currentStep.stepData.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {currentStep.stepData.url}

                  <ArrowUpRight className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Screenshot display */}
            {(currentStep.stepData?.screenshot_url ||
              currentStep.stepData?.screenshot) && (
              <div className="relative overflow-hidden rounded-lg border border-zinc-700">
                <div className="absolute right-2 top-2 z-10">
                  <Chip size="sm" color="primary" variant="flat" radius="full">
                    Screenshot
                  </Chip>
                </div>
                <Image
                  src={
                    (currentStep.stepData.screenshot_url ||
                      currentStep.stepData.screenshot) as string
                  }
                  alt={`Screenshot of step ${currentStep.stepData.step}`}
                  width={800}
                  height={600}
                  className="w-full rounded-lg object-cover"
                  unoptimized
                />
              </div>
            )}

            {/* AI thoughts */}
            {currentStep.stepData?.thoughts && (
              <div className="space-y-3 rounded-lg bg-zinc-800 p-4">
                <div className="mb-1 flex items-center gap-2 border-b border-zinc-700 pb-2 text-zinc-300">
                  <Brain className="h-5 w-5 text-indigo-400" />
                  <div className="font-medium">AI Analysis</div>
                </div>

                {/* Evaluation or Previous Goal Evaluation */}
                {(currentStep.stepData.thoughts.evaluation ||
                  currentStep.stepData.thoughts.evaluation_previous_goal) && (
                  <div className="space-y-1">
                    <div className="text-sm font-medium text-primary">
                      Evaluation:
                    </div>
                    <div className="text-sm text-zinc-300">
                      {currentStep.stepData.thoughts.evaluation ||
                        currentStep.stepData.thoughts.evaluation_previous_goal}
                    </div>
                  </div>
                )}

                {/* Memory */}
                {currentStep.stepData.thoughts.memory && (
                  <div className="space-y-1">
                    <div className="text-sm font-medium text-blue-400">
                      Memory:
                    </div>
                    <div className="text-sm text-zinc-300">
                      {currentStep.stepData.thoughts.memory}
                    </div>
                  </div>
                )}

                {/* Next Goal */}
                {currentStep.stepData.thoughts.next_goal && (
                  <div className="space-y-1">
                    <div className="text-sm font-medium text-green-400">
                      Next Goal:
                    </div>
                    <div className="text-sm text-zinc-300">
                      {currentStep.stepData.thoughts.next_goal}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            {currentStep.stepData?.actions &&
              currentStep.stepData.actions.length > 0 && (
                <div className="space-y-3 rounded-lg bg-zinc-800 p-4">
                  <div className="mb-1 flex items-center gap-2 border-b border-zinc-700 pb-2 text-zinc-300">
                    <Zap className="h-5 w-5 text-yellow-400" />
                    <div className="font-medium">Actions Taken</div>
                  </div>
                  <ul className="space-y-2">
                    {currentStep.stepData.actions.map((action, index) => (
                      <li
                        key={index}
                        className="flex items-center gap-2 rounded-md bg-zinc-700/60 p-2 text-sm"
                      >
                        {action.navigate && (
                          <>
                            <ArrowUpRight className="h-4 w-4 flex-shrink-0 text-blue-400" />
                            <span>Navigate to: </span>
                            <span className="truncate text-blue-400 underline">
                              {action.navigate.url}
                            </span>
                          </>
                        )}
                        {action.click && (
                          <>
                            <div className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border border-zinc-500 text-[10px]">
                              C
                            </div>
                            <span>Click: </span>
                            <code className="rounded bg-zinc-600 px-1 py-0.5 text-xs">
                              {action.click.selector}
                            </code>
                          </>
                        )}
                        {action.search_google && (
                          <>
                            <Globe className="h-4 w-4 flex-shrink-0 text-blue-400" />
                            <span>Search: </span>
                            <span className="italic">
                              "{action.search_google.query}"
                            </span>
                          </>
                        )}
                        {action.go_to_url && (
                          <>
                            <ArrowUpRight className="h-4 w-4 flex-shrink-0 text-blue-400" />
                            <span>Go to URL: </span>
                            <span className="truncate text-blue-400 underline">
                              {action.go_to_url.url}
                            </span>
                          </>
                        )}
                        {action.done && (
                          <>
                            <span className="flex-shrink-0 text-green-400">
                              ✓
                            </span>
                            <span>{action.done.text}</span>
                          </>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
          </div>
        </ScrollArea>

        {/* Navigation footer */}
        <div className="border-t border-zinc-800 bg-zinc-900 p-4">
          <div className="flex justify-between">
            <Button
              variant="flat"
              onPress={goToPreviousStep}
              isDisabled={currentStepIndex === 0}
              startContent={<ArrowLeft className="h-4 w-4" />}
              size="sm"
            >
              Previous
            </Button>
            <Button
              variant="flat"
              onPress={goToNextStep}
              isDisabled={currentStepIndex === validSteps.length - 1}
              endContent={<ArrowRight className="h-4 w-4" />}
              size="sm"
              color="primary"
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

const BrowserAutomationChat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>("");
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);

  const socketRef = useRef<WebSocket | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const connectToBrowser = () => {
    console.log("connecting");

    if (isConnected || isConnecting) return;

    console.log("connectin2");
    setIsConnecting(true);
    setError(null);

    const wsUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}ws/browser`;
    if (!wsUrl) {
      setError("WebSocket URL not defined");
      setIsConnecting(false);
      return;
    }

    socketRef.current = new WebSocket(wsUrl);

    socketRef.current.onopen = () => {
      setIsConnected(true);
      setIsConnecting(false);

      socketRef.current?.send(
        JSON.stringify({
          type: "init",
          config: { headless: true, disable_security: true },
        }),
      );
      addMessage({
        role: "system",
        content: "Connecting to browser session...",
      });
    };

    socketRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      switch (data.type) {
        case "init_response":
          setSessionId(data.session_id);
          addMessage({
            role: "system",
            content: "Successfully connected to browser session",
          });
          break;
        case "task_started":
          addMessage({
            role: "system",
            content: `Task started: ${data.task}`,
          });
          break;
        case "step_update":
          const stepUpdateData = data.data;

          const stepData: StepData = {
            step: stepUpdateData.step,
            thoughts: stepUpdateData.thoughts,
            actions: Array.isArray(stepUpdateData.actions)
              ? stepUpdateData.actions
              : [],
            url: stepUpdateData.url,
            title: stepUpdateData.title,
            screenshot: stepUpdateData.screenshot,
            screenshot_url: stepUpdateData.screenshot_url,
          };

          addMessage({
            role: "assistant",
            content: `Step ${stepData.step}: ${stepData.thoughts?.evaluation || ""}`,
            stepData,
          });

          const validSteps = messages.filter(
            (msg) =>
              msg.role === "assistant" &&
              msg.stepData &&
              (msg.stepData.url ||
                msg.stepData.thoughts ||
                msg.stepData.actions),
          ).length;

          setCurrentStepIndex(validSteps);

          if (!isSidebarOpen) {
            setIsSidebarOpen(true);
          }

          break;
        case "task_completed":
          const result: TaskResult = data.result;

          addMessage({
            role: "assistant",
            content: `Task completed successfully.`,
            stepData: {
              step: -1,
            },
          });

          if (result?.history?.length > 0) {
            const lastItem = result.history[result.history.length - 1];

            const lastAction = lastItem.model_output.action[0];
            const lastResult = lastItem.result[0];

            if (
              lastResult &&
              (lastResult.is_done || lastResult.success) &&
              lastResult.extracted_content
            ) {
              addMessage({
                role: "assistant",
                content: lastResult.extracted_content,
                stepData: {
                  step: -2,
                  actions: lastItem.model_output.action,
                  url: lastItem.state.url,
                  title: lastItem.state.title,
                  screenshot: lastItem.state.screenshot,
                  thoughts: {
                    evaluation:
                      lastItem.model_output.current_state
                        .evaluation_previous_goal,
                    memory: lastItem.model_output.current_state.memory,
                    next_goal: lastItem.model_output.current_state.next_goal,
                  },
                },
              });
            }
          }

          setIsProcessing(false);
          break;
        case "task_error":
          addMessage({
            role: "system",
            content: `Error: ${data.error}`,
          });
          setIsProcessing(false);
          break;
        default:
          console.warn("Unhandled message type:", data.type);
          break;
      }
    };

    socketRef.current.onerror = (event) => {
      setError("WebSocket error occurred.");
      console.error("WebSocket error:", event);
    };

    socketRef.current.onclose = () => {
      setIsConnected(false);
      addMessage({
        role: "system",
        content: "Browser session disconnected.",
      });
    };
  };

  const resetSession = () => {
    setMessages([]);
    setIsConnected(false);
    setSessionId(null);
    setError(null);
    setIsProcessing(false);
    setCurrentStepIndex(0);

    socketRef.current?.close();
    socketRef.current = null;
  };

  const addMessage = (message: Message) => {
    setMessages((prev) => [...prev, message]);
  };

  const handleSendMessage = () => {
    if (!input.trim() || !isConnected || isProcessing) return;

    addMessage({ role: "user", content: input });
    setIsProcessing(true);

    const taskPayload = {
      type: "task",
      task: input,
      session_id: sessionId,
    };

    socketRef.current?.send(JSON.stringify(taskPayload));
    setInput("");
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && isConnected && !isProcessing) {
      handleSendMessage();
    }
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const openStepExplorer = (index: number) => {
    setCurrentStepIndex(index);
    setIsSidebarOpen(true);
  };

  const getStepMessages = () => {
    return messages.filter(
      (msg) =>
        msg.role === "assistant" &&
        msg.stepData &&
        (msg.stepData.url || msg.stepData.thoughts || msg.stepData.actions),
    );
  };

  return (
    <div className="flex h-[94vh] w-full flex-row">
      {/* Main Content */}
      <div className="flex h-full flex-1 flex-col">
        {/* {isConnected && (
          <div className="w-full p-4 pb-0">
            <BrowserNavigationControls
              isConnected={isConnected}
              sessionId={sessionId}
              socketRef={socketRef}
              setIsProcessing={setIsProcessing}
            />
          </div>
        )} */}
        <div className="flex flex-1 justify-center overflow-y-auto p-4">
          <div
            ref={messagesContainerRef}
            className="mx-auto h-full w-full max-w-screen-lg justify-center space-y-4"
          >
            {messages.length === 0 && (
              <div className="flex h-full flex-1 flex-col items-center justify-center rounded-3xl text-zinc-500">
                {/* <AiBrowserIcon className="mb-3 h-12 w-12 text-zinc-600" /> */}

                <Image
                  alt="Automate Browser Infographic"
                  src={"/media/automate_browser.png"}
                  width={450}
                  height={400}
                />

                <Button
                  disabled={isConnecting}
                  radius="full"
                  variant="flat"
                  className="my-3"
                  color={isConnecting ? "default" : "success"}
                  onPress={connectToBrowser}
                  startContent={<Plug className="h-4 w-4" />}
                >
                  {isConnecting ? "Connecting..." : "Connect Browser"}
                </Button>

                <p className="text-center">
                  {isConnected
                    ? "Enter a task for the browser to perform"
                    : "Connect to start automating web tasks"}
                </p>
              </div>
            )}

            {messages.map((message, idx) => {
              switch (message.role) {
                case "user":
                  return (
                    <div key={idx} className="group flex justify-end">
                      <div className="flex items-end gap-2">
                        <div className="max-w-md rounded-2xl rounded-tr-none bg-primary px-4 py-2 text-white">
                          {message.content}
                        </div>
                        <Avatar
                          className="mb-1 h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
                          name="You"
                          radius="full"
                        />
                      </div>
                    </div>
                  );
                case "assistant":
                  return (
                    <div key={idx} className="group space-y-1">
                      <div className="flex items-end gap-2">
                        <Image
                          alt="GAIA Logo"
                          src={"/branding/logo.webp"}
                          width={30}
                          height={30}
                        />

                        <div className="relative mb-1 flex max-w-md flex-col rounded-2xl rounded-bl-none bg-zinc-800 px-4 py-2 shadow-sm">
                          <div className="text-white">{message.content}</div>

                          {message?.stepData?.thoughts && (
                            <div className="text-white">
                              {message.stepData.thoughts.memory}
                            </div>
                          )}

                          {message?.stepData?.thoughts?.next_goal && (
                            <Chip
                              className="mt-3 max-w-[200px] text-white"
                              variant="flat"
                              size="sm"
                              startContent={
                                <div className="flex items-center gap-1 px-1 font-medium">
                                  Next Step:
                                </div>
                              }
                              color="success"
                              endContent={
                                <CircleArrowRight
                                  className="text-[12px] text-success opacity-80"
                                  width={16}
                                />
                              }
                            >
                              {message.stepData.thoughts?.next_goal}
                            </Chip>
                          )}

                          <Button
                            size="sm"
                            variant="flat"
                            color="primary"
                            className="mt-2 w-fit"
                            startContent={<Layout size={14} />}
                            onPress={() => {
                              const stepIndex = getStepMessages().findIndex(
                                (msg) => msg === message,
                              );
                              openStepExplorer(
                                stepIndex !== -1 ? stepIndex : 0,
                              );
                            }}
                          >
                            View Step Details
                          </Button>
                        </div>
                      </div>

                      {/* 

                      {message.stepData &&
                        (message.stepData.url ||
                          message.stepData.thoughts ||
                          message.stepData.actions) && (
                          <div className="ml-10 w-fit border-l-3 border-primary">
                            <div className="mt-1 max-w-4xl rounded-xl rounded-l-none bg-primary/10 p-3 text-sm text-zinc-300">
                              <div className="mb-2 flex items-center justify-between">
                      
                                 {message.stepData.url && (
                                  <div className="flex items-center gap-1 rounded-md bg-zinc-900 px-2 py-1 text-xs text-zinc-400">
                                    <Globe className="h-3.5 w-3.5 text-blue-400" />
                                    <span className="mr-1 font-medium">
                                      URL:
                                    </span>
                                    <span className="max-w-[300px] truncate">
                                      {message.stepData.url}
                                    </span>
                                  </div>
                                )}
                            
                                <Button
                                  size="sm"
                                  variant="flat"
                                  color="primary"
                                  radius="full"
                                  className="ml-auto"
                                  startContent={<Layout size={14} />}
                                  onPress={() => {
                                    const stepIndex =
                                      getStepMessages().findIndex(
                                        (msg) => msg === message,
                                      );
                                    openStepExplorer(
                                      stepIndex !== -1 ? stepIndex : 0,
                                    );
                                  }}
                                >
                                  View Details
                                </Button> 
                              </div>

                             {(message.stepData.screenshot_url ||
                                message.stepData.screenshot) && (
                                <div className="mb-4 mt-2 max-w-full overflow-hidden rounded-md">
                                  <Image
                                    src={
                                      (message.stepData.screenshot_url ||
                                        message.stepData.screenshot ||
                                        "") as string
                                    }
                                    alt={`Screenshot of step ${message.stepData.step}`}
                                    width={700}
                                    height={400}
                                    className="max-h-[400px] w-full object-cover"
                                    unoptimized
                                  />
                                </div>
                              )} 
                            
                              {message.stepData.thoughts && (
                                <div className="mt-2 max-w-screen-sm space-y-2 rounded-md bg-zinc-900 p-2">
                                  <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
                                    <Brain className="h-3.5 w-3.5" />
                                    <span>AI Thoughts</span>
                                  </div>
                                  {(message.stepData.thoughts.evaluation ||
                                    message.stepData.thoughts
                                      .evaluation_previous_goal) && (
                                    <div className="flex flex-col">
                                      <div className="flex items-center gap-1">
                                        <span className="text-sm font-medium text-primary">
                                          Evaluation:
                                        </span>
                                      </div>
                                      <div className="text-md">
                                        {message.stepData.thoughts.evaluation ||
                                          message.stepData.thoughts
                                            .evaluation_previous_goal}
                                      </div>
                                    </div>
                                  )}
                                  {message.stepData.thoughts.memory && (
                                    <div className="flex flex-col">
                                      <div className="flex items-center gap-1">
                                        <span className="text-sm font-medium text-blue-400">
                                          Memory:
                                        </span>
                                      </div>
                                      <div className="text-md">
                                        {message.stepData.thoughts.memory}
                                      </div>
                                    </div>
                                  )}
                                  {message.stepData.thoughts.next_goal && (
                                    <div className="flex gap-2 text-sm">
                                      <span className="flex items-center gap-1">
                                        <span className="font-medium text-green-400">
                                          Next Goal:
                                        </span>
                                      </span>
                                      <span>
                                        {message.stepData.thoughts.next_goal}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              )} 

                           {message.stepData.actions &&
                                message.stepData.actions.length > 0 && (
                                  <div className="mt-2 space-y-1">
                                    <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
                                      <Zap className="h-3.5 w-3.5" />
                                      <span>Actions</span>
                                    </div>
                                    <ul className="space-y-1">
                                      {message.stepData.actions.map(
                                        (action, i) => (
                                          <li
                                            key={i}
                                            className="flex max-w-[550px] items-center gap-2 rounded-md bg-zinc-900 px-2 py-1 text-sm"
                                          >
                                            {action.navigate && (
                                              <>
                                                <ArrowUpRight className="h-3.5 w-3.5 text-blue-400" />
                                                <span>Navigate to: </span>
                                                <span className="text-blue-400 underline">
                                                  {action.navigate.url}
                                                </span>
                                              </>
                                            )}
                                            {action.click && (
                                              <>
                                                <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full border border-zinc-600 text-[10px]">
                                                  C
                                                </span>
                                                <span>Click: </span>
                                                <code className="rounded bg-zinc-700 px-1 py-0.5 text-xs">
                                                  {action.click.selector}
                                                </code>
                                              </>
                                            )}
                                            {action.search_google && (
                                              <>
                                                <Globe className="h-3.5 w-3.5 text-blue-400" />
                                                <span>Search Google: </span>
                                                <span className="italic">
                                                  "{action.search_google.query}"
                                                </span>
                                              </>
                                            )}
                                            {action.go_to_url && (
                                              <>
                                                <ArrowUpRight className="h-3.5 w-3.5 text-blue-400" />
                                                <span>Go to URL: </span>
                                                <span className="text-blue-400 underline">
                                                  {action.go_to_url.url}
                                                </span>
                                              </>
                                            )}
                                            {action.done && (
                                              <>
                                                <span className="text-green-400">
                                                  ✓
                                                </span>
                                                <span>{action.done.text}</span>
                                              </>
                                            )}
                                          </li>
                                        ),
                                      )}
                                    </ul>
                                  </div>
                                )} 
                            </div>
                          </div>
                        )}
                       */}
                    </div>
                  );

                case "system":
                  return (
                    <div key={idx} className="flex justify-center">
                      <Chip
                        radius="full"
                        variant="flat"
                        startContent={
                          message.content
                            .toLowerCase()
                            .includes("successfully") ? (
                            <span className="px-1 text-green-400">✓</span>
                          ) : message.content.includes("error") ? (
                            <AlertTriangle className="h-3 w-3 min-w-3 px-1 text-red-400" />
                          ) : (
                            <div className="px-1">
                              <Loader className="h-3 w-3 min-w-3 animate-spin" />
                            </div>
                          )
                        }
                        color={
                          message.content.toLowerCase().includes("successfully")
                            ? "success"
                            : message.content.includes("error")
                              ? "danger"
                              : "default"
                        }
                      >
                        {message.content}
                      </Chip>
                    </div>
                  );
                default:
                  return null;
              }
            })}
            <div ref={chatEndRef} />
          </div>
        </div>

        {/* Input area */}
        <div className="w-full p-4">
          {isProcessing && (
            <div className="mb-2 flex items-center justify-center text-sm text-zinc-400">
              <div className="mr-2 h-2 w-2 animate-pulse rounded-full bg-blue-500"></div>
              Processing your request...
            </div>
          )}

          {messages.length > 0 && (
            <div className="flex items-center justify-center gap-2 py-2">
              {!isConnected && (
                <Button
                  size="sm"
                  variant="flat"
                  radius="full"
                  color="success"
                  startContent={<Plug size={14} />}
                  onPress={connectToBrowser}
                  disabled={isConnecting}
                >
                  {isConnecting ? "Connecting..." : "Connect Browser"}
                </Button>
              )}

              {isConnected && (
                <Button
                  size="sm"
                  variant="flat"
                  radius="full"
                  color="default"
                  startContent={<Layout size={14} />}
                  onPress={() => {
                    setCurrentStepIndex(0);
                    setIsSidebarOpen(true);
                  }}
                >
                  Explore Steps
                </Button>
              )}

              <Button
                size="sm"
                variant="flat"
                radius="full"
                color="danger"
                startContent={<ResetIcon />}
                onPress={resetSession}
              >
                Reset Session
              </Button>
            </div>
          )}

          <div className="mx-auto flex w-full max-w-screen-sm items-center">
            <Input
              type="text"
              size="lg"
              value={input}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setInput(e.target.value)
              }
              onKeyDown={handleKeyPress}
              disabled={!isConnected || isProcessing}
              variant="faded"
              radius="full"
              classNames={{
                input: "pr-0",
              }}
              placeholder={
                !isConnected
                  ? "Connect to browser session first..."
                  : isProcessing
                    ? "Processing..."
                    : "Enter a task for the browser to perform..."
              }
              endContent={
                <Button
                  isIconOnly
                  onPress={handleSendMessage}
                  disabled={!isConnected || !input.trim() || isProcessing}
                  radius="full"
                  color={"primary"}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 transform"
                >
                  <SendIcon className="h-5 w-5" />
                </Button>
              }
            />
          </div>
        </div>
      </div>

      {/* Browser Sidebar Component */}
      <BrowserSidebar
        isOpen={isSidebarOpen}
        onToggle={toggleSidebar}
        steps={messages}
        currentStepIndex={currentStepIndex}
        setCurrentStepIndex={setCurrentStepIndex}
      />
    </div>
  );
};

export default BrowserAutomationChat;
