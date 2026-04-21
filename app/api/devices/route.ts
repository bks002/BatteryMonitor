import {cookies} from "next/headers";

export async function GET() {
    try {
        const isAuth = (await cookies()).get("auth");

        if (!isAuth) {
            return Response.json({ error: "Unauthorized" }, { status: 401 });
        }
        const response = await fetch(
            "https://api.thingsup.io/api/device/filter?optimize=true&page=1&pagesize=3000",
            {
                headers: {
                    Cookie: `token=${process.env.TOKEN}`,
                },
                cache: "no-store",
            }
        );

        const data = await response.json();

        return Response.json(data);
    } catch (error) {
        return Response.json({ error: "Failed to fetch data" }, { status: 500 });
    }
}