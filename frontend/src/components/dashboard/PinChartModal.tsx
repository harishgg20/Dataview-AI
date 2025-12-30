"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { dashboardService, Dashboard } from "@/services/dashboard";
import { Loader2, Plus } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface PinChartModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    config: any; // The chart configuration to save
    title?: string;
}

export function PinChartModal({ open, onOpenChange, config, title: initialTitle }: PinChartModalProps) {
    const { toast } = useToast();
    const [dashboards, setDashboards] = useState<Dashboard[]>([]);
    const [loading, setLoading] = useState(false);
    const [creating, setCreating] = useState(false);

    // Form State
    const [selectedDashboardId, setSelectedDashboardId] = useState<string>("");
    const [widgetTitle, setWidgetTitle] = useState(initialTitle || "My Chart");
    const [newDashboardName, setNewDashboardName] = useState("");
    const [isNewDashboard, setIsNewDashboard] = useState(false);

    useEffect(() => {
        if (open) {
            loadDashboards();
            setIsNewDashboard(false);
            setNewDashboardName("");
            if (initialTitle) setWidgetTitle(initialTitle);
        }
    }, [open, initialTitle]);

    const loadDashboards = async () => {
        setLoading(true);
        try {
            const data = await dashboardService.getAll();
            setDashboards(data);
            if (data.length > 0) {
                setSelectedDashboardId(data[0].id.toString());
            } else {
                setIsNewDashboard(true);
            }
        } catch (err) {
            console.error("Failed to load dashboards", err);
        } finally {
            setLoading(false);
        }
    };

    const handlePin = async () => {
        setCreating(true);
        try {
            let dashboardId = parseInt(selectedDashboardId);

            // Create new dashboard if selected
            if (isNewDashboard) {
                if (!newDashboardName.trim()) {
                    toast({ title: "Error", description: "Dashboard name is required", variant: "destructive" });
                    setCreating(false);
                    return;
                }
                const newDash = await dashboardService.create({ name: newDashboardName });
                dashboardId = newDash.id;
            }

            // Create Widget
            // Determine chart type from config or default
            const type = config.type || "chart";

            await dashboardService.createWidget(dashboardId, {
                title: widgetTitle,
                type: type,
                config: config,
                layout: { w: 6, h: 4 } // Default size
            });

            toast({ title: "Success", description: "Chart pinned to dashboard!" });
            onOpenChange(false);

        } catch (err) {
            console.error("Failed to pin chart", err);
            toast({ title: "Error", description: "Failed to save widget", variant: "destructive" });
        } finally {
            setCreating(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Pin to Dashboard</DialogTitle>
                    <DialogDescription>
                        Save this visualization to a custom dashboard for easy access.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label>Widget Title</Label>
                        <Input
                            value={widgetTitle}
                            onChange={(e) => setWidgetTitle(e.target.value)}
                            placeholder="e.g., Monthly Sales Trend"
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label>Select Dashboard</Label>
                        {!isNewDashboard && dashboards.length > 0 ? (
                            <div className="flex gap-2">
                                <Select value={selectedDashboardId} onValueChange={setSelectedDashboardId}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select dashboard..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {dashboards.map(d => (
                                            <SelectItem key={d.id} value={d.id.toString()}>{d.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Button variant="outline" size="icon" onClick={() => setIsNewDashboard(true)} title="Create New">
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>
                        ) : (
                            <div className="flex gap-2">
                                <Input
                                    value={newDashboardName}
                                    onChange={(e) => setNewDashboardName(e.target.value)}
                                    placeholder="New Dashboard Name"
                                    autoFocus
                                />
                                {dashboards.length > 0 && (
                                    <Button variant="ghost" onClick={() => setIsNewDashboard(false)}>Cancel</Button>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={creating}>Cancel</Button>
                    <Button onClick={handlePin} disabled={creating || loading}>
                        {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Pin
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
