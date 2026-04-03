import type { Prisma } from "@prisma/client";

export type StayListItem = Prisma.StayGetPayload<{
  include: {
    images: { select: { id: true; url: true } };
    destination: { select: { slug: true; city: true; country: true } };
  };
}>;

export type StayDetail = Prisma.StayGetPayload<{
  include: {
    images: { select: { id: true; url: true } };
    destination: { select: { slug: true; city: true; country: true } };
  };
}>;
