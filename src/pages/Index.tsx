import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ChatMessage, Message, FileData } from "@/components/ChatMessage";
import { ChatInput } from "@/components/ChatInput";
import { TypingIndicator } from "@/components/TypingIndicator";
import { ChatSidebar } from "@/components/ChatSidebar";
import { ScrollToBottom } from "@/components/ScrollToBottom";
import { LogOut, User, Menu } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useChatHistory } from "@/hooks/useChatHistory";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Index = () => {
  const navigate = useNavigate();
  const { user, loading, signOut } = useAuth();
  const {
    conversations,
    activeConversation,
    activeConversationId,
    setActiveConversationId,
    createConversation,
    updateMessages,
    deleteConversation,
    clearHistory,
  } = useChatHistory();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [userScrolledUp, setUserScrolledUp] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  
  const isGuest = !user;

  // Sync messages with active conversation
  useEffect(() => {
    if (activeConversation) {
      setMessages(activeConversation.messages);
    } else {
      setMessages([]);
    }
  }, [activeConversation]);

  // Save messages to history when they change
  useEffect(() => {
    if (activeConversationId && messages.length > 0) {
      updateMessages(activeConversationId, messages);
    }
  }, [messages, activeConversationId, updateMessages]);

  // Scroll handling - ChatGPT style
  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
    setUserScrolledUp(false);
  }, []);

  // Handle scroll events to show/hide scroll button
  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    
    const { scrollTop, scrollHeight, clientHeight } = container;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    
    // Show button if user is more than 100px from bottom
    const isScrolledUp = distanceFromBottom > 100;
    setShowScrollButton(isScrolledUp);
    setUserScrolledUp(isScrolledUp);
  }, []);

  // Auto-scroll when new messages arrive (only if user hasn't scrolled up)
  useEffect(() => {
    if (!userScrolledUp) {
      scrollToBottom();
    }
  }, [messages, userScrolledUp, scrollToBottom]);

  // Handle new chat
  const handleNewChat = useCallback(() => {
    const newId = createConversation();
    setMessages([]);
    setActiveConversationId(newId);
  }, [createConversation, setActiveConversationId]);

  // Check if message is an image generation request
  const isImageRequest = (text: string): string | null => {
    const lowerText = text.toLowerCase();
    const imageKeywords = [
      'generate image', 'create image', 'make image', 'draw', 'generate a picture',
      'create a picture', 'make a picture', 'generate an image', 'create an image',
      'صور', 'رسم', 'اصنع صورة', 'ارسم', 'dir sora', 'rsm', 'sawwer'
    ];
    
    for (const keyword of imageKeywords) {
      if (lowerText.includes(keyword)) {
        const index = lowerText.indexOf(keyword);
        const afterKeyword = text.slice(index + keyword.length).trim();
        const cleanedPrompt = afterKeyword.replace(/^(of|a|an|the|for|about)\s+/i, '').trim();
        return cleanedPrompt || text;
      }
    }
    return null;
  };

  const generateImage = async (prompt: string): Promise<string> => {
    const IMAGE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-image`;
    
    const resp = await fetch(IMAGE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ prompt }),
    });

    if (!resp.ok) {
      const errorData = await resp.json().catch(() => ({}));
      throw new Error(errorData.error || "Failed to generate image");
    }

    const data = await resp.json();
    return data.imageUrl;
  };

  const streamChat = async (chatMessages: Message[]) => {
    const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;
    
    const resp = await fetch(CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ messages: chatMessages }),
    });

    if (!resp.ok) {
      const errorData = await resp.json().catch(() => ({}));
      if (resp.status === 429) {
        throw new Error("Rate limits exceeded. Please try again later.");
      }
      if (resp.status === 402) {
        throw new Error("Payment required. Please add funds to your workspace.");
      }
      throw new Error(errorData.error || "Failed to get response");
    }

    if (!resp.body) throw new Error("No response body");

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let textBuffer = "";
    let assistantContent = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      textBuffer += decoder.decode(value, { stream: true });

      let newlineIndex: number;
      while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
        let line = textBuffer.slice(0, newlineIndex);
        textBuffer = textBuffer.slice(newlineIndex + 1);

        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (line.startsWith(":") || line.trim() === "") continue;
        if (!line.startsWith("data: ")) continue;

        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") break;

        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) {
            assistantContent += content;
            setMessages(prev => {
              const last = prev[prev.length - 1];
              if (last?.role === "assistant") {
                return prev.map((m, i) => 
                  i === prev.length - 1 ? { ...m, content: assistantContent } : m
                );
              }
              return [...prev, { role: "assistant", content: assistantContent }];
            });
          }
        } catch {
          textBuffer = line + "\n" + textBuffer;
          break;
        }
      }
    }
  };

  const handleSend = async (input: string, imageData?: string, fileData?: FileData) => {
    // Create new conversation if none exists
    let convId = activeConversationId;
    if (!convId) {
      convId = createConversation();
    }

    const userMsg: Message = { 
      role: "user", 
      content: input, 
      imageUrl: imageData,
      fileData: fileData
    };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);
    setUserScrolledUp(false); // Auto-scroll for new messages

    try {
      const imagePrompt = isImageRequest(input);
      
      if (imagePrompt) {
        setMessages(prev => [...prev, { 
          role: "assistant", 
          content: "🎨 Generating your image with Nano banana..." 
        }]);
        
        const generatedImageUrl = await generateImage(imagePrompt);
        
        setMessages(prev => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1] = {
            role: "assistant",
            content: "Here's your generated image:",
            imageUrl: generatedImageUrl
          };
          return newMessages;
        });
      } else {
        await streamChat([...messages, userMsg]);
      }
    } catch (error) {
      console.error("Chat error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send message",
        variant: "destructive",
      });
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant" && last.content.includes("Generating")) {
          return prev.slice(0, -1);
        }
        return prev.slice(0, -1);
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const userInitials = user?.user_metadata?.full_name
    ? user.user_metadata.full_name.split(" ").map((n: string) => n[0]).join("").toUpperCase()
    : user?.email?.charAt(0).toUpperCase() || "G";

  return (
    <div className="flex h-screen bg-gradient-to-br from-emerald-100/60 via-background to-red-100/50 dark:from-emerald-950/30 dark:via-background dark:to-red-950/40 relative overflow-hidden">
      {/* Chat History Sidebar */}
      <ChatSidebar
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={setActiveConversationId}
        onNewChat={handleNewChat}
        onDeleteConversation={deleteConversation}
        onClearHistory={clearHistory}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col relative overflow-hidden">
        {/* Moroccan Zellige Pattern Overlay */}
        <div className="absolute inset-0 opacity-[0.06] dark:opacity-[0.08] pointer-events-none" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke-width='1.5'%3E%3Cpath d='M40 0 L80 40 L40 80 L0 40 Z' stroke='%23166534' stroke-opacity='0.8'/%3E%3Cpath d='M40 10 L70 40 L40 70 L10 40 Z' stroke='%23dc2626' stroke-opacity='0.6'/%3E%3Cpath d='M40 20 L60 40 L40 60 L20 40 Z' stroke='%23166534' stroke-opacity='0.7'/%3E%3Ccircle cx='40' cy='40' r='8' stroke='%23dc2626' stroke-opacity='0.5'/%3E%3Cpath d='M40 0 L40 80 M0 40 L80 40' stroke='%23166534' stroke-opacity='0.4'/%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '80px 80px'
        }} />
        
        {/* Accent decorations */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-red-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 left-1/3 w-64 h-64 bg-red-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/3 w-48 h-48 bg-emerald-400/12 rounded-full blur-2xl pointer-events-none" />
        
        {/* Header */}
        <header className="border-b border-red-100/50 dark:border-red-900/20 bg-background/80 backdrop-blur-sm sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Sidebar Toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden"
              >
                <Menu className="h-5 w-5" />
              </Button>
              
              <div className="p-2 bg-gradient-to-br from-red-600 to-red-700 rounded-xl shadow-lg shadow-red-500/20">
                <svg className="h-6 w-6" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path 
                    d="M50 5 L61.8 38.2 L97.5 38.2 L68.9 58.8 L80.9 92 L50 71.4 L19.1 92 L31.1 58.8 L2.5 38.2 L38.2 38.2 Z" 
                    stroke="#4ade80" 
                    strokeWidth="6" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                    fill="none"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-red-600 to-emerald-600 bg-clip-text text-transparent">
                  ChatKafi
                </h1>
                <p className="text-sm text-muted-foreground">daka2 2istina3i</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {/* New Chat Button - Desktop */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleNewChat}
                className="hidden sm:flex"
              >
                New Chat
              </Button>
              
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user.user_metadata?.avatar_url} alt={user.email || ""} />
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {userInitials}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {user.user_metadata?.full_name || "User"}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="text-destructive cursor-pointer">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button onClick={() => navigate("/auth")} variant="outline">
                  <User className="mr-2 h-4 w-4" />
                  Sign In
                </Button>
              )}
            </div>
          </div>
        </header>

        {/* Messages */}
        <main 
          ref={messagesContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto px-4 py-6 scroll-smooth"
        >
          <div className="max-w-4xl mx-auto">
            {messages.length === 0 && (
              <div className="text-center py-12 animate-in fade-in duration-500">
                <div className="inline-flex p-4 bg-gradient-to-br from-emerald-100 to-red-50 dark:from-emerald-900/30 dark:to-red-800/20 rounded-2xl mb-4 shadow-lg shadow-red-500/20 border border-red-200/30 dark:border-red-800/30">
                  <svg className="h-14 w-14" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path 
                      d="M50 5 L61.8 38.2 L97.5 38.2 L68.9 58.8 L80.9 92 L50 71.4 L19.1 92 L31.1 58.8 L2.5 38.2 L38.2 38.2 Z" 
                      stroke="#dc2626" 
                      strokeWidth="5" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                      fill="none"
                    />
                    <path 
                      d="M50 15 L58.5 40 L85 40 L63 55 L72 82 L50 66 L28 82 L37 55 L15 40 L41.5 40 Z" 
                      stroke="#166534" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                      fill="none"
                      opacity="0.6"
                    />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-red-600 to-emerald-600 bg-clip-text text-transparent">mar7baa biik</h2>
                <p className="text-red-600 dark:text-red-500 max-w-md mx-auto font-extrabold text-lg">
                  swwlo li bghiti ayjawbk flblassa
                </p>
              </div>
            )}
            
            {messages.map((message, index) => (
              <ChatMessage key={index} role={message.role} content={message.content} imageUrl={message.imageUrl} fileData={message.fileData} />
            ))}
            {isLoading && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </div>
        </main>

        {/* Scroll to Bottom Button */}
        <ScrollToBottom 
          show={showScrollButton} 
          onClick={() => scrollToBottom("smooth")} 
        />

        {/* Input */}
        <ChatInput onSend={handleSend} disabled={isLoading} isGuest={isGuest} />
      </div>
    </div>
  );
};

export default Index;
