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
  const hasExplicitParagraphBreaks = /\n\s*\n/.test(text);
  const explicitParagraphs = text
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  if (hasExplicitParagraphBreaks && explicitParagraphs.length > 0) {
    return explicitParagraphs;
  }

  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) {
    return [] as string[];
  }

  const sentences =
    normalized.match(/[^.!?;]+[.!?;]?/g)?.map((sentence) => sentence.trim()).filter(Boolean) ?? [normalized];

  const paragraphs: string[] = [];
  const maxParagraphLength = 320;
  let buffer = "";

  for (const sentence of sentences) {
    if (!buffer) {
      buffer = sentence;
      continue;
    }

    const candidate = `${buffer} ${sentence}`.trim();
    if (candidate.length <= maxParagraphLength) {
      buffer = candidate;
      continue;
    }

    paragraphs.push(buffer);
    buffer = sentence;
  }

  if (buffer) {
    paragraphs.push(buffer);
  }

  // If content still ends up as one large paragraph, split by words as a hard fallback.
  if (paragraphs.length <= 1 && normalized.length > maxParagraphLength) {
    const words = normalized.split(" ");
    const chunks: string[] = [];
    let chunk = "";

    for (const word of words) {
      const candidate = chunk ? `${chunk} ${word}` : word;
      if (candidate.length <= maxParagraphLength) {
        chunk = candidate;
      } else {
        if (chunk) chunks.push(chunk);
        chunk = word;
      }
    }

    if (chunk) chunks.push(chunk);
    return chunks.filter(Boolean);
  }

  return paragraphs.filter(Boolean);
}