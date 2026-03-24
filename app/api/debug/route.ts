import { NextResponse } from "next/server";

export async function GET() {
  const locations: Record<string, string> = {};
  for (let i = 1; i <= 20; i++) {
    const val = process.env[`SUMUP_LOCATION_${i}`];
    if (val) locations[`SUMUP_LOCATION_${i}`] = val;
  }
  return NextResponse.json({
    locations,
    locationCount: Object.keys(locations).length,
  });
}
