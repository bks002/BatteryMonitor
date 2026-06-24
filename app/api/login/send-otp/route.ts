import { NextResponse } from "next/server";

const BACKEND_URL = "https://api.urest.in:8096";

export async function POST(req: Request) {
    try {
        const { phoneNumber } = await req.json();

        if (!phoneNumber || typeof phoneNumber !== "string" || phoneNumber.trim().length !== 10) {
            return NextResponse.json({ error: "A valid 10-digit mobile number is required" }, { status: 400 });
        }

        const res = await fetch(`${BACKEND_URL}/api/bgvusers/send-otp`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                PhoneNumber: phoneNumber.trim(),
            }),
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
            console.error("BGV send-otp error response:", data);
            return NextResponse.json(
                { error: data.message || data.Message || "Failed to send OTP. Account may not exist." },
                { status: res.status }
            );
        }

        return NextResponse.json(data);
    } catch (error: any) {
        console.error("BGV send-otp connection error:", error);
        return NextResponse.json(
            { error: "Failed to connect to backend OTP service", message: error.message },
            { status: 502 }
        );
    }
}
