"use server";

import { cookies } from "next/headers";

export async function setDestinationCookie(slug: string) {
  const cookieStore = await cookies();
  cookieStore.set("guidni-destination", slug, {
    maxAge: 60 * 60 * 24 * 365, // 1 year
    path: "/",
    sameSite: "lax",
  });
}

export async function getDestinationSlug(): Promise<string> {
  const cookieStore = await cookies();
  return cookieStore.get("guidni-destination")?.value ?? "djerba";
}
