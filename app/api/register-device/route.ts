export async function POST(req: Request) {
    try {
        const { name } = await req.json();

        const response = await fetch(process.env.GOOGLE_SHEET_API!, {
            method: "POST",
            body: JSON.stringify({
                batteryName: name,
                key: process.env.SHEET_SECRET, // 🔐 security
            }),
        });

        if (!response.ok) {
            return Response.json({ error: "Failed" }, { status: 500 });
        }

        return Response.json({ success: true });
    } catch (err) {
        return Response.json({ error: "Server error" }, { status: 500 });
    }
}