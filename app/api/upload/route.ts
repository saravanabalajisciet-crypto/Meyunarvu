/**
 * POST /api/upload
 * Receives a multipart/form-data file upload.
 * Delegates to the active StorageProvider (local in dev, Vercel Blob in prod).
 * Admin-only.
 */

import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { storage } from "@/lib/storage";
import { prisma } from "@/lib/prisma";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || (session.role !== "admin" && session.role !== "author")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const contentType = req.headers.get("content-type") ?? "";
  if (!contentType.includes("multipart/form-data")) {
    return NextResponse.json(
      { error: "Expected multipart/form-data" },
      { status: 400 }
    );
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Failed to parse form data" }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  const postId = formData.get("postId") as string | null;
  const altText = (formData.get("altText") as string | null) ?? "";

  if (!file) {
    return NextResponse.json({ error: "file field is required" }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: `File type not allowed. Allowed: ${ALLOWED_TYPES.join(", ")}` },
      { status: 400 }
    );
  }

  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json(
      { error: `File too large. Maximum size: ${MAX_SIZE_BYTES / 1024 / 1024} MB` },
      { status: 400 }
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  const { url, storageKey } = await storage.upload(buffer, file.name, file.type);

  // If postId provided, persist image record
  if (postId) {
    const lastImage = await prisma.image.findFirst({
      where: { postId },
      orderBy: { displayOrder: "desc" },
      select: { displayOrder: true },
    });
    await prisma.image.create({
      data: {
        postId,
        url,
        storageKey,
        altText: altText || null,
        displayOrder: (lastImage?.displayOrder ?? -1) + 1,
      },
    });
  }

  return NextResponse.json({ url, storageKey });
}
