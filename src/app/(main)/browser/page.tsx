"use client";

import { AiBrowserIcon } from "@/components/Misc/icons";
import {
  BubbleChatIcon,
  BubbleConversationChatIcon,
} from "@/components/Misc/icons";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Input } from "@heroui/input";
import { Avatar } from "@heroui/avatar";
import { Tooltip } from "@heroui/tooltip";
import { ResetIcon } from "@radix-ui/react-icons";
import {
  AlertTriangle,
  ArrowUpRight,
  Brain,
  Clock,
  Globe,
  Loader,
  Plug,
  SendIcon,
  Terminal,
  Zap,
} from "lucide-react";
import { ChangeEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import Image from "next/image";

// Define types for browser automation
interface Thoughts {
  evaluation?: string;
  memory?: string;
  next_goal?: string;
}

interface Action {
  navigate?: { url: string };
  click?: { selector: string };
  done?: { text: string; success: boolean };
  [key: string]: any;
}

interface StepData {
  step: number;
  thoughts?: Thoughts;
  actions?: Action[];
  url?: string;
  title?: string;
}

type MessageRole = "user" | "assistant" | "system";

interface Message {
  role: MessageRole;
  content: string;
  stepData?: StepData;
}

const BrowserAutomationChat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>("");
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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
    if (isConnected || isConnecting) return;

    setIsConnecting(true);
    setError(null);

    // Mock WebSocket for demo
    setTimeout(() => {
      setIsConnected(true);
      setIsConnecting(false);
      setSessionId("sample-session-123");
      addMessage({
        role: "system",
        content: "Successfully connected to browser session",
      });
    }, 1500);

    addMessage({ role: "system", content: "Connecting to browser session..." });
  };

  const resetSession = () => {
    setMessages([]);
    setIsConnected(false);
    setSessionId(null);
    setError(null);
    setIsProcessing(false);
  };

  const addMessage = (message: Message) => {
    setMessages((prev) => [...prev, message]);
  };

  const handleSendMessage = () => {
    if (!input.trim() || !isConnected || isProcessing) return;

    // Add user message
    addMessage({ role: "user", content: input });

    // Simulate processing
    setIsProcessing(true);

    // Mock browser automation response
    setTimeout(() => {
      // Add system message that task started
      addMessage({ role: "system", content: `Task started: ${input}` });

      // Mock step updates
      setTimeout(() => {
        const stepData: StepData = {
          step: 1,
          thoughts: {
            evaluation: "Starting the task",
            memory: "I need to navigate to the website",
            next_goal: "Open the website",
          },
          actions: [{ navigate: { url: "https://example.com" } }],
          url: "about:blank",
          title: "New Tab",
        };

        addMessage({
          role: "assistant",
          content: `Step ${stepData.step}: Navigating to https://example.com`,
          stepData,
        });

        // Second step
        setTimeout(() => {
          const stepData2: StepData = {
            step: 2,
            thoughts: {
              evaluation: "Successfully loaded the website",
              memory: "I am now on example.com",
              next_goal: "Search for information",
            },
            actions: [{ click: { selector: ".search-button" } }],
            url: "https://example.com",
            title: "Example Domain",
          };

          addMessage({
            role: "assistant",
            content: `Step ${stepData2.step}: Website loaded, searching for information`,
            stepData: stepData2,
          });

          // Final step with completion
          setTimeout(() => {
            const stepData3: StepData = {
              step: 3,
              thoughts: {
                evaluation: "Success - I found the information",
                memory: "I have completed the task",
                next_goal: "Report the findings",
              },
              actions: [
                {
                  done: {
                    text: "I have found the requested information on example.com",
                    success: true,
                  },
                },
              ],
              url: "https://example.com/search",
              title: "Search Results - Example Domain",
            };

            addMessage({
              role: "assistant",
              content: `I have found the requested information on example.com`,
              stepData: stepData3,
            });

            addMessage({
              role: "system",
              content: "Task completed successfully.",
            });
            setIsProcessing(false);
          }, 1500);
        }, 1500);
      }, 1500);
    }, 1000);

    setInput("");
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && isConnected && !isProcessing) {
      handleSendMessage();
    }
  };

  return (
    <div className="flex h-full w-full flex-col rounded-3xl">
      {/* Header */}
      <div className="flex items-center border-zinc-800 p-2 shadow-sm">
        <div className="flex items-center">
          <AiBrowserIcon className="mr-2 h-6 w-6 text-primary" />
          <h1 className="text-xl font-medium">Browser Automation</h1>
        </div>
        <div className="ml-auto flex items-center space-x-2">
          {isConnected ? (
            <div className="flex items-center">
              <span className="mr-2 inline-block h-2 w-2 rounded-full bg-green-500"></span>
              <span className="text-sm text-zinc-400">Connected</span>
              <Tooltip content="Reset session">
                <Button
                  isIconOnly
                  radius="full"
                  size="sm"
                  variant="light"
                  onPress={resetSession}
                >
                  <ResetIcon className="h-4 w-4 text-zinc-400" />
                </Button>
              </Tooltip>
            </div>
          ) : (
            <Button
              disabled={isConnecting}
              radius="full"
              size="sm"
              variant={isConnecting ? "flat" : "solid"}
              color="primary"
              onPress={connectToBrowser}
              startContent={<Plug className="h-4 w-4" />}
            >
              {isConnecting ? "Connecting..." : "Connect Browser"}
            </Button>
          )}
        </div>
      </div>

      {/* Messages container */}
      <div
        ref={messagesContainerRef}
        className="flex-1 space-y-4 overflow-y-auto rounded-3xl bg-zinc-900 p-4"
      >
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center text-zinc-500">
            <AiBrowserIcon className="mb-3 h-12 w-12 text-zinc-600" />
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
                    <div className="max-w-md rounded-2xl rounded-tr-sm bg-blue-600 px-4 py-2 text-white">
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

                    <div className="relative my-2 max-w-md rounded-2xl rounded-bl-none bg-zinc-700 px-4 py-2 shadow-sm">
                      <div className="text-white">{message.content}</div>
                    </div>
                  </div>

                  {message.stepData && (
                    <div className="ml-10 border-l-2 border-primary pl-2">
                      <div className="mt-1 rounded-md bg-zinc-800 p-3 text-sm text-zinc-300">
                        <div className="mb-1 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
                          <Clock className="h-3.5 w-3.5" />
                          <span>Step {message.stepData.step}</span>
                        </div>

                        {message.stepData.url && (
                          <div className="mb-2 flex items-center gap-1 rounded-md bg-zinc-900 px-2 py-1 text-xs text-zinc-400">
                            <Globe className="h-3.5 w-3.5 text-blue-400" />
                            <span className="mr-1 font-medium">URL:</span>
                            <span className="truncate">
                              {message.stepData.url}
                            </span>
                          </div>
                        )}

                        {message.stepData.thoughts && (
                          <div className="mt-2 space-y-2 rounded-md bg-zinc-900 p-2">
                            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
                              <Brain className="h-3.5 w-3.5" />
                              <span>AI Thoughts</span>
                            </div>
                            {message.stepData.thoughts.evaluation && (
                              <div className="flex flex-col">
                                <div className="flex items-center gap-1">
                                  <span className="text-sm font-medium text-primary">
                                    Evaluation:
                                  </span>
                                </div>
                                <div className="text-md">
                                  {message.stepData.thoughts.evaluation}
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
                                {message.stepData.actions.map((action, i) => (
                                  <li
                                    key={i}
                                    className="flex items-center gap-2 rounded-md bg-zinc-900 px-2 py-1 text-sm"
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
                                    {action.done && (
                                      <>
                                        <span className="text-green-400">
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
                    </div>
                  )}
                </div>
              );
            case "system":
              return (
                <div key={idx} className="flex justify-center">
                  <Chip
                    radius="full"
                    variant="flat"
                    startContent={
                      message.content.toLowerCase().includes("successfully") ? (
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

      {/* Input area */}
      <div className="flex flex-col items-center p-4">
        {isProcessing && (
          <div className="mt-2 flex items-center text-sm text-zinc-400">
            <div className="mr-2 h-2 w-2 animate-pulse rounded-full bg-blue-500"></div>
            Processing your request...
          </div>
        )}

        <div className="relative flex w-full max-w-screen-sm items-center">
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
              // input: "text-zinc-100 placeholder:text-zinc-500",
              input: "pr-0",
            }}
            placeholder={
              !isConnected
                ? "Connect to browser session first..."
                : isProcessing
                  ? "Processing..."
                  : "Enter a task for the browser to perform..."
            }
          />
          <Button
            isIconOnly
            onPress={handleSendMessage}
            disabled={!isConnected || !input.trim() || isProcessing}
            radius="full"
            color={"primary"}
            // isConnected && input.trim() && !isProcessing
            className="absolute right-1.5 top-1/2 -translate-y-1/2 transform"
          >
            <SendIcon className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BrowserAutomationChat;
