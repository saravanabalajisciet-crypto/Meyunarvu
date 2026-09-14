import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import PostEditor from "@/components/editor/PostEditor";

export const metadata = { title: "Edit Post" };

async function getPostData(id: string) {
  const [post, categories, tags] = await Promise.all([
    prisma.post.findUnique({
      where: { id },
      include: {
        tags: { include: { tag: true } },
        images: { orderBy: { displayOrder: "asc" } },
        thirukkuralMeta: true,
        letterMeta: true,
        linkedInMeta: true,
        businessIdeaMeta: true,
        category: true,
      },
    }),
    prisma.category.findMany({ orderBy: { order: "asc" }, select: { id: true, name: true, slug: true } }),
    prisma.tag.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, slug: true } }),
  ]);
  return { post, categories, tags };
}

/** Flatten companion meta tables into a single Record<string,string> for the editor */
function extractMeta(post: NonNullable<Awaited<ReturnType<typeof getPostData>>["post"]>): Record<string, string> {
  const m: Record<string, string> = {};
  if (post.thirukkuralMeta) {
    const t = post.thirukkuralMeta;
    if (t.kuralNumber != null) m.kuralNumber = String(t.kuralNumber);
    m.tamilCouplet = t.tamilCouplet;
    m.englishTranslation = t.englishTranslation;
    if (t.tamilCommentary) m.tamilCommentary = t.tamilCommentary;
    if (t.englishCommentary) m.englishCommentary = t.englishCommentary;
  }
  if (post.letterMeta) {
    const l = post.letterMeta;
    if (l.recipient) m.recipient = l.recipient;
    if (l.letterDate) m.letterDate = l.letterDate.toISOString().slice(0, 10);
    if (l.responseStatus) m.responseStatus = l.responseStatus;
  }
  if (post.linkedInMeta) {
    const li = post.linkedInMeta;
    m.linkedInUrl = li.linkedInUrl;
    if (li.originalDate) m.originalDate = li.originalDate.toISOString().slice(0, 10);
  }
  if (post.businessIdeaMeta) {
    m.freeUseNotice = post.businessIdeaMeta.freeUseNotice;
  }
  return m;
}

export default async function EditPostPage(props: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await props.params;
  const { post, categories, tags } = await getPostData(id);
  if (!post) notFound();

  return (
    <PostEditor
      postId={post.id}
      initialTitle={post.title}
      initialContent={post.content ?? ""}
      initialExcerpt={post.excerpt ?? ""}
      initialType={post.type}
      initialStatus={post.status}
      initialCategoryId={post.categoryId ?? ""}
      initialTags={post.tags.map((pt) => pt.tag.name)}
      initialImages={post.images.map((img) => ({
        url: img.url,
        storageKey: img.storageKey,
        altText: img.altText ?? "",
      }))}
      initialSlug={post.slug}
      initialMeta={extractMeta(post)}
      categories={categories}
      allTags={tags}
    />
  );
}
