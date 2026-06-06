import { NextResponse } from "next/server";

const BACKEND_URL = "http://localhost:62929";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const res = await fetch(`${BACKEND_URL}/api/bgvusers/${id}`, {
            method: "GET",
            headers: {
                "Accept": "application/json",
            },
        });

        if (!res.ok) {
            const text = await res.text();
            console.error(`BGV API GET Error (ID: ${id}):`, text);
            return NextResponse.json(
                { error: "Failed to fetch user from backend", details: text },
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

export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await req.json();

        const res = await fetch(`${BACKEND_URL}/api/bgvusers/update/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        });

        if (!res.ok) {
            const text = await res.text();
            console.error(`BGV API PUT Error (ID: ${id}):`, text);
            return NextResponse.json(
                { error: "Failed to update user in backend", details: text },
                { status: res.status }
            );
        }

        const data = await res.json();
        return NextResponse.json(data);
    } catch (error: any) {
        console.error("BGV API PUT Connection Exception:", error);
        return NextResponse.json(
            { error: "Failed to connect to backend API", message: error.message },
            { status: 502 }
        );
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const res = await fetch(`${BACKEND_URL}/api/bgvusers/delete/${id}`, {
            method: "DELETE",
        });

        if (!res.ok) {
            const text = await res.text();
            console.error(`BGV API DELETE Error (ID: ${id}):`, text);
            return NextResponse.json(
                { error: "Failed to deactivate user in backend", details: text },
                { status: res.status }
            );
        }

        const data = await res.json();
        return NextResponse.json(data);
    } catch (error: any) {
        console.error("BGV API DELETE Connection Exception:", error);
        return NextResponse.json(
            { error: "Failed to connect to backend API", message: error.message },
            { status: 502 }
        );
    }
}
