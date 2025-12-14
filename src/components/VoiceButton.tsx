import { Mic, MicOff, Volume2, VolumeX, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface VoiceButtonProps {
  isListening?: boolean;
  isSpeaking?: boolean;
  isLoading?: boolean;
  onClick: () => void;
  disabled?: boolean;
  type: 'input' | 'output';
  className?: string;
}

export const VoiceButton = ({
  isListening,
  isSpeaking,
  isLoading,
  onClick,
  disabled,
  type,
  className,
}: VoiceButtonProps) => {
  const isActive = type === 'input' ? isListening : isSpeaking;

  return (
    <Button
      onClick={onClick}
      disabled={disabled || isLoading}
      size="icon"
      variant={isActive ? "default" : "outline"}
      className={cn(
        "h-12 w-12 rounded-xl hover-scale shrink-0 transition-all duration-300",
        isActive && type === 'input' && "bg-red-500 hover:bg-red-600 animate-pulse",
        isActive && type === 'output' && "bg-emerald-500 hover:bg-emerald-600",
        className
      )}
      title={
        type === 'input' 
          ? (isListening ? "Stop listening" : "Start voice input (Darija supported)")
          : (isSpeaking ? "Stop speaking" : "Listen to response")
      }
    >
      {isLoading ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : type === 'input' ? (
        isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />
      ) : (
        isSpeaking ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />
      )}
    </Button>
  );
};
