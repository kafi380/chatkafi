import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Detect language from text
function detectLanguage(text: string): string {
  // Arabic/Darija detection (including Arabic script)
  if (/[\u0600-\u06FF]/.test(text)) return "ar";
  
  // French common words and patterns
  const frenchPatterns = /\b(je|tu|il|elle|nous|vous|ils|elles|le|la|les|un|une|des|est|sont|avoir|être|faire|dire|aller|voir|venir|pouvoir|vouloir|devoir|falloir|savoir|prendre|donner|trouver|parler|mettre|passer|regarder|aimer|croire|demander|rester|répondre|entendre|penser|arriver|connaître|devenir|sentir|attendre|vivre|chercher|sortir|partir|revenir|entrer|porter|tomber|appeler|écrire|finir|perdre|commencer|servir|suivre|ouvrir|mourir|offrir|lire|courir|recevoir|apprendre|comprendre|tenir|boire|plaire|paraître|naître|manger|dormir|jouer|marcher|monter|chanter|danser|écouter|acheter|envoyer|essayer|expliquer|garder|jeter|lever|payer|quitter|rappeler|rencontrer|rentrer|répéter|réussir|sembler|tirer|tourner|travailler|utiliser|bonjour|bonsoir|merci|s'il vous plaît|excusez-moi|pardon|oui|non|peut-être|aujourd'hui|demain|hier|maintenant|toujours|jamais|souvent|parfois|beaucoup|peu|très|trop|assez|bien|mal|mieux|plus|moins|encore|déjà|aussi|seulement|alors|donc|mais|ou|et|si|que|qui|quoi|où|quand|comment|pourquoi|combien)\b/i;
  if (frenchPatterns.test(text)) return "fr";
  
  // Default to English
  return "en";
}

// Choose voice based on language
function getVoiceForLanguage(lang: string): string {
  switch (lang) {
    case "ar": return "onyx"; // Deep, warm voice good for Arabic
    case "fr": return "nova"; // Soft, natural voice good for French
    default: return "alloy"; // Balanced voice for English
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, language } = await req.json();
    
    if (!text) {
      return new Response(JSON.stringify({ error: "Text is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not configured");
    }

    // Auto-detect language if not provided
    const detectedLang = language || detectLanguage(text);
    const voice = getVoiceForLanguage(detectedLang);
    
    console.log(`TTS request - Language: ${detectedLang}, Voice: ${voice}, Text length: ${text.length}`);

    const response = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "tts-1-hd", // High-definition model for better quality
        input: text,
        voice: voice,
        response_format: "mp3",
        speed: 1.0,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI TTS error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "Failed to generate speech" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Return audio as binary
    const audioBuffer = await response.arrayBuffer();
    
    return new Response(audioBuffer, {
      headers: {
        ...corsHeaders,
        "Content-Type": "audio/mpeg",
      },
    });
  } catch (error) {
    console.error("TTS error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
