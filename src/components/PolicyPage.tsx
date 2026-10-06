import { Markdown } from "@/lib/markdown";
import { readPolicy, showDraftBanner, type PolicySlug } from "@/lib/policies";

export async function PolicyPage({ slug, title }: { slug: PolicySlug; title: string }) {
  const source = await readPolicy(slug);

  return (
    <article className="mx-auto max-w-3xl">
      {showDraftBanner() && (
        <p
          role="note"
          className="mb-6 rounded-control border-2 border-danger p-3 font-semibold text-danger"
        >
          DRAFT — must be reviewed by the client before launch.
        </p>
      )}
      <h1 className="text-3xl font-semibold">{title}</h1>
      <Markdown source={source} />
    </article>
  );
}
