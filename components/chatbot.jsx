"use client";

import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { ScrollArea } from "./ui/scroll-area";
import {
  X,
  MessageCircle,
  Send,
  Loader2,
  ArrowDownCircleIcon,
} from "lucide-react";
import { useChat } from "@ai-sdk/react";
import { motion, AnimatePresence } from "framer-motion";

function SuggestionBar({ suggestions, onClickSuggestion }) {
  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {suggestions.map((suggestion, index) => (
        <Badge
          key={index}
          className="cursor-pointer hover:bg-gray-200"
          onClick={() => onClickSuggestion(suggestion)}
        >
          {suggestion}
        </Badge>
      ))}
    </div>
  );
}

export default function Chatbot() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [showChatIcon, setShowChatIcon] = useState(false);
  const chatIconRef = useRef(null);
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    stop,
    reload,
    error,
  } = useChat({ 
    api: "/api/gemini",
    id: 'ngo-chat',
    initialMessages: [],
    body: {
      temperature: 0.7, // Lower temperature for more focused responses
      max_tokens: 200,  // Limit response length
      stream: true,     // Enable streaming
    },
    onResponse: (response) => {
      // Log response headers and status
      console.log('Stream response:', response.status);
    },
    onFinish: (message) => {
      console.log("AI Response:", message);
    },
    onError: (error) => {
      console.error("Chat Error:", error);
    }
  });

  const scrollref = useRef(null);
  const [suggestions, setSuggestions] = useState([]);

  // Optimize scroll behavior
  const scrollToBottom = () => {
    if (scrollref.current) {
      requestAnimationFrame(() => {
        scrollref.current.scrollIntoView({ behavior: "smooth" });
      });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Debounced search handler for suggestions
  useEffect(() => {
    if (!messages.length) return;
    
    const lastMessage = messages[messages.length - 1];
    if (lastMessage.role !== "user") return;

    const content = lastMessage.content.toLowerCase();
    const getSuggestions = () => {
      if (content.includes("help")) {
        return [
          "How to get started?",
          "Talk to support",
          "Event creation process",
        ];
      } else if (content.includes("pricing")) {
        return [
          "Is this free?",
          "Why is this free?",
          "Learn about NGO-CONNECT",
        ];
      } else if (content.includes("volunteer")) {
        return [
          "Volunteer registration process",
          "KYC requirements",
          "Mark attendance",
        ];
      }
      return ["Tell me more", "Show features", "Contact support"];
    };

    setSuggestions(getSuggestions());
  }, [messages]);

  // Optimized suggestion click handler
  const handleSuggestionClick = async (suggestion) => {
    handleInputChange({ target: { value: suggestion } });
    await handleSubmit();
  };

  // Optimized chat toggle
  const toggleChat = () => {
    setIsChatOpen((prev) => !prev);
  };

  return (
    <div>
      <AnimatePresence>
        <motion.div
          className="fixed bottom-4 right-4 z-80"
        >
          <Button
            ref={chatIconRef}
            onClick={toggleChat}
            size="icon"
            className="rounded-full size-14 p-2 shadow-lg"
          >
            {!isChatOpen ? (
              <MessageCircle className="size-7" />
            ) : (
              <ArrowDownCircleIcon />
            )}
          </Button>
        </motion.div>
      </AnimatePresence>

      <AnimatePresence>
        {isChatOpen && (
          <motion.div
            className="fixed bottom-20 right-4 z-50 w-[95%] md:w-[500px]"
          >
            <Card className="border-2">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-lg font-bold">
                  Chat with Ngo-Connect AI
                </CardTitle>
                <Button
                  onClick={toggleChat}
                  size="sm"
                  variant="ghost"
                  className="px-2 py-0"
                >
                  <X className="size-4" />
                  <span className="sr-only">Close Chat</span>
                </Button>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px] pr-4">
                  {messages?.length === 0 && (
                    <div className="w-full mt-32 text-gray-500 items-center justify-center flex gap-3">
                      No messages yet
                    </div>
                  )}
                  {messages?.map((message, index) => (
                    <div
                      key={index}
                      className={`mb-4 ${
                        message.role === "user" ? "text-right" : "text-left"
                      }`}
                    >
                      <div
                        className={`inline-block rounded-lg p-2 ${
                          message.role === "user"
                            ? "bg-black text-white"
                            : "bg-muted"
                        }`}
                      >
                        <ReactMarkdown
                          children={message.content}
                          remarkPlugins={[remarkGfm]}
                          components={{
                            code: ({ node, inline, className, children, ...props }) => {
                              return inline ? (
                                <code {...props} className="bg-gray-200 px-1 rounded">
                                  {children}
                                </code>
                              ) : (
                                <pre {...props} className="bg-gray-200 p-2 rounded">
                                  <code>{children}</code>
                                </pre>
                              );
                            }
                          }}
                        />
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="w-full items-center flex justify-center gap-3">
                      <Loader2 className="animate-spin h-5 w-5 text-primary" />
                      <button
                        className="underline"
                        type="button"
                        onClick={() => stop()}
                      >
                        stop generating
                      </button>
                    </div>
                  )}
                  {error && (
                    <div className="w-full items-center flex justify-center gap-3">
                      <div>an error occurred</div>
                      <button
                        className="underline"
                        type="button"
                        onClick={() => reload()}
                      >
                        retry
                      </button>
                    </div>
                  )}
                  <div ref={scrollref} />
                </ScrollArea>
                {suggestions.length > 0 && (
                  <SuggestionBar
                    suggestions={suggestions}
                    onClickSuggestion={handleSuggestionClick}
                  />
                )}
              </CardContent>
              <CardFooter className="p-0">
                <form
                  onSubmit={handleSubmit}
                  className="flex w-full items-center space-x-4"
                >
                  <Input
                    value={input}
                    onChange={handleInputChange}
                    className="flex-1 w-[380px] p-5 ml-5"
                    placeholder="Type your message here..."
                  />
                  <Button
                    type="submit"
                    className="size-10"
                    disabled={isLoading}
                    size="icon"
                  >
                    <Send className="size-5" />
                  </Button>
                </form>
              </CardFooter>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}