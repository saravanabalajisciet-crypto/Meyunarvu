/**
 * Local dev file serving route.
 * Serves files written by the local storage provider from the OS temp dir.
 * This route is NOT used in production (Vercel Blob has its own CDN URLs).
 */

import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import os from "os";

const UPLOAD_DIR = path.join(os.tmpdir(), "meyunarvu-uploads");

export async function GET(
  _req: Request,
  ctx: RouteContext<"/api/uploads/[key]">
) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production" }, { status: 404 });
  }

  const { key } = await ctx.params;
  const safeName = path.basename(key); // prevent path traversal
  const filePath = path.join(UPLOAD_DIR, safeName);

  try {
    const buffer = await fs.readFile(filePath);
    // Infer basic content type from extension
    const ext = path.extname(safeName).toLowerCase();
    const contentType =
      ext === ".jpg" || ext === ".jpeg"
        ? "image/jpeg"
        : ext === ".png"
        ? "image/png"
        : ext === ".gif"
        ? "image/gif"
        : ext === ".webp"
        ? "image/webp"
        : "application/octet-stream";

    return new Response(buffer, {
      headers: { "Content-Type": contentType, "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
