import "server-only";

export type Language = "en" | "es";

export interface TranslateTextParams {
  text: string;
  sourceLang: Language;
  targetLang: Language;
}

export async function translateText({
  text,
  sourceLang,
  targetLang,
}: TranslateTextParams): Promise<string> {
  const baseUrl = process.env.TRANSLATION_BASE_URL;
  if (!baseUrl) {
    throw new Error("TRANSLATION_BASE_URL is not configured");
  }

  if (!text.trim()) {
    return text;
  }

  const controller = new AbortController();
  const timeoutMs = Number(process.env.TRANSLATION_TIMEOUT_MS ?? "3000");
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${baseUrl.replace(/\/$/, "")}/translate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        q: text,
        source: sourceLang,
        target: targetLang,
        format: "text",
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(
        `Translation request failed with status ${res.status}: ${body}`,
      );
    }

    const json = (await res.json()) as { translatedText?: string };
    if (!json.translatedText) {
      throw new Error("Translation response missing translatedText");
    }

    return json.translatedText.trim();
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Translation request timed out");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

