import { Configuration, OpenAIApi } from "openai-edge";

export const runtime = "edge";

// Define types for messages and attachments
interface Attachment {
  type: string;
  url: string;
}

interface ChatMessage {
  role: string;
  content: string;
  image_urls?: string[];
  attachments?: Attachment[];
}

// Create OpenAI configuration
const config = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(config);

// Extract image URLs from a message if present
const extractImageUrls = (message: ChatMessage): string[] => {
  if (!message) return [];

  // Check for explicit image_urls field
  if (message.image_urls && Array.isArray(message.image_urls)) {
    return message.image_urls;
  }

  // Check for attachments array
  if (message.attachments && Array.isArray(message.attachments)) {
    return message.attachments
      .filter((att: Attachment) => att.type === "image" && att.url)
      .map((att: Attachment) => att.url);
  }

  return [];
};

// Format messages for OpenAI, handling images and content
const formatMessagesForOpenAI = (messages: ChatMessage[]): any[] => {
  if (!messages || !Array.isArray(messages)) return [];

  return messages.map((msg) => {
    // Extract image URLs if any
    const imageUrls = extractImageUrls(msg);

    // Basic message without images
    if (imageUrls.length === 0) {
      return {
        role: msg.role || "user",
        content: msg.content || "",
      };
    }

    // Message with images - using content format OpenAI accepts for images
    return {
      role: msg.role || "user",
      content: [
        // Add text content if available
        ...(msg.content ? [{ type: "text", text: msg.content }] : []),

        // Add image URLs
        ...imageUrls.map((url) => ({
          type: "image_url",
          image_url: { url },
        })),
      ],
    };
  });
};

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    // Check if API key is configured
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey || apiKey === "your-openai-api-key") {
      return new Response(
        JSON.stringify({
          error:
            "OpenAI API key not configured. Please add a valid API key to your .env.local file.",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Add system message for context
    const systemMessage: ChatMessage = {
      role: "system",
      content:
        "You are a helpful assistant that provides information about cannabis, cannabis-friendly restaurants, events, and other 420-related topics. " +
        "Be respectful, informative, and concise. If you don't know the answer to something specific, be honest about it. " +
        "If images are shared, analyze them and provide relevant information based on what you see.",
    };

    // Check if any message has images
    const hasImages = messages.some(
      (msg: ChatMessage) => extractImageUrls(msg).length > 0
    );

    // Choose appropriate model based on content
    const model = hasImages ? "gpt-4-vision-preview" : "gpt-3.5-turbo";

    // Format all messages for OpenAI, handling images correctly
    const formattedMessages = formatMessagesForOpenAI([
      systemMessage,
      ...messages,
    ]);

    // Create a response from OpenAI
    const response = await openai.createChatCompletion({
      model,
      stream: true,
      messages: formattedMessages,
      max_tokens: 500,
      temperature: 0.7,
    });

    // Make sure we're getting a ReadableStream back
    if (!response.body) {
      throw new Error("No response body from OpenAI");
    }

    // Create a TransformStream to process the response
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    // Create a transform stream to filter and process the SSE events
    const transformStream = new TransformStream({
      async transform(chunk, controller) {
        // Decode the chunk
        const text = decoder.decode(chunk);

        // Process each line (SSE event)
        const lines = text.split("\n");
        for (const line of lines) {
          // Skip empty lines or non-data lines
          if (!line.startsWith("data:") || line === "data: [DONE]") continue;

          try {
            // Parse the JSON data from the SSE event
            const json = JSON.parse(line.substring(5));

            // Extract content from the chunk if it exists
            const content = json.choices[0]?.delta?.content;
            if (content) {
              // Send only the text content
              controller.enqueue(encoder.encode(content));
            }
          } catch (error) {
            console.error("Error parsing SSE event:", error);
          }
        }
      },
    });

    // Return the transformed stream
    return new Response(response.body.pipeThrough(transformStream), {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error: any) {
    console.error("Chat API error:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "An error occurred during the chat completion.",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
