import { NextResponse } from "next/server";
import { hitJoint } from "../../lib/kv";

export async function POST() {
  try {
    const state = await hitJoint();
    return NextResponse.json(state);
  } catch (error) {
    console.error("Hit error:", error);
    return NextResponse.json(
      { error: "Failed to register hit" },
      { status: 500 }
    );
  }
}
