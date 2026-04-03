import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";

function getUploadDir(): string {
  return process.env.NODE_ENV === "development"
    ? path.join(process.cwd(), "uploads")
    : process.env.UPLOAD_DIR || "/app/uploads";
}

const CONTENT_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  avif: "image/avif",
};

type Params = Promise<{ entity: string; entityId: string; filename: string }>;

export async function GET(_req: NextRequest, { params }: { params: Params }) {
  const { entity, entityId, filename } = await params;

  // Sanitize to prevent path traversal
  const safeName = path.basename(filename);
  const safeEntity = path.basename(entity);
  const safeEntityId = path.basename(entityId);

  const filepath = path.join(getUploadDir(), safeEntity, safeEntityId, safeName);

  try {
    const buffer = await fs.readFile(filepath);
    const ext = safeName.split(".").pop()?.toLowerCase() ?? "";
    const contentType = CONTENT_TYPES[ext] ?? "application/octet-stream";

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}
