import { cn } from "@/lib/utils";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  imageUrl?: string;
}

export const ChatMessage = ({ role, content, imageUrl }: ChatMessageProps) => {
  return (
    <div
      className={cn(
        "flex w-full mb-4 animate-in fade-in slide-in-from-bottom-2 duration-300",
        role === "user" ? "justify-end" : "justify-start"
      )}
    >
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-6 py-4 shadow-sm",
          role === "user"
            ? "bg-primary text-primary-foreground ml-12"
            : "bg-muted text-foreground mr-12"
        )}
      >
        {imageUrl && (
          <img src={imageUrl} alt="Uploaded" className="max-w-full rounded-lg mb-2 max-h-64 object-contain" />
        )}
        {content && <p className="whitespace-pre-wrap leading-relaxed">{content}</p>}
      </div>
    </div>
  );
};
