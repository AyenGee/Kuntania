"use client";

import { useState } from "react";
import { secondaryButtonClass } from "./ui";

type Photo = { src: string; alt: string };

/**
 * Edit a product's photo list. The image files themselves live in public/images/products
 * (added by the developer); here the owner lists which files to show, in order, with a short
 * description for each (used as alt text for screen readers and Google).
 */
export function PhotoListField({
  name,
  initial,
  error,
}: {
  name: string;
  initial: Photo[];
  error?: string;
}) {
  const [photos, setPhotos] = useState<Photo[]>(initial);

  function update(i: number, patch: Partial<Photo>) {
    setPhotos((prev) => prev.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));
  }
  function move(i: number, dir: -1 | 1) {
    setPhotos((prev) => {
      const j = i + dir;
      if (j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }

  return (
    <fieldset className="space-y-3">
      <legend className="mb-1 font-medium">Photos</legend>
      <p className="text-sm text-ink-muted">
        The first photo is the main one. Photo files must already be in{" "}
        <code>public/images/products</code> (ask your developer to add them).
      </p>
      <input type="hidden" name={name} value={JSON.stringify(photos)} />
      {photos.map((photo, i) => (
        <div
          key={i}
          className="space-y-2 rounded-control border border-line bg-surface p-3"
        >
          {photo.src.startsWith("/images/products/") && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photo.src}
              alt=""
              className="h-20 w-20 rounded-control bg-surface-muted object-cover"
            />
          )}
          <div>
            <label htmlFor={`${name}-${i}-src`} className="mb-1 block text-sm">
              File path
            </label>
            <input
              id={`${name}-${i}-src`}
              value={photo.src}
              onChange={(e) => update(i, { src: e.target.value })}
              placeholder="/images/products/my-photo.jpg"
              className="w-full rounded-control border border-control bg-surface px-3 py-2"
            />
          </div>
          <div>
            <label htmlFor={`${name}-${i}-alt`} className="mb-1 block text-sm">
              Description of the photo
            </label>
            <input
              id={`${name}-${i}-alt`}
              value={photo.alt}
              onChange={(e) => update(i, { alt: e.target.value })}
              placeholder="e.g. Hair Growth Oil bottle with rosemary sprigs"
              className="w-full rounded-control border border-control bg-surface px-3 py-2"
            />
          </div>
          <div className="flex flex-wrap gap-4 text-sm">
            <button
              type="button"
              onClick={() => move(i, -1)}
              disabled={i === 0}
              className="underline disabled:opacity-40"
            >
              Move up
            </button>
            <button
              type="button"
              onClick={() => move(i, 1)}
              disabled={i === photos.length - 1}
              className="underline disabled:opacity-40"
            >
              Move down
            </button>
            <button
              type="button"
              onClick={() => setPhotos((prev) => prev.filter((_, idx) => idx !== i))}
              className="text-danger underline"
            >
              Remove
            </button>
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={() =>
          setPhotos((prev) => [...prev, { src: "/images/products/", alt: "" }])
        }
        className={secondaryButtonClass}
      >
        Add a photo
      </button>
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
    </fieldset>
  );
}
