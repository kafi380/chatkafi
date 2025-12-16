import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Input validation schema
const messageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().max(10000).optional(),
  imageUrl: z.string().url().optional(),
});

const requestSchema = z.object({
  messages: z.array(messageSchema).min(1).max(50),
});

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    
    // Validate input
    const parseResult = requestSchema.safeParse(body);
    if (!parseResult.success) {
      console.error("Validation error:", parseResult.error.message);
      return new Response(JSON.stringify({ error: "Invalid request format" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    const { messages } = parseResult.data;
    console.log("Received messages:", messages.length, "messages");
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Transform messages to support image URLs
    const formattedMessages = messages.map((msg: any) => {
      if (msg.imageUrl) {
        return {
          role: msg.role,
          content: [
            ...(msg.content ? [{ type: "text", text: msg.content }] : []),
            {
              type: "image_url",
              image_url: { url: msg.imageUrl }
            }
          ]
        };
      }
      return msg;
    });

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-5-mini",
        messages: [
          { 
            role: "system", 
            content: `You are ChatKafi, a helpful and friendly AI assistant with vision capabilities. You are fluent in Moroccan Darija (الدارجة المغربية) and can understand and respond in Darija when users speak or write in it. 

Key guidelines:
- When users write or speak in Darija, respond naturally in Darija using Arabic script or Latin transliteration based on how they communicate
- Keep responses clear, concise, and conversational
- Be culturally aware and use appropriate Moroccan expressions when relevant
- You can seamlessly switch between Darija, Arabic, English, and French based on user preference
- Common Darija phrases you should know: "labas" (how are you), "wakha" (okay), "bzaf" (a lot), "mzyan" (good), "shukran" (thank you)` 
          },
          ...formattedMessages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required. Please add funds to your Lovable AI workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("Chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
