import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const BACKEND_URL = "http://localhost:62929";

export async function POST(req: Request) {
    try {
        const { username, password } = await req.json();

        if (!username || !password) {
            return Response.json({ success: false, error: "Credentials are required" }, { status: 400 });
        }

        const trimmedUser = username.trim();
        const isPhoneNumber = /^\d{10}$/.test(trimmedUser);

        if (isPhoneNumber) {
            try {
                // Call C# backend phone login
                const res = await fetch(`${BACKEND_URL}/api/bgvusers/login`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        PhoneNumber: trimmedUser,
                        PasswordHash: password,
                    }),
                });

                if (res.ok) {
                    const user = await res.json();
                    
                    // Validate Admin status
                    const isAdmin = user.UserTypeId === 1 || user.UserTypeName?.toLowerCase() === "admin";
                    if (!isAdmin) {
                        return Response.json(
                            { success: false, error: "Access denied. Only Admins can access the dashboard." },
                            { status: 403 }
                        );
                    }

                    (await cookies()).set("auth", "true", {
                        httpOnly: true,
                        path: "/",
                    });

                    return Response.json({ success: true, user });
                } else {
                    const text = await res.text();
                    return Response.json(
                        { success: false, error: text || "Invalid credentials" },
                        { status: res.status }
                    );
                }
            } catch (err: any) {
                console.error("C# Backend phone login connection error:", err);
                // Continue to fallback checks in case backend is down
            }
        }

        // Email / password lookup logic (for backward compatibility and fallback check)
        try {
            const res = await fetch(`${BACKEND_URL}/api/bgvusers`, {
                cache: "no-store",
            });

            if (res.ok) {
                const users = await res.json();
                const matchedUser = users.find((user: any) => 
                    user.Email && 
                    user.Email.toLowerCase() === trimmedUser.toLowerCase()
                );

                if (matchedUser) {
                    const isAdmin = matchedUser.UserTypeId === 1 || matchedUser.UserTypeName?.toLowerCase() === "admin";
                    if (!isAdmin) {
                        return Response.json(
                            { success: false, error: "Access denied. Only Admins can access the dashboard." },
                            { status: 403 }
                        );
                    }

                    const isPasswordValid = 
                        (trimmedUser.toLowerCase() === "abcd@gmail.com" && password === "123456") ||
                        (matchedUser.PasswordHash && String(matchedUser.PasswordHash) === String(password));

                    if (isPasswordValid) {
                        (await cookies()).set("auth", "true", {
                            httpOnly: true,
                            path: "/",
                        });
                        return Response.json({ success: true, user: matchedUser });
                    }
                }
            }
        } catch (err) {
            console.error("Email lookup backend connection error:", err);
        }

        // Hardcoded fallback for the default admin credentials
        if (trimmedUser.toLowerCase() === "abcd@gmail.com" && password === "123456") {
            (await cookies()).set("auth", "true", {
                httpOnly: true,
                path: "/",
            });
            return Response.json({ success: true });
        }

        return Response.json({ success: false, error: "Invalid username or password" }, { status: 401 });
    } catch (error: any) {
        console.error("Login route error:", error);
        return Response.json({ success: false, error: error.message }, { status: 500 });
    }
}