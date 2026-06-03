import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const AGENT_BASE =
  process.env.PLANNER_AGENT_URL?.replace(/\/plan$/, "") ??
  "http://localhost:8000";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    const { id } = await params;

    const resp = await fetch(`${AGENT_BASE}/conversations/${id}`, {
      method: "DELETE",
    });

    const data = await resp.json().catch(() => null);

    if (!resp.ok) {
      return NextResponse.json(
        { success: false, error: data?.detail ?? "Delete failed" },
        { status: resp.status }
      );
    }

    return NextResponse.json({ success: true, ...data });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
