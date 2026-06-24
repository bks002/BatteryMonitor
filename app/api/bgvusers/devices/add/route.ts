import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const BACKEND_URL = "https://api.urest.in:8096";

export async function POST(req: Request) {
    try {
        const isAuth = (await cookies()).get("auth");
        if (!isAuth) {
            return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();

        const res = await fetch(`${BACKEND_URL}/api/bgvusers/devices/add`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        });

        if (!res.ok) {
            const text = await res.text();
            console.error("BGV API POST Devices Add Error:", text);
            return NextResponse.json(
                { error: "Failed to create device in backend", details: text },
                { status: res.status }
            );
        }

        const data = await res.json().catch(() => ({}));
        return NextResponse.json(data);
    } catch (error: any) {
        console.error("BGV API POST Devices Add Exception:", error);
        return NextResponse.json(
            { error: "Failed to connect to backend API", message: error.message },
            { status: 502 }
        );
    }
}
