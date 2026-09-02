"use client";

interface RichTextProps {
  text: string;
}

/**
 * Renders text with markdown-style bold markup: **text** becomes <strong>
 * Use **your text** in JSON messages to make it bold
 */
export function RichText({ text }: RichTextProps) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);

  return (
    <>
      {parts.map((part, index) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <strong key={index} className="font-bold text-[var(--brand-2)]">
              {part.slice(2, -2)}
            </strong>
          );
        }
        return <span key={index}>{part}</span>;
      })}
    </>
  );
}
