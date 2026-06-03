import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const AGENT_BASE =
  process.env.PLANNER_AGENT_URL?.replace(/\/plan$/, "") ??
  "http://localhost:8000";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));

    // Auth check — get user from session
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Build chat request for the Python backend
    const chatRequest = {
      user_id: body.user_id ?? session.user.id,
      conversation_id: body.conversation_id ?? undefined,
      message: body.message ?? "",
      model: body.model ?? undefined,
    };

    const resp = await fetch(`${AGENT_BASE}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(chatRequest),
    });

    const data = await resp.json().catch(() => null);

    if (!resp.ok) {
      return NextResponse.json(
        { success: false, error: data?.detail ?? data ?? "Agent error" },
        { status: resp.status }
      );
    }

    return NextResponse.json(data);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
