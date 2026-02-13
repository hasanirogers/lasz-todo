import type { APIRoute } from "astro";

export const prerender = false;

async function fetchWithRetry(url: string, init: RequestInit, retries = 2) {
  for (let i = 0; i <= retries; i++) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 25_000);

    try {
      const res = await fetch(url, { ...init, signal: controller.signal });
      clearTimeout(id);
      if (res.status === 502 || res.status === 503 || res.status === 504) {
        if (i < retries) continue;
      }
      return res;
    } catch (e) {
      clearTimeout(id);
      if (i >= retries) throw e;
    }
  }
  throw new Error("unreachable");
}

function rewriteErrorMessages(message: string): string {
  if (message.includes("Rate limit exceeded")) {
    return "The maximum amount of recommendations has been reached for the day. You can either become a member to unlock unlimited recommendations or wait until tomorrow.";
  }

  return message;
}

export const POST: APIRoute = async ({ request }) => {
  const { prompt } = await request.json();

  try {
    const response = await fetchWithRetry("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${import.meta.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        model: "xiaomi/mimo-v2-flash:free",
        messages: [
          {
            role: "system",
            content: [
              "You must respond with ONLY valid JSON in the content of the message.",
              "No explanations, no markdown, no code fences.",
              "Output MUST be a JSON array of objects.",
              'Keys must be double-quoted. Strings must be closed.',
              "If a value is unknown, use null."
            ].join(" ")
          },
          {
            role: "user",
            content: [
              prompt,
              "",
              "Return ONLY a JSON array of objects.",
              'Each object MUST have these keys exactly: "name", "street_address", "city", "state", "zipcode", "google_image_url","phone_number", "google_maps_place_id", "website".',
              "Do not include any additional keys.",
              "If you cannot find a value, use null."
            ].join("\n")
          }
        ],
        reasoning: { enabled: true }
      })
    });

    const body = await response.json();

    console.log(body.choices);

    if (!response.ok) {
      return new Response(
        JSON.stringify({
          success: false,
          message: rewriteErrorMessages(body?.error?.message) ?? "Uh oh, something went wrong. Please try again.",
          error: body?.error ?? body,
          exceededRateLimit: body?.error?.message?.includes("Rate limit exceeded")
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    const content: string | undefined = body?.choices?.[0]?.message?.content;
    const errorCode: number = body?.choices?.[0]?.error?.code;

    if (errorCode === 502) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'There was an error getting the bobs. To avoid this message, become a member and use premium services. Or you can try Recommend again. '
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    }

    if (!content) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Looks like we couldn't find any businesses that meet your requirements. Try increasing the search distance or changing the area for better results.",
          raw: body
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // Parse the model output as JSON array
    let businesses: unknown = [];
    try {
      businesses = JSON.parse(content);
      if (!Array.isArray(businesses)) throw new Error("Parsed output is not an array");
    } catch (error) {
      // If parsing fails, return raw content for debugging
      return new Response(
        JSON.stringify({
          success: false,
          message: "There was problem reading the data. Please try again.",
          model_output: content
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        body: businesses
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("[API] Error calling OpenRouter:", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: error?.message ?? String(error)
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
