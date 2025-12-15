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
  const [userTranscript, setUserTranscript] = useState('');
  const [aiTranscript, setAiTranscript] = useState('');
  const [pulseScale, setPulseScale] = useState(1);
  const chatRef = useRef<RealtimeChat | null>(null);
  const animationRef = useRef<number>();

  // Animate pulse effect when speaking
  useEffect(() => {
    if (isSpeaking) {
      const animate = () => {
        setPulseScale(1 + Math.sin(Date.now() / 200) * 0.15);
        animationRef.current = requestAnimationFrame(animate);
      };
      animationRef.current = requestAnimationFrame(animate);
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      setPulseScale(1);
    }
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isSpeaking]);

  const handleMessage = useCallback((event: any) => {
    // Handle user transcriptions
    if (event.type === 'conversation.item.input_audio_transcription.completed') {
      const userText = event.transcript;
      if (userText) {
        setUserTranscript(userText);
        onTranscript?.('user', userText);
      }
    }
    
    // Handle AI response streaming
    if (event.type === 'response.audio_transcript.delta') {
      setAiTranscript(prev => prev + event.delta);
    }
    
    // Handle AI response complete
    if (event.type === 'response.audio_transcript.done') {
      if (event.transcript) {
        onTranscript?.('assistant', event.transcript);
      }
    }

    // Reset AI transcript on new response
    if (event.type === 'response.created') {
      setAiTranscript('');
    }
  }, [onTranscript]);

  const startConversation = useCallback(async () => {
    setIsConnecting(true);
    setUserTranscript('');
    setAiTranscript('');
    
    try {
      chatRef.current = new RealtimeChat(
        handleMessage,
        setIsConnected,
        setIsSpeaking
      );
      
      await chatRef.current.init();
      
      toast({
        title: "✓ متصل / Connected",
        description: "ابدأ التحدث الآن / Start speaking now!",
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
    
    toast({
      title: "غير متصل / Disconnected",
      description: "انتهت المحادثة / Call ended",
    });
  }, []);

  useEffect(() => {
    return () => {
      chatRef.current?.disconnect();
    };
  }, []);

  return (
    <div className="flex flex-col items-center gap-6 p-6 h-full">
      {/* Animated Orb */}
      <div className="relative flex items-center justify-center my-4">
        {/* Outer glow rings */}
        {isConnected && (
          <>
            <div 
              className={cn(
                "absolute w-40 h-40 rounded-full transition-all duration-300",
                isSpeaking 
                  ? "bg-emerald-500/10 animate-ping" 
                  : "bg-primary/5"
              )} 
            />
            <div 
              className={cn(
                "absolute w-32 h-32 rounded-full transition-all duration-500",
                isSpeaking 
                  ? "bg-emerald-500/20" 
                  : "bg-primary/10 animate-pulse"
              )} 
            />
          </>
        )}
        
        {/* Main orb */}
        <div 
          className={cn(
            "relative w-28 h-28 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl",
            isConnected 
              ? isSpeaking 
                ? "bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-emerald-500/40" 
                : "bg-gradient-to-br from-primary to-red-600 shadow-primary/40"
              : "bg-gradient-to-br from-muted to-muted/80 shadow-muted/20"
          )}
          style={{ transform: `scale(${pulseScale})` }}
        >
          {/* Inner gradient overlay */}
          <div className="absolute inset-2 rounded-full bg-gradient-to-t from-transparent to-white/20" />
          
          {/* Icon */}
          {isConnecting ? (
            <Loader2 className="w-12 h-12 animate-spin text-white/90" />
          ) : isConnected ? (
            isSpeaking ? (
              <Volume2 className="w-12 h-12 text-white animate-pulse" />
            ) : (
              <Mic className="w-12 h-12 text-white" />
            )
          ) : (
            <MicOff className="w-12 h-12 text-muted-foreground" />
          )}
        </div>

        {/* Sound wave indicators */}
        {isConnected && isSpeaking && (
          <div className="absolute inset-0 flex items-center justify-center">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="absolute w-28 h-28 rounded-full border-2 border-emerald-400/30 animate-ping"
                style={{ 
                  animationDelay: `${i * 0.3}s`,
                  animationDuration: '1.5s'
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Status Text */}
      <div className="text-center space-y-1">
        <p className={cn(
          "text-lg font-semibold transition-colors",
          isConnected 
            ? isSpeaking 
              ? "text-emerald-600 dark:text-emerald-400" 
              : "text-primary"
            : "text-muted-foreground"
        )}>
          {isConnecting 
            ? "جاري الاتصال..." 
            : isConnected 
              ? isSpeaking 
                ? "كيجاوبك..." 
                : "كيسمع ليك..."
              : "اضغط للاتصال"
          }
        </p>
        <p className="text-sm text-muted-foreground">
          {isConnecting 
            ? "Connecting..." 
            : isConnected 
              ? isSpeaking 
                ? "AI is speaking..." 
                : "Listening to you..."
              : "Tap to start voice chat"
          }
        </p>
      </div>

      {/* Transcripts */}
      {isConnected && (userTranscript || aiTranscript) && (
        <div className="w-full max-w-sm space-y-3 bg-muted/50 rounded-xl p-4 max-h-32 overflow-y-auto">
          {userTranscript && (
            <div className="text-right">
              <span className="text-xs text-muted-foreground mb-1 block">أنت / You</span>
              <p className="text-sm bg-primary/10 rounded-lg px-3 py-2 inline-block text-right">
                {userTranscript}
              </p>
            </div>
          )}
          {aiTranscript && (
            <div className="text-left">
              <span className="text-xs text-muted-foreground mb-1 block">ChatKafi</span>
              <p className="text-sm bg-emerald-500/10 rounded-lg px-3 py-2 inline-block">
                {aiTranscript}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Control Button */}
      <div className="flex flex-col items-center gap-3 mt-auto pb-4">
        <Button
          onClick={isConnected ? endConversation : startConversation}
          disabled={isConnecting}
          size="lg"
          className={cn(
            "rounded-full w-16 h-16 p-0 transition-all duration-300 shadow-lg",
            isConnected 
              ? "bg-red-500 hover:bg-red-600 shadow-red-500/30" 
              : "bg-gradient-to-br from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-emerald-500/30"
          )}
        >
          {isConnecting ? (
            <Loader2 className="w-7 h-7 animate-spin text-white" />
          ) : isConnected ? (
            <PhoneOff className="w-7 h-7 text-white" />
          ) : (
            <Phone className="w-7 h-7 text-white" />
          )}
        </Button>
        
        <p className="text-xs text-muted-foreground font-medium">
          {isConnected 
            ? "اضغط للإنهاء / End Call" 
            : "محادثة صوتية بالدارجة / Voice Chat"
          }
        </p>
      </div>
    </div>
  );
};
