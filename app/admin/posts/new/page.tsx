import { requireAdmin } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import PostEditor from "@/components/editor/PostEditor";

export const metadata = { title: "New Post" };

async function getEditorData() {
  const [categories, tags] = await Promise.all([
    prisma.category.findMany({ orderBy: { order: "asc" }, select: { id: true, name: true, slug: true } }),
    prisma.tag.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, slug: true } }),
  ]);
  return { categories, tags };
}

export default async function NewPostPage() {
  await requireAdmin();
  const { categories, tags } = await getEditorData();

  return (
    <PostEditor
      categories={categories}
      allTags={tags}
    />
  );
}
