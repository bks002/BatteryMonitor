export async function GET() {
    try {
        const res = await fetch(process.env.GOOGLE_SHEET_API!);

        const data = await res.json();

        return Response.json(data);
    } catch {
        return Response.json({ error: "Failed" }, { status: 500 });
    }
}