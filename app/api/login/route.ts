import { cookies } from "next/headers";

export async function POST(req: Request) {
    const { username, password } = await req.json();

    // 🔐 Simple check (replace later with DB/auth)
    if (username === "admin@gmail.com" && password === "hormuz") {
        (await cookies()).set("auth", "true", {
            httpOnly: true,
            path: "/",
        });

        return Response.json({ success: true });
    }

    return Response.json({ success: false }, { status: 401 });
}