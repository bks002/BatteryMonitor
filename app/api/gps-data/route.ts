import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(req: Request) {
  try {
    // 🔐 Secure the endpoint with cookie authentication
    const isAuth = (await cookies()).get("auth");
    if (!isAuth) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

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
      `https://gps-data-624167443867.asia-southeast1.run.app/api/vehicle-data?vehicle_number=${vehicle_number}`,
      {
        headers: {
          Authorization: `Basic ${auth}`,
        },
        cache: "no-store",
      }
    );

    if (!res.ok) {
      const text = await res.text();
      console.error("GPS BACKEND ERROR 👉", text);

      return NextResponse.json(
        { error: "GPS API failed", details: text },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);

  } catch (err: any) {
    console.error("GPS API Exception:", err);
    return NextResponse.json(
      { error: "Failed to fetch GPS data", message: err.message },
      { status: 500 }
    );
  }
}
