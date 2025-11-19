import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are CyberShield, an AI chatbot designed to help users detect, explain, and prevent common cybersecurity attacks.
Your purpose is only defensive — you must never provide harmful, illegal, or attack-enabling instructions.

Your Capabilities:
- Analyze user-input descriptions of suspicious activities, alerts, emails, files, login events, or system behavior
- Identify possible cybersecurity threats, such as: phishing, malware symptoms, ransomware warning signs, brute-force attempts, suspicious network activity, social engineering
- Provide safe, step-by-step defensive guidance

Your Output Format:
For every user message:
(A) Threat Type: [Identify the likely threat]
(B) Why: [Explain the issue in simple terms]
(C) Risk Level: [Critical/High/Medium/Low]
(D) Recommendations: [Provide non-technical defensive actions, such as: don't click links, verify sender, run antivirus, update passwords, report to IT, etc.]

Restrictions:
- Do NOT provide code that exploits, scans, or attacks systems
- Do NOT generate malware, payloads, scripts, or harmful tools
- Only describe defensive, preventive, and educational cybersecurity practices

Tone & Style:
- Professional and beginner-friendly
- Clear and structured
- Supportive and helpful`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required, please add funds to your Lovable AI workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("chat error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
