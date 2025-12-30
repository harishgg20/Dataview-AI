"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import api from "@/lib/api";

export default function SignupPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        first_name: "",
        last_name: "",
        email: "",
        password: ""
    });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSignup = async () => {
        setLoading(true);
        setError("");
        try {
            await api.post("/auth/signup", formData);
            router.push("/login"); // Redirect to login after successful signup
        } catch (err: any) {
            console.error(err);
            setError("Failed to create account. Email may already be in use.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
            <Card className="w-full max-w-sm rounded-[16px] border-none shadow-md">
                <CardHeader className="space-y-1 text-center pb-2">
                    <CardTitle className="text-xl font-bold">Analytics Workspace</CardTitle>
                    <CardDescription>Create your account</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 pt-4">
                    {error && <div className="text-red-500 text-sm text-center">{error}</div>}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="firstName">First Name</Label>
                            <Input
                                id="firstName"
                                type="text"
                                placeholder="John"
                                value={formData.first_name}
                                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="lastName">Last Name</Label>
                            <Input
                                id="lastName"
                                type="text"
                                placeholder="Doe"
                                value={formData.last_name}
                                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="m@example.com"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="password">Password</Label>
                        <Input
                            id="password"
                            type="password"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        />
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-4">
                    <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={handleSignup} disabled={loading}>
                        {loading ? "Creating Account..." : "Sign Up"}
                    </Button>
                    <div className="text-center text-sm text-muted-foreground">
                        Already have an account?{" "}
                        <Link href="/login" className="text-blue-600 hover:underline" suppressHydrationWarning>
                            Sign in
                        </Link>
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
}
