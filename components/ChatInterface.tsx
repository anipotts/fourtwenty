"use client";

import React, { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp?: Date;
  attachments?: {
    type: "image";
    url: string;
  }[];
}

interface ChatInterfaceProps {
  onClose?: () => void;
  isOpen: boolean;
  title?: string;
}

export default function ChatInterface({
  onClose,
  isOpen,
  title = "420 Assistant",
}: ChatInterfaceProps) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [apiKeyError, setApiKeyError] = useState(false);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [attachmentPreviews, setAttachmentPreviews] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-resize the textarea based on content
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "24px";
      inputRef.current.style.height = `${Math.min(
        120,
        inputRef.current.scrollHeight
      )}px`;
    }
  }, [input]);

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when chat is opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    } else {
      // Reset attachments when chat is closed
      setAttachments([]);
      setAttachmentPreviews([]);
    }
  }, [isOpen]);

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    handleFiles(Array.from(files));
  };

  // Handle files from drop or selection
  const handleFiles = (files: File[]) => {
    // Only accept image files for now
    const imageFiles = files.filter((file) => file.type.startsWith("image/"));
    if (imageFiles.length === 0) return;

    // Add new files to attachments
    setAttachments((prev) => [...prev, ...imageFiles]);

    // Generate previews for the images
    const newPreviews = imageFiles.map((file) => URL.createObjectURL(file));
    setAttachmentPreviews((prev) => [...prev, ...newPreviews]);
  };

  // Handle drag events
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  // Remove an attachment
  const removeAttachment = (index: number) => {
    // Revoke object URL to prevent memory leaks
    URL.revokeObjectURL(attachmentPreviews[index]);

    setAttachments((prev) => prev.filter((_, i) => i !== index));
    setAttachmentPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  // Upload attachments to server and get URLs
  const uploadAttachments = async (): Promise<string[]> => {
    if (attachments.length === 0) return [];

    setIsUploading(true);
    const uploadedUrls: string[] = [];

    try {
      // Upload each file to our API endpoint
      const uploadPromises = attachments.map(async (file) => {
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Failed to upload ${file.name}`);
        }

        const result = await response.json();
        return result.display_url; // Use the display URL from ImgBB
      });

      // Wait for all uploads to complete
      uploadedUrls.push(...(await Promise.all(uploadPromises)));

      // Revoke object URLs to prevent memory leaks
      attachmentPreviews.forEach((url) => URL.revokeObjectURL(url));

      return uploadedUrls;
    } catch (error) {
      console.error("Error uploading attachments:", error);
      return [];
    } finally {
      setIsUploading(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && attachments.length === 0) || streaming || isUploading)
      return;

    // Process any image attachments
    const uploadedImageUrls = await uploadAttachments();
    const hasAttachments = uploadedImageUrls.length > 0;

    // Add user message
    const userMessage: Message = {
      role: "user",
      content: input.trim() || (hasAttachments ? "What's in this image?" : ""),
      timestamp: new Date(),
      attachments: uploadedImageUrls.map((url) => ({ type: "image", url })),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setStreaming(true);
    setApiKeyError(false);
    setAttachments([]);
    setAttachmentPreviews([]);

    try {
      // Add an empty assistant message that we'll stream content into
      const newAssistantMessage: Message = {
        role: "assistant",
        content: "",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, newAssistantMessage]);

      // Add image analysis text to the message content if images are attached
      let messageContent = input.trim();
      if (hasAttachments) {
        messageContent = messageContent || "Can you analyze these images?";
      }

      // Send request to API
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [
            ...messages,
            {
              role: "user",
              content: messageContent,
              // Include image URLs if available
              ...(hasAttachments && { image_urls: uploadedImageUrls }),
            },
          ],
        }),
      });

      if (response.status === 500) {
        const errorData = await response.json();
        if (errorData.error && errorData.error.includes("API key")) {
          setApiKeyError(true);
          throw new Error("OpenAI API key not configured");
        }
      }

      if (!response.ok) {
        // If API isn't available, simulate a response for the demo
        if (hasAttachments) {
          // Simulate image analysis response
          setMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = {
              ...updated[updated.length - 1],
              content:
                "This appears to be an image related to cannabis. I can see a stylized design featuring the Statue of Liberty with cannabis leaf elements - a common symbol in cannabis culture.",
            };
            return updated;
          });
          setStreaming(false);
          return;
        } else {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      }

      // Process streaming response
      const reader = response.body?.getReader();
      if (!reader) throw new Error("Response body is null");

      const decoder = new TextDecoder();
      let currentContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // Decode and append to current assistant message
        const text = decoder.decode(value);
        currentContent += text;

        // Update the last message in the state with the new content
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            ...updated[updated.length - 1],
            content: currentContent,
          };
          return updated;
        });
      }
    } catch (error) {
      console.error("Error:", error);
      setMessages((prev) => {
        // If there's already an assistant message (the empty one we added), update it
        if (prev.length > 0 && prev[prev.length - 1].role === "assistant") {
          const updated = [...prev];
          updated[updated.length - 1] = {
            ...updated[updated.length - 1],
            content: apiKeyError
              ? "It seems the OpenAI API key is not configured. Please add your API key to the .env.local file."
              : "Sorry, I encountered an error. Please try again.",
          };
          return updated;
        }

        // Otherwise add a new message
        return [
          ...prev,
          {
            role: "assistant",
            content: apiKeyError
              ? "It seems the OpenAI API key is not configured. Please add your API key to the .env.local file."
              : "Sorry, I encountered an error. Please try again.",
            timestamp: new Date(),
          },
        ];
      });
    } finally {
      setStreaming(false);
    }
  };

  // Format timestamp
  const formatTime = (date?: Date) => {
    if (!date) return "";
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // Toggle chat expansion
  const toggleChat = () => {
    if (onClose && isOpen) {
      onClose();
    }
  };

  // If chat is closed, return null
  if (!isOpen) return null;

  // Animation variants
  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.2 } },
    exit: { opacity: 0, transition: { duration: 0.2 } },
  };

  const chatVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 20 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30,
      },
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      y: 20,
      transition: {
        duration: 0.2,
      },
    },
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="flex fixed inset-0 z-40 justify-center items-center p-4 md:p-6 lg:p-8">
          <motion.div
            className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
            onClick={toggleChat}
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={overlayVariants}
          />

          <motion.div
            className="flex h-[85vh] sm:h-[80vh] md:h-[75vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl relative z-10"
            ref={containerRef}
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={chatVariants}
          >
            {/* Chat header */}
            <div className="flex justify-between items-center px-4 h-14 bg-white border-b border-gray-100">
              <h3 className="flex items-center font-medium text-gray-800">
                <span className="w-2 h-2 bg-[#4dd783] rounded-full mr-2 animate-pulse"></span>
                {title}
              </h3>
              <button
                onClick={toggleChat}
                className="rounded-full p-1.5 text-gray-500 hover:bg-gray-100 transition-colors"
                aria-label="Close chat"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Messages container */}
            <div
              className="overflow-y-auto flex-1 p-4 bg-gray-50"
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <AnimatePresence>
                {isDraggingFile && (
                  <motion.div
                    className="flex absolute inset-0 z-50 justify-center items-center bg-gray-100 bg-opacity-70"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="p-6 text-center bg-white rounded-lg shadow-lg">
                      <svg
                        className="mx-auto h-12 w-12 text-[#4dd783] mb-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                        />
                      </svg>
                      <p className="font-medium text-gray-700">
                        Drop image to upload
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {messages.length === 0 ? (
                <motion.div
                  className="flex flex-col justify-center items-center h-full text-center text-gray-500"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <svg
                    className="mb-3 h-10 w-10 text-[#4dd783]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                    />
                  </svg>
                  <h3 className="mb-2 text-lg font-medium text-gray-700">
                    How can I help you today?
                  </h3>
                  <p className="max-w-md text-sm text-gray-500">
                    Ask about cannabis strains, nearby restaurants, 420-friendly
                    events, or upload an image for analysis.
                  </p>
                </motion.div>
              ) : (
                <div className="space-y-6">
                  {messages.map((message, i) => (
                    <motion.div
                      key={i}
                      className={cn(
                        "mb-6 last:mb-2",
                        message.role === "user" ? "ml-auto" : ""
                      )}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="flex gap-3 items-start">
                        {message.role === "assistant" && (
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#4dd783] text-white shadow-sm">
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                              />
                            </svg>
                          </div>
                        )}

                        <div
                          className={cn(
                            "flex max-w-[85%] flex-col rounded-lg px-4 py-2 shadow-sm",
                            message.role === "user"
                              ? "bg-[#4dd783] text-white"
                              : "bg-white border border-gray-100"
                          )}
                        >
                          {/* Display attached images if any */}
                          {message.attachments &&
                            message.attachments.length > 0 && (
                              <div className="grid grid-cols-2 gap-2 mb-3">
                                {message.attachments.map((attachment, idx) => (
                                  <div
                                    key={idx}
                                    className="overflow-hidden relative rounded"
                                  >
                                    <img
                                      src={attachment.url}
                                      alt="Attachment"
                                      className="object-cover w-full h-auto rounded-lg"
                                    />
                                  </div>
                                ))}
                              </div>
                            )}

                          {/* Message content */}
                          <div className="text-sm whitespace-pre-wrap break-words">
                            {message.content ||
                              (message.role === "assistant" && streaming ? (
                                <div className="flex items-center space-x-1">
                                  <div className="w-2 h-2 bg-gray-300 rounded-full animate-pulse"></div>
                                  <div
                                    className="w-2 h-2 bg-gray-300 rounded-full animate-pulse"
                                    style={{ animationDelay: "0.2s" }}
                                  ></div>
                                  <div
                                    className="w-2 h-2 bg-gray-300 rounded-full animate-pulse"
                                    style={{ animationDelay: "0.4s" }}
                                  ></div>
                                </div>
                              ) : (
                                ""
                              ))}
                          </div>

                          {/* Message timestamp */}
                          <div
                            className={cn(
                              "mt-1 self-end text-xs",
                              message.role === "user"
                                ? "text-green-100"
                                : "text-gray-400"
                            )}
                          >
                            {formatTime(message.timestamp)}
                          </div>
                        </div>

                        {message.role === "user" && (
                          <div className="flex justify-center items-center w-7 h-7 text-white bg-gray-600 rounded-full shadow-sm shrink-0">
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                              />
                            </svg>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Image preview area */}
            <AnimatePresence>
              {attachmentPreviews.length > 0 && (
                <motion.div
                  className="px-4 py-2 bg-white border-t border-gray-100"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex overflow-x-auto gap-2 pb-2">
                    {attachmentPreviews.map((preview, index) => (
                      <motion.div
                        key={index}
                        className="relative flex-shrink-0 w-16 h-16"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ duration: 0.2 }}
                      >
                        <img
                          src={preview}
                          alt="Preview"
                          className="object-cover w-full h-full rounded-md"
                        />
                        <button
                          onClick={() => removeAttachment(index)}
                          className="flex absolute -top-1 -right-1 justify-center items-center w-5 h-5 text-white bg-red-500 rounded-full shadow-md transition-transform hover:scale-110"
                        >
                          <svg
                            className="w-3 h-3"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Input form */}
            <div className="p-4 bg-white border-t border-gray-100">
              <form onSubmit={handleSubmit} className="relative">
                <div className="relative flex items-center rounded-lg border border-gray-200 bg-white shadow-sm transition-all focus-within:border-[#4dd783] focus-within:ring-1 focus-within:ring-[#4dd783]/25">
                  {/* Hidden file input */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleFileSelect}
                    accept="image/*"
                    multiple
                  />

                  {/* Attachment button */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="ml-2 p-1.5 text-gray-500 hover:text-gray-700 transition-colors"
                    disabled={isUploading}
                    aria-label="Attach files"
                  >
                    <svg
                      className="w-5 h-5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                      />
                    </svg>
                  </button>

                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Message 420 Assistant..."
                    className="px-3 py-2 w-full text-sm placeholder-gray-500 text-gray-800 border-0 resize-none focus:outline-none focus:ring-0"
                    rows={1}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmit(e);
                      }
                    }}
                  />

                  <button
                    type="submit"
                    disabled={
                      (!input.trim() && attachments.length === 0) ||
                      streaming ||
                      isUploading
                    }
                    className={cn(
                      "mr-2 rounded-md p-1.5 transition-all",
                      (input.trim() || attachments.length > 0) &&
                        !streaming &&
                        !isUploading
                        ? "text-[#4dd783] hover:bg-gray-100"
                        : "text-gray-300"
                    )}
                    aria-label="Send message"
                  >
                    {streaming || isUploading ? (
                      <svg
                        className="w-5 h-5 animate-spin"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                        <path
                          d="M22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12Z"
                          stroke="currentColor"
                          strokeWidth="2"
                        />
                        <path
                          d="M10.5 16.5L16 12L10.5 7.5"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </button>
                </div>

                {/* Chat hint */}
                <p className="mt-2 text-xs text-center text-gray-400">
                  420 Assistant can provide information about cannabis strains,
                  dining options, and events.
                </p>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
