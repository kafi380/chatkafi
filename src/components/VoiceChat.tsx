import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { RealtimeChat } from '@/utils/RealtimeAudio';
import { Mic, MicOff, Phone, PhoneOff, Loader2, Volume2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VoiceChatProps {
  onTranscript?: (role: 'user' | 'assistant', text: string) => void;
}

export const VoiceChat = ({ onTranscript }: VoiceChatProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const chatRef = useRef<RealtimeChat | null>(null);

  const handleMessage = useCallback((event: any) => {
    // Handle transcriptions
    if (event.type === 'conversation.item.input_audio_transcription.completed') {
      const userText = event.transcript;
      if (userText) {
        setTranscript(`You: ${userText}`);
        onTranscript?.('user', userText);
      }
    }
    
    if (event.type === 'response.audio_transcript.delta') {
      setTranscript(prev => {
        if (prev.startsWith('AI: ')) {
          return prev + event.delta;
        }
        return `AI: ${event.delta}`;
      });
    }
    
    if (event.type === 'response.audio_transcript.done') {
      if (event.transcript) {
        onTranscript?.('assistant', event.transcript);
      }
    }
  }, [onTranscript]);

  const startConversation = useCallback(async () => {
    setIsConnecting(true);
    
    try {
      chatRef.current = new RealtimeChat(
        handleMessage,
        setIsConnected,
        setIsSpeaking
      );
      
      await chatRef.current.init();
      
      toast({
        title: "متصل / Connected",
        description: "Voice chat is ready. Start speaking!",
      });
    } catch (error) {
      console.error('Error starting conversation:', error);
      toast({
        title: "خطأ / Error",
        description: error instanceof Error ? error.message : 'Failed to start voice chat',
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  }, [handleMessage]);

  const endConversation = useCallback(() => {
    chatRef.current?.disconnect();
    chatRef.current = null;
    setIsConnected(false);
    setIsSpeaking(false);
    setTranscript('');
    
    toast({
      title: "غير متصل / Disconnected",
      description: "Voice chat ended",
    });
  }, []);

  useEffect(() => {
    return () => {
      chatRef.current?.disconnect();
    };
  }, []);

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      {/* Visual feedback orb */}
      <div 
        className={cn(
          "w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300",
          isConnected 
            ? isSpeaking 
              ? "bg-emerald-500/20 animate-pulse shadow-lg shadow-emerald-500/30" 
              : "bg-primary/20 shadow-md"
            : "bg-muted"
        )}
      >
        {isConnecting ? (
          <Loader2 className="w-10 h-10 animate-spin text-muted-foreground" />
        ) : isConnected ? (
          isSpeaking ? (
            <Volume2 className="w-10 h-10 text-emerald-500 animate-pulse" />
          ) : (
            <Mic className="w-10 h-10 text-primary" />
          )
        ) : (
          <MicOff className="w-10 h-10 text-muted-foreground" />
        )}
      </div>

      {/* Status text */}
      <div className="text-center min-h-[60px]">
        <p className="text-sm text-muted-foreground">
          {isConnecting 
            ? "جاري الاتصال... / Connecting..." 
            : isConnected 
              ? isSpeaking 
                ? "كيتكلم... / Speaking..." 
                : "كيسمع... / Listening..."
              : "اضغط لبدء المحادثة / Tap to start"
          }
        </p>
        {transcript && (
          <p className="text-xs text-muted-foreground mt-2 max-w-xs truncate">
            {transcript}
          </p>
        )}
      </div>

      {/* Control button */}
      <Button
        onClick={isConnected ? endConversation : startConversation}
        disabled={isConnecting}
        size="lg"
        variant={isConnected ? "destructive" : "default"}
        className={cn(
          "rounded-full w-16 h-16 p-0",
          isConnected && "animate-pulse"
        )}
      >
        {isConnecting ? (
          <Loader2 className="w-6 h-6 animate-spin" />
        ) : isConnected ? (
          <PhoneOff className="w-6 h-6" />
        ) : (
          <Phone className="w-6 h-6" />
        )}
      </Button>

      <p className="text-xs text-muted-foreground">
        {isConnected ? "اضغط للإنهاء / Tap to end" : "محادثة صوتية / Voice Chat"}
      </p>
    </div>
  );
};
