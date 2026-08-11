export function buildShortDescription(text: string, maxSentences = 2, maxLength = 240) {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) {
    return "";
  }

  const sentences = normalized.match(/[^.!?]+[.!?]?/g)?.map((sentence) => sentence.trim()) ?? [];
  const concise = sentences.slice(0, maxSentences).join(" ").trim();

  if (concise && concise.length <= maxLength) {
    return concise;
  }

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength).trimEnd()}...`;
}

export function formatLongDescription(text: string) {
  const explicitParagraphs = text
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  if (explicitParagraphs.length > 0) {
    return explicitParagraphs;
  }

  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) {
    return [] as string[];
  }

  const sentences = normalized.match(/[^.!?]+[.!?]?/g)?.map((sentence) => sentence.trim()) ?? [normalized];
  const paragraphs: string[] = [];

  for (let index = 0; index < sentences.length; index += 2) {
    paragraphs.push(sentences.slice(index, index + 2).join(" ").trim());
  }

  return paragraphs.filter(Boolean);
}