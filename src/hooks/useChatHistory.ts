import { useState, useEffect, useCallback } from "react";
import { Message } from "@/components/ChatMessage";

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

const STORAGE_KEY = "chatkafi_history";
const MAX_CONVERSATIONS = 50;

export const useChatHistory = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);

  // Load conversations from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Conversation[];
        setConversations(parsed);
        // Set the most recent conversation as active if exists
        if (parsed.length > 0) {
          setActiveConversationId(parsed[0].id);
        }
      }
    } catch (error) {
      console.error("Failed to load chat history:", error);
    }
  }, []);

  // Save conversations to localStorage
  const saveConversations = useCallback((convs: Conversation[]) => {
    try {
      // Keep only the most recent conversations
      const trimmed = convs.slice(0, MAX_CONVERSATIONS);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
      setConversations(trimmed);
    } catch (error) {
      console.error("Failed to save chat history:", error);
    }
  }, []);

  // Generate title from first message
  const generateTitle = (messages: Message[]): string => {
    const firstUserMessage = messages.find(m => m.role === "user");
    if (firstUserMessage) {
      const content = firstUserMessage.content.slice(0, 40);
      return content.length < firstUserMessage.content.length ? `${content}...` : content;
    }
    return "New Chat";
  };

  // Create a new conversation
  const createConversation = useCallback((): string => {
    const newConversation: Conversation = {
      id: crypto.randomUUID(),
      title: "New Chat",
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    
    const updated = [newConversation, ...conversations];
    saveConversations(updated);
    setActiveConversationId(newConversation.id);
    return newConversation.id;
  }, [conversations, saveConversations]);

  // Update conversation messages
  const updateMessages = useCallback((conversationId: string, messages: Message[]) => {
    const updated = conversations.map(conv => {
      if (conv.id === conversationId) {
        return {
          ...conv,
          messages,
          title: messages.length > 0 ? generateTitle(messages) : conv.title,
          updatedAt: Date.now(),
        };
      }
      return conv;
    });
    
    // Sort by updatedAt to keep recent at top
    updated.sort((a, b) => b.updatedAt - a.updatedAt);
    saveConversations(updated);
  }, [conversations, saveConversations]);

  // Delete a conversation
  const deleteConversation = useCallback((conversationId: string) => {
    const updated = conversations.filter(conv => conv.id !== conversationId);
    saveConversations(updated);
    
    if (activeConversationId === conversationId) {
      setActiveConversationId(updated.length > 0 ? updated[0].id : null);
    }
  }, [conversations, activeConversationId, saveConversations]);

  // Get active conversation
  const activeConversation = conversations.find(c => c.id === activeConversationId) || null;

  // Clear all history
  const clearHistory = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setConversations([]);
    setActiveConversationId(null);
  }, []);

  return {
    conversations,
    activeConversation,
    activeConversationId,
    setActiveConversationId,
    createConversation,
    updateMessages,
    deleteConversation,
    clearHistory,
  };
};
