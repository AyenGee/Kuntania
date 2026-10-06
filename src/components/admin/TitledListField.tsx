"use client";

import { useState } from "react";
import { secondaryButtonClass } from "./ui";

type Item = { title: string; body: string };

/**
 * Edit a list of {heading, text} items (benefits, how-to-use steps) with add/remove rows.
 * The list is submitted as JSON in a hidden field, so the owner never sees or types JSON.
 */
export function TitledListField({
  name,
  label,
  initial,
  error,
}: {
  name: string;
  label: string;
  initial: Item[];
  error?: string;
}) {
  const [items, setItems] = useState<Item[]>(initial);

  function update(i: number, patch: Partial<Item>) {
    setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  }

  return (
    <fieldset className="space-y-3">
      <legend className="mb-1 font-medium">{label}</legend>
      <input type="hidden" name={name} value={JSON.stringify(items)} />
      {items.map((item, i) => (
        <div
          key={i}
          className="space-y-2 rounded-control border border-line bg-surface p-3"
        >
          <div>
            <label htmlFor={`${name}-${i}-title`} className="mb-1 block text-sm">
              Heading
            </label>
            <input
              id={`${name}-${i}-title`}
              value={item.title}
              onChange={(e) => update(i, { title: e.target.value })}
              className="w-full rounded-control border border-control bg-surface px-3 py-2"
            />
          </div>
          <div>
            <label htmlFor={`${name}-${i}-body`} className="mb-1 block text-sm">
              Text
            </label>
            <textarea
              id={`${name}-${i}-body`}
              rows={3}
              value={item.body}
              onChange={(e) => update(i, { body: e.target.value })}
              className="w-full rounded-control border border-control bg-surface px-3 py-2"
            />
          </div>
          <button
            type="button"
            onClick={() => setItems((prev) => prev.filter((_, idx) => idx !== i))}
            className="text-sm text-danger underline"
          >
            Remove this item
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => setItems((prev) => [...prev, { title: "", body: "" }])}
        className={secondaryButtonClass}
      >
        Add an item
      </button>
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
    </fieldset>
  );
}
