import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const BACKEND_URL = "http://localhost:62929";

export async function POST(req: Request) {
    try {
        const { phoneNumber, otp } = await req.json();

        if (!phoneNumber || !otp) {
            return NextResponse.json({ error: "PhoneNumber and Otp are required" }, { status: 400 });
        }

        const res = await fetch(`${BACKEND_URL}/api/bgvusers/verify-otp`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                PhoneNumber: phoneNumber.trim(),
                Otp: otp.trim(),
            }),
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
            console.error("BGV verify-otp error response:", data);
            return NextResponse.json(
                { error: data.message || data.Message || "Invalid or expired OTP" },
                { status: res.status }
            );
        }

        // Backend returns the user object on successful verification
        const isAdmin = data.UserTypeId === 1 || data.UserTypeName?.toLowerCase() === "admin";
        if (!isAdmin) {
            return NextResponse.json(
                { error: "Access denied. Only Admins can access the dashboard." },
                { status: 403 }
            );
        }

        // Set Auth Cookie
        (await cookies()).set("auth", "true", {
            httpOnly: true,
            path: "/",
        });

        return NextResponse.json({ success: true, user: data });
    } catch (error: any) {
        console.error("BGV verify-otp connection error:", error);
        return NextResponse.json(
            { error: "Failed to connect to backend OTP verification service", message: error.message },
            { status: 502 }
        );
    }
}
