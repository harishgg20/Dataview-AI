"use client";

import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { authService, User } from "@/services/auth";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { Save, Loader2, LogOut, Sparkles } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

export default function SettingsPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Form States
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [apiKey, setApiKey] = useState("");

    // Avatar State
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [avatarData, setAvatarData] = useState<string | null>(null);

    // Density State
    const [density, setDensity] = useState<"standard" | "compact">("standard");

    useEffect(() => {
        const savedDensity = localStorage.getItem("analytics-density") as "standard" | "compact";
        if (savedDensity) {
            setDensity(savedDensity);
            if (savedDensity === "compact") {
                document.body.classList.add("compact");
            }
        }
    }, []);

    const toggleDensity = (newDensity: "standard" | "compact") => {
        setDensity(newDensity);
        localStorage.setItem("analytics-density", newDensity);
        if (newDensity === "compact") {
            document.body.classList.add("compact");
        } else {
            document.body.classList.remove("compact");
        }
    };

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            const data = await authService.getProfile();
            setUser(data);
            setFirstName(data.first_name);
            setLastName(data.last_name || "");
            setEmail(data.email);
            setAvatarData(data.avatar_data || null);
        } catch (err) {
            console.error("Failed to load profile", err);
            toast({
                title: "Error",
                description: "Failed to load user profile",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 100 * 1024) { // 100KB Limit
            toast({
                title: "File too large",
                description: "Please select an image under 100KB",
                variant: "destructive"
            });
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            setAvatarData(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const updates: any = {};
            if (firstName !== user?.first_name) updates.first_name = firstName;
            if (lastName !== (user?.last_name || "")) updates.last_name = lastName;
            if (email !== user?.email) updates.email = email;
            if (password) updates.password = password;
            if (password) updates.password = password;
            if (avatarData !== user?.avatar_data) updates.avatar_data = avatarData;
            if (apiKey) updates.api_key = apiKey;

            if (Object.keys(updates).length === 0) {
                toast({ title: "No changes to save" });
                setSaving(false);
                return;
            }

            await authService.updateProfile(updates);

            toast({
                title: "Profile Updated",
                description: "Your settings have been saved successfully.",
            });

            // Reload to sync state
            await loadProfile();
            await loadProfile();
            setPassword(""); // Clear password field
            setApiKey(""); // Clear API Key field

        } catch (err: any) {
            console.error("Failed to update profile", err);
            toast({
                title: "Update Failed",
                description: err.response?.data?.detail || "Could not update profile",
                variant: "destructive",
            });
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        // Clear cookies if used, but strictly local storage for now based on auth service
        router.push("/login");
    };

    const handleDeleteAccount = async () => {
        if (!confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
            return;
        }

        try {
            await authService.deleteAccount();
            toast({
                title: "Account Deleted",
                description: "Your account has been permanently deleted.",
            });
            router.push("/signup");
        } catch (err) {
            console.error("Failed to delete account", err);
            toast({
                title: "Error",
                description: "Failed to delete account. Please try again.",
                variant: "destructive",
            });
        }
    };

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Loading settings...</div>;
    }

    return (
        <div className="container max-w-3xl mx-auto py-10 space-y-8">
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                    <p className="text-muted-foreground text-lg">
                        Manage your account settings and workspace preferences.
                    </p>
                </div>
                <Button variant="destructive" onClick={handleLogout} className="gap-2">
                    <LogOut className="h-4 w-4" /> Log out
                </Button>
            </div>

            <div className="grid gap-8">
                {/* Profile Section */}
                <Card>
                    <CardHeader className="space-y-1">
                        <CardTitle className="text-2xl">Profile</CardTitle>
                        <CardDescription>
                            Update your personal information and security settings.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex flex-col md:flex-row gap-6">
                            {/* Avatar Section */}
                            <div className="flex flex-col items-center gap-2">
                                <div className="h-24 w-24 rounded-full bg-slate-100 flex items-center justify-center border-2 border-white shadow-sm ring-1 ring-slate-200 overflow-hidden relative">
                                    {avatarData ? (
                                        <img
                                            src={avatarData}
                                            alt="Avatar"
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <span className="text-3xl font-semibold text-slate-400">
                                            {firstName ? firstName[0].toUpperCase() : "U"}
                                        </span>
                                    )}
                                </div>
                                <div className="flex flex-col items-center">
                                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 mb-2 uppercase tracking-wider">
                                        {user?.role || "Viewer"}
                                    </span>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-xs text-muted-foreground"
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        Change Avatar
                                    </Button>
                                </div>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                />
                            </div>

                            {/* Form Fields */}
                            <div className="flex-1 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="firstName">First Name</Label>
                                        <Input
                                            id="firstName"
                                            value={firstName}
                                            onChange={(e) => setFirstName(e.target.value)}
                                            placeholder="John"
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="lastName">Last Name</Label>
                                        <Input
                                            id="lastName"
                                            value={lastName}
                                            onChange={(e) => setLastName(e.target.value)}
                                            placeholder="Doe"
                                        />
                                    </div>
                                </div>


                                <div className="grid gap-2">
                                    <Label htmlFor="email">Email Address</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="john@example.com"
                                        className="bg-slate-50"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="h-[1px] bg-border my-6" />

                        <div className="space-y-4">
                            <h3 className="text-lg font-medium">Security</h3>
                            <div className="grid gap-2 max-w-md">
                                <Label htmlFor="password">Update Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter new password to change"
                                />
                                <p className="text-[0.8rem] text-muted-foreground">
                                    Leave blank to keep your current password.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-between border-t bg-slate-50/50 p-6">
                        <div className="text-xs text-muted-foreground italic">
                            Last profile update: Today
                        </div>
                        <Button onClick={handleSave} disabled={saving}>
                            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {saving ? "Saving..." : "Save Changes"}
                        </Button>
                    </CardFooter>
                </Card >

                {/* AI Configuration */}
                <Card>
                    <CardHeader className="space-y-1">
                        <div className="flex items-center space-x-2">
                            <Sparkles className="h-5 w-5 text-purple-600" />
                            <CardTitle className="text-2xl">AI Configuration</CardTitle>
                        </div>
                        <CardDescription>
                            Configure your AI credentials (BYOK).
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-2 max-w-md">
                            <Label htmlFor="apiKey">Gemini API Key</Label>
                            <Input
                                id="apiKey"
                                type="password"
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                placeholder="sk-..."
                            />
                            <p className="text-[0.8rem] text-muted-foreground">
                                Leave blank to use the system default key. Entering a key here overrides the system key for your account.
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Appearance Section */}
                < Card >
                    <CardHeader className="space-y-1">
                        <CardTitle className="text-2xl">Appearance</CardTitle>
                        <CardDescription>
                            Customize how the analytics dashboard looks and feels.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 transition-colors">
                            <div className="space-y-0.5">
                                <Label className="text-base font-medium">Theme Preference</Label>
                                <div className="text-sm text-muted-foreground">
                                    Switch between light and dark modes.
                                </div>
                            </div>
                            <ThemeToggle />
                        </div>

                        <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 transition-colors">
                            <div className="space-y-0.5">
                                <Label className="text-base font-medium">Information Density</Label>
                                <div className="text-sm text-muted-foreground">
                                    Adjust spacing in data tables and lists.
                                </div>
                            </div>
                            <div className="flex items-center p-1 bg-slate-100 rounded-lg">
                                <button
                                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${density === 'standard'
                                        ? 'bg-white text-slate-900 shadow-sm'
                                        : 'text-slate-500 hover:text-slate-900'
                                        }`}
                                    onClick={() => toggleDensity("standard")}
                                >
                                    Standard
                                </button>
                                <button
                                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${density === 'compact'
                                        ? 'bg-white text-slate-900 shadow-sm'
                                        : 'text-slate-500 hover:text-slate-900'
                                        }`}
                                    onClick={() => toggleDensity("compact")}
                                >
                                    Compact
                                </button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Danger Zone */}
                <Card className="border-red-200">
                    <CardHeader className="space-y-1">
                        <CardTitle className="text-2xl text-red-600">Danger Zone</CardTitle>
                        <CardDescription>
                            Irreversible actions for your account.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between p-4 border border-red-100 rounded-lg bg-red-50/50">
                            <div className="space-y-0.5">
                                <Label className="text-base font-medium text-red-900">Delete Account</Label>
                                <div className="text-sm text-red-700">
                                    Permanently remove your account and all associated data.
                                </div>
                            </div>
                            <Button variant="destructive" onClick={handleDeleteAccount}>
                                Delete Account
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div >
        </div >
    );
}
