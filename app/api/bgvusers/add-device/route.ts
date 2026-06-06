import { NextResponse } from "next/server";

const BACKEND_URL = "http://localhost:62929";

export async function POST(req: Request) {
    try {
        const body = await req.json();

        const res = await fetch(`${BACKEND_URL}/api/bgvusers/add-device`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        });

        if (!res.ok) {
            const text = await res.text();
            console.error("BGV API ADD DEVICE Error:", text);
            return NextResponse.json(
                { error: "Failed to add device to user in backend", details: text },
                { status: res.status }
            );
        }

        const data = await res.json().catch(() => ({}));
        return NextResponse.json(data || { status: "success" });
    } catch (error: any) {
        console.error("BGV API ADD DEVICE Connection Exception:", error);
        return NextResponse.json(
            { error: "Failed to connect to backend API", message: error.message },
            { status: 502 }
        );
    }
}
