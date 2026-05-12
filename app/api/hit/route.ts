import { NextResponse } from "next/server";
import { hitJoint } from "../../lib/kv";

export const runtime = "edge";

export async function POST() {
  try {
    const result = await hitJoint();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Hit error:", error);
    return NextResponse.json(
      { error: "Failed to register hit" },
      { status: 500 }
    );
  }
}
