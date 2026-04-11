import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders,
    },
  });
}

serve(async (req) => {
  try {
    if (req.method === "OPTIONS") {
      return new Response("ok", { headers: corsHeaders });
    }

    if (req.method !== "POST") {
      return jsonResponse({ error: "Method not allowed" }, 405);
    }

    const formData = await req.formData();
    const image = formData.get("image");

    if (!(image instanceof File)) {
      return jsonResponse({ error: "No image provided" }, 400);
    }

    const apiKey = Deno.env.get("PLANTNET_API_KEY");
    if (!apiKey) {
      return jsonResponse({ error: "Missing PLANTNET_API_KEY" }, 503);
    }

    const plantnetForm = new FormData();
    plantnetForm.append("images", image, image.name || "plant.jpg");
    plantnetForm.append("organs", "leaf");

    let response: Response;
    try {
      response = await fetch(
        `https://my-api.plantnet.org/v2/identify/all?api-key=${apiKey}`,
        {
          method: "POST",
          body: plantnetForm,
        }
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return jsonResponse(
        {
          error: "PlantNet network request failed",
          details: message,
        },
        502
      );
    }

    const rawText = await response.text();

    let data: any;
    try {
      data = JSON.parse(rawText);
    } catch {
      return jsonResponse(
        {
          error: "Invalid JSON from PlantNet",
          plantnetStatus: response.status,
          raw: rawText,
        },
        502
      );
    }

    if (!response.ok) {
      const status =
        response.status === 429
          ? 429
          : response.status >= 400 && response.status < 500
            ? response.status
            : 502;
      return jsonResponse(
        {
          error: "PlantNet request failed",
          plantnetStatus: response.status,
          body: data,
        },
        status
      );
    }

    const results = (data.results || []).slice(0, 3).map((r: any) => ({
      scientificName: r?.species?.scientificNameWithoutAuthor || "Unknown",
      confidence: Math.round((r?.score || 0) * 100),
      commonNames: r?.species?.commonNames || [],
    }));

    return jsonResponse({
      bestMatch: data.bestMatch || null,
      results,
      remainingIdentificationRequests:
        data.remainingIdentificationRequests ?? null,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return jsonResponse({ error: message }, 500);
  }
});
