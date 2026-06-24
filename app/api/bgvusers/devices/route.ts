import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const BACKEND_URL = "https://api.urest.in:8096";

export async function GET() {
    try {
        const isAuth = (await cookies()).get("auth");
        if (!isAuth) {
            return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        const res = await fetch(`${BACKEND_URL}/api/bgvusers/devices`, {
            cache: "no-store",
        });

        if (res.status === 404) {
            return NextResponse.json([]);
        }

        if (!res.ok) {
            const text = await res.text();
            console.error("BGV API GET Devices Error:", text);
            return NextResponse.json(
                { error: "Failed to fetch devices from backend", details: text },
                { status: res.status }
            );
        }

        const data = await res.json();
        return NextResponse.json(data);
    } catch (error: any) {
        console.error("BGV API GET Devices Exception:", error);
        return NextResponse.json(
            { error: "Failed to connect to backend API", message: error.message },
            { status: 502 }
        );
    }
}

