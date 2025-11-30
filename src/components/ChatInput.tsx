import { useState, KeyboardEvent, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Image, X, Camera } from "lucide-react";
import { CameraCapture } from "./CameraCapture";

interface ChatInputProps {
  onSend: (message: string, imageData?: string) => void;
  disabled?: boolean;
}

export const ChatInput = ({ onSend, disabled }: ChatInputProps) => {
  const [input, setInput] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCameraCapture = (imageData: string) => {
    setSelectedImage(imageData);
  };

  const handleSend = () => {
    if ((input.trim() || selectedImage) && !disabled) {
      onSend(input.trim(), selectedImage || undefined);
      setInput("");
      setSelectedImage(null);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      <CameraCapture
        open={cameraOpen}
        onClose={() => setCameraOpen(false)}
        onCapture={handleCameraCapture}
      />
      <div className="border-t bg-background p-4">
        <div className="max-w-4xl mx-auto">
          {selectedImage && (
            <div className="mb-3 relative inline-block animate-in fade-in duration-300">
              <img src={selectedImage} alt="Selected" className="max-h-32 rounded-lg border shadow-sm" />
              <Button
                size="icon"
                variant="destructive"
                className="absolute -top-2 -right-2 h-6 w-6 rounded-full shadow-lg"
                onClick={() => setSelectedImage(null)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}
          <div className="flex gap-2 items-end">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />
            <Button
              onClick={() => setCameraOpen(true)}
              disabled={disabled}
              size="icon"
              variant="outline"
              className="h-12 w-12 rounded-xl hover-scale shrink-0"
              title="Take photo"
            >
              <Camera className="h-5 w-5" />
            </Button>
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled}
              size="icon"
              variant="outline"
              className="h-12 w-12 rounded-xl hover-scale shrink-0"
              title="Upload image"
            >
              <Image className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message..."
                disabled={disabled}
                className="min-h-[48px] max-h-[200px] resize-none focus-visible:ring-primary"
              />
            </div>
            <Button
              onClick={handleSend}
              disabled={(!input.trim() && !selectedImage) || disabled}
              size="icon"
              className="h-12 w-12 rounded-xl hover-scale shrink-0"
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};
