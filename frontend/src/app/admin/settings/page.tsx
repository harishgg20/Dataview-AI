"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Loader2, Save, ShieldAlert } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function AdminSettingsPage() {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);

    // Mock Settings State
    const [settings, setSettings] = useState({
        siteName: "Analytics Platform",
        maintenanceMode: false,
        allowRegistration: true,
        enablePublicDashboards: false,
        maxUploadSize: 50, // MB
    });

    const handleSave = async () => {
        setLoading(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        setLoading(false);

        toast({
            title: "Settings saved",
            description: "System configuration has been updated successfully.",
        });
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
                <p className="text-muted-foreground">
                    Configure global application parameters and preferences.
                </p>
            </div>

            <div className="grid gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>General Configuration</CardTitle>
                        <CardDescription>Basic settings for the application instance.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="siteName">Application Name</Label>
                            <Input
                                id="siteName"
                                value={settings.siteName}
                                onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                                placeholder="My Analytics App"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="uploadSize">Max Upload Size (MB)</Label>
                            <Input
                                id="uploadSize"
                                type="number"
                                value={settings.maxUploadSize}
                                onChange={(e) => setSettings({ ...settings, maxUploadSize: parseInt(e.target.value) })}
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Access & Security</CardTitle>
                        <CardDescription>Manage user access and system availability.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between space-x-2">
                            <div className="space-y-0.5">
                                <Label className="text-base">Allow New Registrations</Label>
                                <p className="text-sm text-muted-foreground">
                                    If disabled, new users will not be able to sign up.
                                </p>
                            </div>
                            <Switch
                                checked={settings.allowRegistration}
                                onCheckedChange={(c) => setSettings({ ...settings, allowRegistration: c })}
                            />
                        </div>
                        <div className="flex items-center justify-between space-x-2">
                            <div className="space-y-0.5">
                                <Label className="text-base">Public Dashboards</Label>
                                <p className="text-sm text-muted-foreground">
                                    Allow users to share dashboards publicly via link.
                                </p>
                            </div>
                            <Switch
                                checked={settings.enablePublicDashboards}
                                onCheckedChange={(c) => setSettings({ ...settings, enablePublicDashboards: c })}
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-red-100">
                    <CardHeader>
                        <CardTitle className="text-red-900 flex items-center gap-2">
                            <ShieldAlert className="h-5 w-5" />
                            Danger Zone
                        </CardTitle>
                        <CardDescription className="text-red-700">Critical system actions.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between space-x-2">
                            <div className="space-y-0.5">
                                <Label className="text-base text-red-900">Maintenance Mode</Label>
                                <p className="text-sm text-red-600">
                                    Disables access for all non-admin users.
                                </p>
                            </div>
                            <Switch
                                checked={settings.maintenanceMode}
                                onCheckedChange={(c) => setSettings({ ...settings, maintenanceMode: c })}
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="flex justify-end">
                <Button onClick={handleSave} disabled={loading} size="lg">
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Save Changes
                </Button>
            </div>
        </div>
    );
}
