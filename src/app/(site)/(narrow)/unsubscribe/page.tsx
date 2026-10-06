import type { Metadata } from "next";
import { pageMeta } from "@content/pages";
import { UnsubscribeForm } from "@/components/forms/UnsubscribeForm";

export const metadata: Metadata = {
  title: pageMeta.unsubscribe.title,
  description: pageMeta.unsubscribe.description,
  robots: { index: false },
};

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="text-3xl font-semibold">Unsubscribe</h1>
      {token ? (
        <div className="mt-4 space-y-4">
          <p>Confirm that you no longer want to receive emails from us.</p>
          <UnsubscribeForm token={token} />
        </div>
      ) : (
        <p className="mt-4">This unsubscribe link is not valid.</p>
      )}
    </div>
  );
}
