import { NextResponse } from "next/server";

const BACKEND_URL = "https://api.urest.in:8096";

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const res = await fetch(`${BACKEND_URL}/api/bgvusers/remove-device/${id}`, {
            method: "DELETE",
        });

        if (!res.ok) {
            const text = await res.text();
            console.error(`BGV API REMOVE DEVICE Error (ID: ${id}):`, text);
            return NextResponse.json(
                { error: "Failed to remove device link in backend", details: text },
                { status: res.status }
            );
        }

        const data = await res.json().catch(() => ({}));
        return NextResponse.json(data || { status: "success" });
    } catch (error: any) {
        console.error("BGV API REMOVE DEVICE Connection Exception:", error);
        return NextResponse.json(
            { error: "Failed to connect to backend API", message: error.message },
            { status: 502 }
        );
    }
}
