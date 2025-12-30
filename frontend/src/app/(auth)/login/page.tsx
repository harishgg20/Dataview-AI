"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import api from "@/lib/api";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        setLoading(true);
        setError("");
        try {
            const response = await api.post("/auth/login", {
                email: email,
                password: password
            });

            localStorage.setItem("token", response.data.access_token);
            router.push("/analysis");
        } catch (err: any) {
            console.error(err);
            setError("Invalid email or password");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50" suppressHydrationWarning={true}>
            <Card className="w-full max-w-sm rounded-[16px] border-none shadow-md">
                <CardHeader className="space-y-1 text-center pb-2">
                    <CardTitle className="text-xl font-bold">Analytics Workspace</CardTitle>
                    <CardDescription>Sign in to continue</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 pt-4">
                    {error && <div className="text-red-500 text-sm text-center">{error}</div>}
                    <div className="grid gap-2" suppressHydrationWarning>
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="m@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    <div className="grid gap-2" suppressHydrationWarning>
                        <Label htmlFor="password">Password</Label>
                        <Input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-4">
                    <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={handleLogin} disabled={loading}>
                        {loading ? "Signing in..." : "Sign In"}
                    </Button>
                    <div className="text-center text-sm text-muted-foreground">
                        Don&apos;t have an account?{" "}
                        <Link href="/signup" className="text-blue-600 hover:underline" suppressHydrationWarning>
                            Create one
                        </Link>
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
}
