import { Shield, AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  timestamp?: Date;
}

export const ChatMessage = ({ role, content, timestamp }: ChatMessageProps) => {
  const isUser = role === "user";

  // Parse AI responses to extract threat info
  const parseThreatLevel = (text: string) => {
    if (text.includes("Risk Level: Critical") || text.includes("CRITICAL")) return "critical";
    if (text.includes("Risk Level: High") || text.includes("HIGH")) return "high";
    if (text.includes("Risk Level: Medium") || text.includes("MEDIUM")) return "medium";
    if (text.includes("Risk Level: Low") || text.includes("LOW")) return "low";
    return null;
  };

  const threatLevel = parseThreatLevel(content);

  const getThreatIcon = () => {
    switch (threatLevel) {
      case "critical":
        return <AlertTriangle className="h-5 w-5 text-cyber-red" />;
      case "high":
        return <AlertTriangle className="h-5 w-5 text-cyber-orange" />;
      case "medium":
        return <Info className="h-5 w-5 text-cyber-blue" />;
      case "low":
        return <CheckCircle2 className="h-5 w-5 text-cyber-green" />;
      default:
        return <Shield className="h-5 w-5 text-primary" />;
    }
  };

  const getThreatBadge = () => {
    if (!threatLevel) return null;
    
    const colors = {
      critical: "bg-cyber-red/20 text-cyber-red border-cyber-red/50",
      high: "bg-cyber-orange/20 text-cyber-orange border-cyber-orange/50",
      medium: "bg-cyber-blue/20 text-cyber-blue border-cyber-blue/50",
      low: "bg-cyber-green/20 text-cyber-green border-cyber-green/50"
    };

    return (
      <Badge variant="outline" className={`${colors[threatLevel]} mb-2`}>
        {threatLevel.toUpperCase()} THREAT
      </Badge>
    );
  };

  return (
    <div className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
      {!isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
          {getThreatIcon()}
        </div>
      )}
      
      <Card className={`max-w-[80%] p-4 ${isUser ? "bg-primary/10 border-primary/20" : "bg-card"}`}>
        {!isUser && getThreatBadge()}
        
        <div className="text-sm leading-relaxed whitespace-pre-wrap">
          {content}
        </div>
        
        {timestamp && (
          <div className="mt-2 text-xs text-muted-foreground">
            {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        )}
      </Card>

      {isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
          <div className="text-sm font-semibold">You</div>
        </div>
      )}
    </div>
  );
};
