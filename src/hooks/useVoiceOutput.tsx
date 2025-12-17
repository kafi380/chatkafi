import { useState, useCallback, useRef, useEffect } from 'react';

interface UseVoiceOutputOptions {
  onError?: (error: string) => void;
}

// Detect language from text
const detectLanguage = (text: string): string => {
  // Arabic/Darija detection (Arabic script)
  if (/[\u0600-\u06FF]/.test(text)) return "ar-SA";
  
  // French common words
  const frenchPatterns = /\b(je|tu|il|elle|nous|vous|bonjour|merci|oui|non|est|sont|les|des|une|pour|avec|dans|sur|par|plus|tout|faire|bien|très|aussi|comme|mais|quand|encore)\b/i;
  if (frenchPatterns.test(text)) return "fr-FR";
  
  // Default to English
  return "en-US";
};

export const useVoiceOutput = ({ onError }: UseVoiceOutputOptions = {}) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);
    };

    if ('speechSynthesis' in window) {
      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const getVoiceForLanguage = useCallback((lang: string) => {
    // Try to find a voice matching the language
    const exactMatch = voices.find(v => v.lang === lang);
    if (exactMatch) return exactMatch;

    // Try partial match (e.g., "en" matches "en-US")
    const langPrefix = lang.split('-')[0];
    const partialMatch = voices.find(v => v.lang.startsWith(langPrefix));
    if (partialMatch) return partialMatch;

    // Fallback to default or first available
    return voices.find(v => v.default) || voices[0];
  }, [voices]);

  const speak = useCallback((text: string) => {
    if (!text.trim()) return;
    if (!('speechSynthesis' in window)) {
      onError?.("Speech synthesis not supported in this browser");
      return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();
    setIsLoading(true);

    // Detect language from text
    const detectedLang = detectLanguage(text);
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = detectedLang;
    utterance.rate = 0.95;
    utterance.pitch = 1;

    const voice = getVoiceForLanguage(detectedLang);
    if (voice) {
      utterance.voice = voice;
    }

    utterance.onstart = () => {
      setIsLoading(false);
      setIsSpeaking(true);
    };
    
    utterance.onend = () => {
      setIsSpeaking(false);
    };
    
    utterance.onerror = (event) => {
      setIsLoading(false);
      setIsSpeaking(false);
      if (event.error !== 'canceled') {
        onError?.("Failed to speak text");
      }
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [getVoiceForLanguage, onError]);

  const stop = useCallback(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setIsLoading(false);
  }, []);

  return {
    isSpeaking,
    isLoading,
    isSupported: 'speechSynthesis' in window,
    speak,
    stop,
  };
};
