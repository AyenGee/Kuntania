import { Markdown } from "@/lib/markdown";
import { readPolicy, type PolicySlug } from "@/lib/policies";

export async function PolicyPage({ slug, title }: { slug: PolicySlug; title: string }) {
  const source = await readPolicy(slug);

  return (
    <article className="mx-auto max-w-3xl">
      <h1 className="text-3xl font-semibold">{title}</h1>
      <Markdown source={source} />
    </article>
  );
}
