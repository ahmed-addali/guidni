import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

function mapBudget(b: number | undefined) {
  switch (b) {
    case 1: return "budget";
    case 3: return "luxury";
    default: return "mid-range";
  }
}

function mapGroup(g?: string) {
  if (!g) return "solo";
  if (g === "friends") return "group";
  return g;
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });

    const prefs = body.preferences ?? {};

    const planRequest = {
      user_id: session.user.id,
      region: body.region ?? prefs.destinationName ?? prefs.destinationCity ?? "Djerba",
      num_days: body.num_days ?? prefs.duration ?? 3,
      traveler_type: body.traveler_type ?? mapGroup(prefs.groupType),
      interests: body.interests ?? prefs.interests ?? [],
      budget_level: body.budget_level ?? mapBudget(prefs.budget),
      accommodation_type: body.accommodation_type ?? prefs.accommodationType ?? "hotel",
      start_date: body.start_date ?? prefs.startDate ?? undefined,
      special_requests: body.special_requests ?? undefined,
      model: body.model ?? undefined,
    };

    const agentUrl = process.env.PLANNER_AGENT_URL ?? "http://localhost:8000/plan";

    const resp = await fetch(agentUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(planRequest),
    });

    const data = await resp.json().catch(() => null);
    if (!resp.ok) {
      return NextResponse.json({ success: false, error: data ?? "Agent error" }, { status: resp.status });
    }

    return NextResponse.json({ success: true, data });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message ?? String(e) }, { status: 500 });
  }
}
