import { NextRequest, NextResponse } from "next/server";
import { translateText, type Language } from "@/lib/services/translation";

interface TranslateBody {
  text?: string;
  sourceLang?: Language;
  targetLang?: Language;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as TranslateBody;
    const { text, sourceLang, targetLang } = body;

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "Field 'text' is required" },
        { status: 400 },
      );
    }

    if (!sourceLang || !targetLang) {
      return NextResponse.json(
        { error: "Fields 'sourceLang' and 'targetLang' are required" },
        { status: 400 },
      );
    }

    if (sourceLang === targetLang) {
      return NextResponse.json({ translatedText: text }, { status: 200 });
    }

    const translatedText = await translateText({
      text,
      sourceLang,
      targetLang,
    });

    return NextResponse.json({ translatedText }, { status: 200 });
  } catch (error) {
    console.error("POST /api/translate error:", error);
    return NextResponse.json(
      { error: "Translation service unavailable" },
      { status: 502 },
    );
  }
}

