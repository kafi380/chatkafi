import { cn } from "@/lib/utils";
import { FileText, File, ExternalLink, Volume2, VolumeX, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useVoiceOutput } from "@/hooks/useVoiceOutput";

export interface FileData {
  name: string;
  type: string;
  data: string;
}

export interface Message {
  role: "user" | "assistant";
  content: string;
  imageUrl?: string;
  fileData?: FileData;
}

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  imageUrl?: string;
  fileData?: FileData;
}

const getFileIcon = (type: string) => {
  if (type.includes("pdf")) return <FileText className="h-6 w-6 text-red-500" />;
  if (type.includes("word") || type.includes("document")) return <FileText className="h-6 w-6 text-blue-500" />;
  if (type.includes("sheet") || type.includes("excel")) return <FileText className="h-6 w-6 text-green-500" />;
  return <File className="h-6 w-6 text-muted-foreground" />;
};

export const ChatMessage = ({ role, content, imageUrl, fileData }: ChatMessageProps) => {
  const { isSpeaking, isSupported, speak, stop } = useVoiceOutput({
    language: 'ar-SA', // Arabic for Darija support
    rate: 0.9,
  });

  const handleSpeak = () => {
    if (isSpeaking) {
      stop();
    } else if (content) {
      speak(content);
    }
  };

  return (
    <div
      className={cn(
        "flex w-full mb-4 animate-in fade-in slide-in-from-bottom-2 duration-300",
        role === "user" ? "justify-end" : "justify-start"
      )}
    >
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-6 py-4 shadow-sm relative group",
          role === "user"
            ? "bg-primary text-primary-foreground ml-12"
            : "bg-muted text-foreground mr-12"
        )}
      >
        {imageUrl && (
          <img src={imageUrl} alt="Uploaded" className="max-w-full rounded-lg mb-2 max-h-64 object-contain" />
        )}
        {fileData && (
          <a 
            href={fileData.data} 
            download={fileData.name}
            className={cn(
              "flex items-center gap-3 p-3 rounded-lg mb-2 transition-colors",
              role === "user" ? "bg-primary-foreground/10 hover:bg-primary-foreground/20" : "bg-background hover:bg-background/80"
            )}
          >
            {getFileIcon(fileData.type)}
            <div className="flex flex-col flex-1 min-w-0">
              <span className={cn("text-sm font-medium truncate", role === "user" ? "text-primary-foreground" : "text-foreground")}>{fileData.name}</span>
              <span className={cn("text-xs", role === "user" ? "text-primary-foreground/70" : "text-muted-foreground")}>{fileData.type.split("/")[1]?.toUpperCase() || "FILE"}</span>
            </div>
            <ExternalLink className={cn("h-4 w-4", role === "user" ? "text-primary-foreground/70" : "text-muted-foreground")} />
          </a>
        )}
        {content && <p className="whitespace-pre-wrap leading-relaxed">{content}</p>}
        
        {/* Voice output button for assistant messages */}
        {role === "assistant" && content && isSupported && (
          <Button
            onClick={handleSpeak}
            size="icon"
            variant="ghost"
            className={cn(
              "absolute -bottom-2 -right-2 h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg",
              isSpeaking 
                ? "bg-emerald-500 hover:bg-emerald-600 text-white" 
                : "bg-background hover:bg-muted border"
            )}
            title={isSpeaking ? "Stop speaking" : "Listen to message (سمع الرسالة)"}
          >
            {isSpeaking ? (
              <VolumeX className="h-4 w-4" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>
    </div>
  );
};