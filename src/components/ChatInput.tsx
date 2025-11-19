import { useState } from "react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Send } from "lucide-react";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export const ChatInput = ({ onSend, disabled }: ChatInputProps) => {
  const [input, setInput] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !disabled) {
      onSend(input.trim());
      setInput("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Describe suspicious activity, paste email content, or ask about potential threats..."
        disabled={disabled}
        className="min-h-[60px] max-h-[200px] resize-none bg-card border-border focus:border-primary transition-colors"
      />
      <Button 
        type="submit" 
        disabled={disabled || !input.trim()}
        className="shrink-0 h-[60px] w-[60px] p-0"
      >
        <Send className="h-5 w-5" />
      </Button>
    </form>
  );
};
