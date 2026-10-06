/** Content pages (cart, checkout, policies, ...) sit in a centred, padded column. */
export default function NarrowLayout({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto w-full max-w-site px-4 py-8">{children}</div>;
}
