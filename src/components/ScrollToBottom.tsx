import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ScrollToBottomProps {
  show: boolean;
  onClick: () => void;
}

export const ScrollToBottom = ({ show, onClick }: ScrollToBottomProps) => {
  return (
    <Button
      variant="secondary"
      size="icon"
      className={cn(
        "fixed bottom-24 left-1/2 -translate-x-1/2 z-20 rounded-full shadow-lg transition-all duration-300",
        "bg-background/90 backdrop-blur-sm border border-border hover:bg-muted",
        show 
          ? "opacity-100 translate-y-0" 
          : "opacity-0 translate-y-4 pointer-events-none"
      )}
      onClick={onClick}
    >
      <ChevronDown className="h-5 w-5" />
    </Button>
  );
};
