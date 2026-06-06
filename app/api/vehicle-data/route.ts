import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const vehicle_number = searchParams.get("vehicle_number");

    if (!vehicle_number) {
      return NextResponse.json(
        { error: "Vehicle number required" },
        { status: 400 }
      );
    }

    const username = process.env.API_USERNAME;
    const password = process.env.API_PASSWORD;

    const auth = Buffer.from(`${username}:${password}`).toString("base64");

    const res = await fetch(
      `https://vehicle-data-624167443867.asia-south1.run.app/api/vehicle-data?vehicle_number=${vehicle_number}`,
      {
        headers: {
          Authorization: `Basic ${auth}`,
        },
        cache: "no-store",
      }
    );

    if (!res.ok) {
      const text = await res.text();
      console.error("BACKEND ERROR 👉", text);

      return NextResponse.json(
        { error: "API failed", details: text },
        { status: res.status }
      );
    }

    const data = await res.json();

    return NextResponse.json(data);

  } catch (err) {
    return NextResponse.json(
      { error: "Failed to fetch" },
      { status: 500 }
    );
  }
}