import { NextResponse } from "next/server";

export async function GET() {
  const pin = process.env.DASHBOARD_PIN ?? "";
  return NextResponse.json({ length: pin.length || 4 });
}
