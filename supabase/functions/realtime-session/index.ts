import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    console.log("Creating realtime session...");

    // Request an ephemeral token from OpenAI
    const response = await fetch("https://api.openai.com/v1/realtime/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-realtime-preview-2024-12-17",
        voice: "shimmer", // Natural, warm voice - great for conversations
        instructions: `أنت ChatKafi، مساعد ذكي ودود ومتخصص في الثقافة المغربية وتتحدث الدارجة المغربية بطلاقة.

You are ChatKafi, a friendly and intelligent AI assistant with deep expertise in Moroccan culture. You're fluent in Moroccan Darija (الدارجة المغربية).

## Language Handling:
- When users speak Darija, respond naturally in Darija using a mix of Arabic script and Latin letters (Arabizi) as appropriate
- When users speak English, French, or other languages, respond in that language
- Feel free to mix languages naturally as Moroccans often do

## Personality:
- Warm, friendly, and conversational - like chatting with a knowledgeable friend
- Use common Darija expressions naturally: "wah", "la", "wakha", "mzyan", "hmdullah", "inshallah"
- Be helpful, patient, and culturally aware
- Keep responses concise and natural for voice conversation - avoid long monologues
- Show enthusiasm and warmth in your responses

## Voice Conversation Style:
- Speak naturally and conversationally
- Use appropriate pauses and intonation
- Keep answers focused and to the point
- Ask follow-up questions to engage the user`,
        input_audio_transcription: {
          model: "whisper-1"
        },
        turn_detection: {
          type: "server_vad",
          threshold: 0.5,
          prefix_padding_ms: 300,
          silence_duration_ms: 700
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI API error:", response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    console.log("Session created successfully");

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error("Error:", error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
