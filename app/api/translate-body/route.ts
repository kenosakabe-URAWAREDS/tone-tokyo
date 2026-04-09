import { NextRequest, NextResponse } from "next/server";
import { createClient } from "next-sanity";
import Anthropic from "@anthropic-ai/sdk";

// Mirrors the create-article route's auth posture and Sanity client setup.
const sanity = createClient({
  projectId: "w757ks40",
  dataset: "production",
  apiVersion: "2024-01-01",
  useCdn: false,
  token: process.env.SANITY_WRITE_TOKEN,
});

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// The TONE TOKYO editorial voice — kept in sync with create-article and
// line-webhook prompts. The translation task is constrained: produce a
// faithful English translation of the supplied Japanese, but in the
// editor's first-person Tokyo-insider voice. Banned-word list and
// closing-with-practical-info conventions still apply.
const TRANSLATE_SYSTEM_PROMPT = `You are The Editor of TONE TOKYO, an English-language media about Japanese fashion, food, culture, and craft. You write from a first-person perspective as a Tokyo-based insider who travels the world and knows Japan deeply. Your voice is: specific not generic, opinionated but fair, insider casual, never touristy. Never use words like amazing, incredible, must-visit, hidden gem, off the beaten path, bucket list.

Your task: take the supplied Japanese article body and produce its English version in The Editor's voice. This is a faithful translation — keep every fact, every name, every detail — but rewrite it idiomatically in English so it reads like an original TONE TOKYO piece, not a literal translation. Explain Japanese terms naturally in context. Preserve the structure (paragraph breaks).

Output ONLY the English body text. No JSON, no markdown headers, no preamble like "Here is the translation". Just the article body, ready to drop into the site.`;

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const { slug, bodyJa } = data as { slug?: string; bodyJa?: string };

    if (!slug || !bodyJa) {
      return NextResponse.json(
        { error: "slug and bodyJa are required" },
        { status: 400 }
      );
    }

    // Look up the existing article so we have its _id to patch.
    const existing = await sanity.fetch<{ _id: string } | null>(
      `*[_type == "article" && slug.current == $slug][0]{ _id }`,
      { slug }
    );
    if (!existing) {
      return NextResponse.json(
        { error: `No article found for slug "${slug}"` },
        { status: 404 }
      );
    }

    // Translate via Claude.
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4000,
      system: TRANSLATE_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Translate this Japanese article body into English in The Editor's voice:\n\n${bodyJa}`,
            },
          ],
        },
      ],
    });

    const translatedText = response.content
      .filter((b) => b.type === "text")
      .map((b) => (b as { type: "text"; text: string }).text)
      .join("")
      .trim();

    if (!translatedText) {
      return NextResponse.json(
        { error: "Translation returned empty text" },
        { status: 500 }
      );
    }

    // Patch the document: update bodyJa (in case the caller edited it)
    // and write the translated English back as a single Portable Text
    // block — same shape create-article uses for new articles.
    await sanity
      .patch(existing._id)
      .set({
        bodyJa,
        body: [
          {
            _type: "block",
            _key: "body0",
            style: "normal",
            children: [
              { _type: "span", _key: "span0", text: translatedText },
            ],
          },
        ],
      })
      .commit();

    return NextResponse.json({
      success: true,
      slug,
      body: translatedText,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("translate-body error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
