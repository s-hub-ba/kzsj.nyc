"use client";

import { useMemo, useState } from "react";

type CarouselPhoto = {
  src: string;
  alt: string;
};

interface PhotoCarouselProps {
  photos: CarouselPhoto[];
}

export function PhotoCarousel({ photos }: PhotoCarouselProps) {
  const [index, setIndex] = useState(0);
  const total = photos.length;

  const safeIndex = useMemo(() => {
    if (total === 0) return 0;
    if (index < 0) return 0;
    if (index >= total) return total - 1;
    return index;
  }, [index, total]);

  const goTo = (target: number) => {
    if (total === 0) return;
    const normalized = (target + total) % total;
    setIndex(normalized);
  };

  if (total === 0) {
    return null;
  }

  return (
    <div className="mt-6 rounded-2xl border border-line bg-[var(--surface-2)] p-3 sm:p-4">
      <div className="relative overflow-hidden rounded-2xl border border-line bg-white">
        <div
          className="flex transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${safeIndex * 100}%)` }}
        >
          {photos.map((photo) => (
            <div key={photo.src} className="w-full shrink-0">
              <img
                src={photo.src}
                alt={photo.alt}
                className="h-64 w-full object-cover sm:h-80"
                loading="lazy"
              />
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => goTo(safeIndex - 1)}
          aria-label="Previous photo"
          className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full border border-line bg-white/90 px-3 py-2 text-sm font-semibold text-[var(--brand-2)] shadow-sm backdrop-blur transition hover:bg-white"
        >
          ←
        </button>

        <button
          type="button"
          onClick={() => goTo(safeIndex + 1)}
          aria-label="Next photo"
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full border border-line bg-white/90 px-3 py-2 text-sm font-semibold text-[var(--brand-2)] shadow-sm backdrop-blur transition hover:bg-white"
        >
          →
        </button>
      </div>

      <div className="mt-3 flex items-center justify-center gap-2">
        {photos.map((photo, dotIndex) => (
          <button
            key={`${photo.src}-dot`}
            type="button"
            onClick={() => goTo(dotIndex)}
            aria-label={`Go to photo ${dotIndex + 1}`}
            className={`h-2.5 rounded-full transition ${dotIndex === safeIndex ? "w-7 bg-[var(--brand)]" : "w-2.5 bg-[var(--line)] hover:bg-[var(--brand)]/60"}`}
          />
        ))}
      </div>
    </div>
  );
}