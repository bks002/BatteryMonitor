import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const BACKEND_URL = "https://api.urest.in:8096";

export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const isAuth = (await cookies()).get("auth");
        if (!isAuth) {
            return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const { name } = await req.json();

        if (!name || typeof name !== "string" || !name.trim()) {
            return NextResponse.json({ error: "UserTypeName is required" }, { status: 400 });
        }

        const res = await fetch(`${BACKEND_URL}/api/bgvusers/usertypes/update/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(name.trim()),
        });

        if (!res.ok) {
            const text = await res.text();
            console.error(`BGV UserTypes PUT Error (ID: ${id}):`, text);
            return NextResponse.json(
                { error: "Failed to update user type in backend", details: text },
                { status: res.status }
            );
        }

        const data = await res.json();
        return NextResponse.json(data);
    } catch (error: any) {
        console.error("BGV UserTypes PUT Connection Exception:", error);
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
        const isAuth = (await cookies()).get("auth");
        if (!isAuth) {
            return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        const res = await fetch(`${BACKEND_URL}/api/bgvusers/usertypes/delete/${id}`, {
            method: "DELETE",
        });

        if (!res.ok) {
            const text = await res.text();
            console.error(`BGV UserTypes DELETE Error (ID: ${id}):`, text);
            
            let errorMessage = text;
            try {
                const parsed = JSON.parse(text);
                errorMessage = parsed.message || parsed.Message || parsed.error || text;
            } catch (e) {}

            return NextResponse.json(
                { error: errorMessage || "Failed to delete user type from backend" },
                { status: res.status }
            );
        }

        const data = await res.json();
        return NextResponse.json(data);
    } catch (error: any) {
        console.error("BGV UserTypes DELETE Connection Exception:", error);
        return NextResponse.json(
            { error: "Failed to connect to backend API", message: error.message },
            { status: 502 }
        );
    }
}
