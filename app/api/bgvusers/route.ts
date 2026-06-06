import { NextResponse } from "next/server";

const BACKEND_URL = "http://localhost:62929";

export async function GET() {
    try {
        const res = await fetch(`${BACKEND_URL}/api/bgvusers`, {
            cache: "no-store",
        });

        if (res.status === 404) {
            // C# controller returns NotFound() if user count is 0, return empty list
            return NextResponse.json([]);
        }

        if (!res.ok) {
            const text = await res.text();
            console.error("BGV API GET Error:", text);
            return NextResponse.json(
                { error: "Failed to fetch users from backend", details: text },
                { status: res.status }
            );
        }

        const data = await res.json();
        return NextResponse.json(data);
    } catch (error: any) {
        console.error("BGV API GET Connection Exception:", error);
        return NextResponse.json(
            { error: "Failed to connect to backend API", message: error.message },
            { status: 502 }
        );
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();

        const res = await fetch(`${BACKEND_URL}/api/bgvusers/add`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        });

        if (!res.ok) {
            const text = await res.text();
            console.error("BGV API POST Error:", text);
            return NextResponse.json(
                { error: "Failed to create user in backend", details: text },
                { status: res.status }
            );
        }

        const data = await res.json();
        return NextResponse.json(data);
    } catch (error: any) {
        console.error("BGV API POST Connection Exception:", error);
        return NextResponse.json(
            { error: "Failed to connect to backend API", message: error.message },
            { status: 502 }
        );
    }
}
