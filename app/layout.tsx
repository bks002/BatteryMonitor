import "./globals.css";
import { ThemeProvider } from "next-themes";
import Navbar from "@/app/components/navbar";


export const metadata = {
    title: "UfirmIOT Dashboard",
};

export default function RootLayout({
                                       children,
                                   }: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" suppressHydrationWarning>
        <body className="bg-gray-100 dark:bg-gray-950">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>

            {/* ✅ Global Navbar */}
            <Navbar />

            {/* Page Content */}
            <main>{children}</main>

        </ThemeProvider>
        </body>
        </html>
    );
}