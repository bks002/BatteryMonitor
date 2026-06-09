import { NextResponse } from "next/server";

const BACKEND_URL = "https://api.urest.in:8096";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const res = await fetch(`${BACKEND_URL}/api/bgvusers/${id}/devices`, {
            cache: "no-store",
        });

        if (!res.ok) {
            const text = await res.text();
            console.error(`BGV API GET DEVICES Error (ID: ${id}):`, text);
            return NextResponse.json(
                { error: "Failed to fetch user devices from backend", details: text },
                { status: res.status }
            );
        }

        const data = await res.json();
        return NextResponse.json(data);
    } catch (error: any) {
        console.error("BGV API GET DEVICES Connection Exception:", error);
        return NextResponse.json(
            { error: "Failed to connect to backend API", message: error.message },
            { status: 502 }
        );
    }
}
