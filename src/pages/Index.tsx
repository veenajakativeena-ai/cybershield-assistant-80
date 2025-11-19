import { useState } from "react";
import { Shield, Activity } from "lucide-react";
import { ChatMessage } from "@/components/ChatMessage";
import { ChatInput } from "@/components/ChatInput";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

type Message = {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
};

const Index = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "👋 Welcome to CyberShield! I'm your AI-powered cybersecurity assistant.\n\nI can help you:\n• Identify potential security threats\n• Analyze suspicious emails or activities\n• Provide defensive recommendations\n• Explain cybersecurity concepts\n\nDescribe any suspicious activity, paste suspicious email content, or ask me about potential security threats.",
      timestamp: new Date(),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const streamChat = async (userMessage: string) => {
    const newMessages = [...messages, { role: "user" as const, content: userMessage, timestamp: new Date() }];
    setMessages(newMessages);
    setIsLoading(true);

    let assistantContent = "";

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/cyber-chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          }),
        }
      );

      if (!response.ok) {
        if (response.status === 429) {
          toast.error("Rate limit exceeded. Please try again in a moment.");
          return;
        }
        if (response.status === 402) {
          toast.error("AI credits exhausted. Please add funds to continue.");
          return;
        }
        throw new Error("Failed to get response");
      }

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let streamDone = false;

      const upsertAssistant = (chunk: string) => {
        assistantContent += chunk;
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant") {
            return prev.map((m, i) =>
              i === prev.length - 1 ? { ...m, content: assistantContent } : m
            );
          }
          return [...prev, { role: "assistant" as const, content: assistantContent, timestamp: new Date() }];
        });
      };

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") {
            streamDone = true;
            break;
          }

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) upsertAssistant(content);
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      // Final flush
      if (textBuffer.trim()) {
        for (let raw of textBuffer.split("\n")) {
          if (!raw) continue;
          if (raw.endsWith("\r")) raw = raw.slice(0, -1);
          if (raw.startsWith(":") || raw.trim() === "") continue;
          if (!raw.startsWith("data: ")) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === "[DONE]") continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) upsertAssistant(content);
          } catch {
            /* ignore */
          }
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      toast.error("Failed to get response. Please try again.");
      setMessages(newMessages);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border/50 bg-background/80 backdrop-blur-lg">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">CyberShield</h1>
              <p className="text-xs text-muted-foreground">AI-Powered Threat Detection</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-cyber-green animate-pulse" />
            <span className="text-sm text-muted-foreground">Active</span>
          </div>
        </div>
      </header>

      {/* Chat Area */}
      <main className="flex-1 container mx-auto px-4 py-6">
        <ScrollArea className="h-[calc(100vh-220px)]">
          <div className="flex flex-col gap-4 pb-4">
            {messages.map((message, index) => (
              <ChatMessage
                key={index}
                role={message.role}
                content={message.content}
                timestamp={message.timestamp}
              />
            ))}
            {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
              <div className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
                  <Shield className="h-5 w-5 text-primary animate-pulse" />
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </main>

      {/* Input Area */}
      <footer className="sticky bottom-0 border-t border-border/50 bg-background/80 backdrop-blur-lg">
        <div className="container mx-auto px-4 py-4">
          <ChatInput onSend={streamChat} disabled={isLoading} />
        </div>
      </footer>
    </div>
  );
};

export default Index;
