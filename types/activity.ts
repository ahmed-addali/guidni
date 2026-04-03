import type { Prisma } from "@prisma/client";

// Shape returned by getActivities (listing)
export type ActivityListItem = Prisma.ActivityGetPayload<{
  include: {
    images: { select: { id: true; url: true } };
    destination: { select: { slug: true; city: true; country: true } };
  };
}>;

// Shape returned by getActivityById (detail)
export type ActivityDetail = Prisma.ActivityGetPayload<{
  include: {
    images: { select: { id: true; url: true } };
    destination: { select: { slug: true; city: true; country: true } };
  };
}>;
