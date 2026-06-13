import { NextRequest, NextResponse } from "next/server";

async function extractWithClaude(text: string) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 1000,
      messages: [{
        role: "user",
        content: `Extract job information from the following text. Return ONLY a JSON object with these exact fields: title (job title), company (company name), location (city/remote/etc), notes (1-2 sentence summary of the role), domain (the company's website domain, e.g. "figma.com", "linear.app", "stripe.com" — infer from the company name if not explicitly stated, do NOT include https:// or www). If you cannot find a field, use an empty string. Return only the JSON, no markdown, no explanation.\n\nText:\n${text.slice(0, 8000)}`,
      }],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Claude API error: ${err}`);
  }

  const data = await response.json();
  const extracted = JSON.parse(data.content[0].text);
  return { ...extracted, success: true };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url, text } = body;

    if (url) {
      let pageText = "";
      try {
        const fetchRes = await fetch(url, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          },
        });
        if (!fetchRes.ok) throw new Error(`HTTP ${fetchRes.status}`);
        const html = await fetchRes.text();
        // Strip HTML tags and collapse whitespace
        pageText = html
          .replace(/<script[\s\S]*?<\/script>/gi, " ")
          .replace(/<style[\s\S]*?<\/style>/gi, " ")
          .replace(/<[^>]+>/g, " ")
          .replace(/\s+/g, " ")
          .trim();
      } catch {
        return NextResponse.json({ success: false, error: "Could not fetch URL" });
      }

      if (!pageText) {
        return NextResponse.json({ success: false, error: "Could not fetch URL" });
      }

      const result = await extractWithClaude(pageText);
      return NextResponse.json(result);
    }

    if (text) {
      const result = await extractWithClaude(text);
      return NextResponse.json(result);
    }

    return NextResponse.json({ success: false, error: "Provide url or text" }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
