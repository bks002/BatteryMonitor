import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const BACKEND_URL = "https://api.urest.in:8096";

export async function GET() {
    try {
        const isAuth = (await cookies()).get("auth");
        if (!isAuth) {
            return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        const res = await fetch(`${BACKEND_URL}/api/bgvusers/usertypes`, {
            cache: "no-store",
        });

        if (!res.ok) {
            const text = await res.text();
            console.error("BGV UserTypes GET Error:", text);
            return NextResponse.json(
                { error: "Failed to fetch user types from backend", details: text },
                { status: res.status }
            );
        }

        const data = await res.json();
        return NextResponse.json(data);
    } catch (error: any) {
        console.error("BGV UserTypes GET Connection Exception:", error);
        return NextResponse.json(
            { error: "Failed to connect to backend API", message: error.message },
            { status: 502 }
        );
    }
}

export async function POST(req: Request) {
    try {
        const isAuth = (await cookies()).get("auth");
        if (!isAuth) {
            return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { name } = await req.json();

        if (!name || typeof name !== "string" || !name.trim()) {
            return NextResponse.json({ error: "UserTypeName is required" }, { status: 400 });
        }

        const res = await fetch(`${BACKEND_URL}/api/bgvusers/usertypes/add`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(name.trim()),
        });

        if (!res.ok) {
            const text = await res.text();
            console.error("BGV UserTypes POST Error:", text);
            return NextResponse.json(
                { error: "Failed to create user type in backend", details: text },
                { status: res.status }
            );
        }

        const data = await res.json();
        return NextResponse.json(data);
    } catch (error: any) {
        console.error("BGV UserTypes POST Connection Exception:", error);
        return NextResponse.json(
            { error: "Failed to connect to backend API", message: error.message },
            { status: 502 }
        );
    }
}
