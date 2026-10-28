"use client";

import { useState } from "react";
import Image from "next/image";

export function Gallery({ images, title }: { images: string[]; title: string }) {
  const [index, setIndex] = useState(0);
  if (images.length === 0) return <div />;
  return (
    <div className="gallery">
      <div className="gallery-main">
        <Image src={images[index]} alt={title} fill priority sizes="(max-width: 768px) 100vw, 50vw" />
      </div>
      {images.length > 1 && (
        <div className="gallery-thumbs">
          {images.map((src, i) => (
            <button
              key={src}
              type="button"
              className={i === index ? "active" : undefined}
              onClick={() => setIndex(i)}
              aria-label={`Show image ${i + 1}`}
            >
              <Image src={src} alt="" fill sizes="72px" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
