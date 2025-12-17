import { useState, KeyboardEvent, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Image, X, Camera, Paperclip, FileText, File } from "lucide-react";
import { CameraCapture } from "./CameraCapture";
import { VoiceButton } from "./VoiceButton";
import { useVoiceInput } from "@/hooks/useVoiceInput";
import { toast } from "@/hooks/use-toast";

interface ChatInputProps {
  onSend: (message: string, imageData?: string, fileData?: { name: string; type: string; data: string }) => void;
  disabled?: boolean;
  isGuest?: boolean;
}

interface SelectedFile {
  name: string;
  type: string;
  data: string;
  isImage: boolean;
}

export const ChatInput = ({ onSend, disabled, isGuest = false }: ChatInputProps) => {
  const [input, setInput] = useState("");
  const [selectedFile, setSelectedFile] = useState<SelectedFile | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const handleVoiceTranscript = useCallback((transcript: string) => {
    setInput(prev => prev ? `${prev} ${transcript}` : transcript);
    toast({
      title: "Voice captured",
      description: "Your voice has been transcribed. Edit or send the message.",
    });
  }, []);

  const { isListening, isSupported: voiceInputSupported, toggleListening } = useVoiceInput({
    onTranscript: handleVoiceTranscript,
    language: 'ar-MA', // Moroccan Arabic/Darija
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, isImageOnly: boolean) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const isImage = file.type.startsWith("image/");
        setSelectedFile({
          name: file.name,
          type: file.type,
          data: reader.result as string,
          isImage
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCameraCapture = (imageData: string) => {
    setSelectedFile({
      name: "camera-capture.jpg",
      type: "image/jpeg",
      data: imageData,
      isImage: true
    });
  };

  const handleSend = () => {
    if ((input.trim() || selectedFile) && !disabled) {
      if (selectedFile?.isImage) {
        onSend(input.trim(), selectedFile.data, undefined);
      } else if (selectedFile) {
        onSend(input.trim(), undefined, { name: selectedFile.name, type: selectedFile.type, data: selectedFile.data });
      } else {
        onSend(input.trim());
      }
      setInput("");
      setSelectedFile(null);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const getFileIcon = (type: string) => {
    if (type.includes("pdf")) return <FileText className="h-8 w-8 text-red-500" />;
    if (type.includes("word") || type.includes("document")) return <FileText className="h-8 w-8 text-blue-500" />;
    if (type.includes("sheet") || type.includes("excel")) return <FileText className="h-8 w-8 text-green-500" />;
    return <File className="h-8 w-8 text-muted-foreground" />;
  };

  const handleVoiceClick = () => {
    if (!voiceInputSupported) {
      toast({
        title: "Voice not supported",
        description: "Your browser doesn't support voice input. Try Chrome or Edge.",
        variant: "destructive",
      });
      return;
    }
    toggleListening();
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
          {selectedFile && (
            <div className="mb-3 relative inline-block animate-in fade-in duration-300">
              {selectedFile.isImage ? (
                <img src={selectedFile.data} alt="Selected" className="max-h-32 rounded-lg border shadow-sm" />
              ) : (
                <div className="flex items-center gap-3 px-4 py-3 rounded-lg border bg-muted/50 shadow-sm">
                  {getFileIcon(selectedFile.type)}
                  <div className="flex flex-col">
                    <span className="text-sm font-medium truncate max-w-[200px]">{selectedFile.name}</span>
                    <span className="text-xs text-muted-foreground">{selectedFile.type.split("/")[1]?.toUpperCase() || "FILE"}</span>
                  </div>
                </div>
              )}
              <Button
                size="icon"
                variant="destructive"
                className="absolute -top-2 -right-2 h-6 w-6 rounded-full shadow-lg"
                onClick={() => setSelectedFile(null)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}
          <div className="flex gap-2 items-end">
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => handleFileSelect(e, true)}
              className="hidden"
            />
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.json,.md"
              onChange={(e) => handleFileSelect(e, false)}
              className="hidden"
            />
            <VoiceButton
              type="input"
              isListening={isListening}
              onClick={handleVoiceClick}
              disabled={disabled || isGuest}
              title={isGuest ? "Sign in to use voice input" : undefined}
            />
            <Button
              onClick={() => setCameraOpen(true)}
              disabled={disabled || isGuest}
              size="icon"
              variant="outline"
              className="h-12 w-12 rounded-xl hover-scale shrink-0"
              title={isGuest ? "Sign in to use camera" : "Take photo"}
            >
              <Camera className="h-5 w-5" />
            </Button>
            <Button
              onClick={() => imageInputRef.current?.click()}
              disabled={disabled || isGuest}
              size="icon"
              variant="outline"
              className="h-12 w-12 rounded-xl hover-scale shrink-0"
              title={isGuest ? "Sign in to upload images" : "Upload image"}
            >
              <Image className="h-5 w-5" />
            </Button>
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || isGuest}
              size="icon"
              variant="outline"
              className="h-12 w-12 rounded-xl hover-scale shrink-0"
              title={isGuest ? "Sign in to upload files" : "Upload file"}
            >
              <Paperclip className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isListening ? "Listening..." : "Type a message..."}
                disabled={disabled || isListening}
                className="min-h-[48px] max-h-[200px] resize-none focus-visible:ring-primary"
              />
            </div>
            <Button
              onClick={handleSend}
              disabled={(!input.trim() && !selectedFile) || disabled}
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