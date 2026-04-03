import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";
import { randomUUID } from "crypto";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

// ── Helpers ──────────────────────────────────────────────────────────────────

const ALLOWED_ENTITIES = ["activity", "stay", "restaurant", "rental", "transfer", "business-profile", "shop", "product"] as const;
type Entity = (typeof ALLOWED_ENTITIES)[number];

function getUploadDir(): string {
  return process.env.NODE_ENV === "development"
    ? path.join(process.cwd(), "uploads")
    : process.env.UPLOAD_DIR || "/app/uploads";
}

function getFileUrl(entity: string, entityId: string, filename: string): string {
  // Store as a relative path so it works on any host (dev + prod) without
  // needing the hostname in next/image remotePatterns.
  return `/api/files/${entity}/${entityId}/${filename}`;
}

const MIME_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
};

type Params = Promise<{ entity: string; entityId: string }>;

// ── POST — upload a file ─────────────────────────────────────────────────────

export async function POST(req: NextRequest, { params }: { params: Params }) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { entity, entityId } = await params;

  if (!ALLOWED_ENTITIES.includes(entity as Entity)) {
    return NextResponse.json({ error: "Invalid entity type" }, { status: 400 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  // Validate type
  const ext = MIME_EXTENSIONS[file.type];
  if (!ext) {
    return NextResponse.json({ error: "Only JPEG, PNG, WebP, GIF and AVIF files are allowed." }, { status: 400 });
  }

  // Validate size (5 MB max)
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "File too large. Maximum size is 5 MB." }, { status: 400 });
  }

  // Verify ownership
  const ownerId = session.user.id;
  const profile = await prisma.businessProfile.findUnique({
    where: { userId: ownerId },
    select: { id: true },
  });

  if (entity === "activity") {
    const record = await prisma.activity.findUnique({ where: { id: entityId }, select: { profileId: true } });
    if (!record || record.profileId !== profile?.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  } else if (entity === "stay") {
    const record = await prisma.stay.findUnique({ where: { id: entityId }, select: { profileId: true } });
    if (!record || record.profileId !== profile?.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  } else if (entity === "restaurant") {
    const record = await prisma.restaurant.findUnique({ where: { id: entityId }, select: { profileId: true } });
    if (!record || record.profileId !== profile?.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  } else if (entity === "rental") {
    const record = await prisma.rental.findUnique({ where: { id: entityId }, select: { profileId: true } });
    if (!record || record.profileId !== profile?.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  } else if (entity === "transfer") {
    const record = await prisma.transfer.findUnique({ where: { id: entityId }, select: { profileId: true } });
    if (!record || record.profileId !== profile?.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  } else if (entity === "shop") {
    const record = await prisma.shop.findUnique({ where: { id: entityId }, select: { profileId: true } });
    if (!record || record.profileId !== profile?.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  } else if (entity === "product") {
    const record = await prisma.product.findUnique({
      where: { id: entityId },
      select: { shop: { select: { profileId: true } } },
    });
    if (!record || record.shop.profileId !== profile?.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  } else if (entity === "business-profile") {
    // entityId must match the session user's business profile
    if (!profile || profile.id !== entityId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  // Write file to disk
  const filename = `${Date.now()}-${randomUUID()}.${ext}`;
  const dir = path.join(getUploadDir(), entity, entityId);
  await fs.mkdir(dir, { recursive: true });
  const filepath = path.join(dir, filename);
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(filepath, buffer);

  const url = getFileUrl(entity, entityId, filename);

  // Business profile avatar: update the profileImage field directly (no Images record)
  if (entity === "business-profile") {
    await prisma.businessProfile.update({
      where: { id: entityId },
      data: { profileImage: url },
    });
    return NextResponse.json({ success: true, url });
  }

  // All other entities: save to the Images table
  const image = await prisma.images.create({
    data: {
      url,
      ...(entity === "activity"   ? { activityId: entityId }   : {}),
      ...(entity === "stay"       ? { stayId: entityId }        : {}),
      ...(entity === "restaurant" ? { restaurantId: entityId }  : {}),
      ...(entity === "rental"     ? { rentalId: entityId }      : {}),
      ...(entity === "transfer"   ? { transferId: entityId }    : {}),
      ...(entity === "shop"       ? { shopId: entityId }        : {}),
      ...(entity === "product"    ? { productId: entityId }     : {}),
    },
    select: { id: true, url: true },
  });

  return NextResponse.json({ success: true, image });
}

// ── DELETE — remove a file ───────────────────────────────────────────────────

export async function DELETE(req: NextRequest, { params }: { params: Params }) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { entity } = await params;
  const imageId = req.nextUrl.searchParams.get("imageId");

  if (!ALLOWED_ENTITIES.includes(entity as Entity)) {
    return NextResponse.json({ error: "Invalid entity type" }, { status: 400 });
  }

  if (!imageId) {
    return NextResponse.json({ error: "Missing imageId" }, { status: 400 });
  }

  // Verify ownership
  const profile = await prisma.businessProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });

  const image = await prisma.images.findUnique({ where: { id: imageId } });
  if (!image) return NextResponse.json({ error: "Image not found" }, { status: 404 });

  // Ownership check — find parent entity's profileId
  let profileId: string | null = null;
  if (image.activityId) {
    const r = await prisma.activity.findUnique({ where: { id: image.activityId }, select: { profileId: true } });
    profileId = r?.profileId ?? null;
  } else if (image.stayId) {
    const r = await prisma.stay.findUnique({ where: { id: image.stayId }, select: { profileId: true } });
    profileId = r?.profileId ?? null;
  } else if (image.restaurantId) {
    const r = await prisma.restaurant.findUnique({ where: { id: image.restaurantId }, select: { profileId: true } });
    profileId = r?.profileId ?? null;
  } else if (image.rentalId) {
    const r = await prisma.rental.findUnique({ where: { id: image.rentalId }, select: { profileId: true } });
    profileId = r?.profileId ?? null;
  } else if (image.transferId) {
    const r = await prisma.transfer.findUnique({ where: { id: image.transferId }, select: { profileId: true } });
    profileId = r?.profileId ?? null;
  } else if (image.shopId) {
    const r = await prisma.shop.findUnique({ where: { id: image.shopId }, select: { profileId: true } });
    profileId = r?.profileId ?? null;
  } else if (image.productId) {
    const r = await prisma.product.findUnique({
      where: { id: image.productId },
      select: { shop: { select: { profileId: true } } },
    });
    profileId = r?.shop.profileId ?? null;
  }

  if (!profile || profileId !== profile.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Delete from DB
  await prisma.images.delete({ where: { id: imageId } });

  // Delete from disk (best-effort — don't fail if already gone)
  try {
    // URL is stored as a relative path: /api/files/[entity]/[entityId]/[filename]
    const parts = image.url.split("/").filter(Boolean);
    // parts: ["api", "files", entity, entityId, filename]
    if (parts.length === 5 && parts[0] === "api" && parts[1] === "files") {
      const [, , ent, eid, fname] = parts;
      const filepath = path.join(getUploadDir(), ent, eid, fname);
      await fs.unlink(filepath);
    }
  } catch {
    // Ignore — file may not exist or URL may be external
  }

  return NextResponse.json({ success: true });
}
