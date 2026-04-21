import {cookies} from "next/headers";

export async function GET(req: Request) {
    try {
        const isAuth = (await cookies()).get("auth");

        if (!isAuth) {
            return Response.json({ error: "Unauthorized" }, { status: 401 });
        }
        const { searchParams } = new URL(req.url);
        const uniqueid = searchParams.get("uniqueid");

        if (!uniqueid) {
            return Response.json(
                { error: "uniqueid is required" },
                { status: 400 }
            );
        }

        const response = await fetch(
            `https://api.thingsup.io/api/device/details?uniqueid=${uniqueid}`,
            {
                headers: {
                    Cookie: `token=${process.env.TOKEN}`, // ✅ same auth
                },
                cache: "no-store",
            }
        );

        if (!response.ok) {
            return Response.json(
                { error: "Failed to fetch details" },
                { status: response.status }
            );
        }

        const data = await response.json();

        return Response.json(data);
    } catch (error) {
        return Response.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}