import type { Prisma } from "@/generated/prisma/client";
import { translateText, type Language } from "./translation";

type EventInput = Pick<
  Prisma.EventCreateInput,
  "title_en" | "title_es" | "description_en" | "description_es"
>;

export async function ensureBilingualEventFields(
  data: EventInput,
): Promise<EventInput> {
  const { title_en, title_es, description_en, description_es } = data;

  const hasTitleEn = !!title_en?.trim();
  const hasTitleEs = !!title_es?.trim();
  const hasDescriptionEn = !!description_en?.trim();
  const hasDescriptionEs = !!description_es?.trim();

  if ((!hasTitleEn && !hasTitleEs) || (!hasDescriptionEn && !hasDescriptionEs)) {
    throw new Error(
      "Event must include a title and description in at least one language.",
    );
  }

  let finalTitleEn = title_en ?? "";
  let finalTitleEs = title_es ?? "";
  let finalDescriptionEn = description_en ?? "";
  let finalDescriptionEs = description_es ?? "";

  const translateIfNeeded = async (
    sourceText: string,
    sourceLang: Language,
    targetLang: Language,
  ) => {
    return translateText({ text: sourceText, sourceLang, targetLang });
  };

  // Title
  if (hasTitleEn && !hasTitleEs) {
    finalTitleEs = await translateIfNeeded(finalTitleEn, "en", "es");
  } else if (!hasTitleEn && hasTitleEs) {
    finalTitleEn = await translateIfNeeded(finalTitleEs, "es", "en");
  }

  // Description
  if (hasDescriptionEn && !hasDescriptionEs) {
    finalDescriptionEs = await translateIfNeeded(finalDescriptionEn, "en", "es");
  } else if (!hasDescriptionEn && hasDescriptionEs) {
    finalDescriptionEn = await translateIfNeeded(finalDescriptionEs, "es", "en");
  }

  return {
    ...data,
    title_en: finalTitleEn,
    title_es: finalTitleEs,
    description_en: finalDescriptionEn,
    description_es: finalDescriptionEs,
  };
}

