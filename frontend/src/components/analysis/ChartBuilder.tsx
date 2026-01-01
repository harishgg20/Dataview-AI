"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BarChart2, LineChart, PieChart, ScatterChart, Save } from "lucide-react";
import { useDashboardStore } from "@/store/dashboardStore";

interface ChartBuilderProps {
    columns: string[];
    onSave: (config: any, name: string) => void;
    onCancel: () => void;
}

export function ChartBuilder({ columns, onSave, onCancel }: ChartBuilderProps) {
    const [name, setName] = useState("New Chart");
    const [config, setConfig] = useState<{
        type: 'bar' | 'line' | 'scatter' | 'pie' | 'area';
        xAxis: string;
        yAxis: string;
        agg: 'sum' | 'avg' | 'count' | 'min' | 'max';
    }>({
        type: 'bar',
        xAxis: '',
        yAxis: '',
        agg: 'sum'
    });

    const isReady = config.xAxis && config.yAxis && name;

    return (
        <div className="flex flex-col h-full border-l bg-white text-black shadow-xl w-[350px] absolute right-0 top-0 bottom-0 z-50 animate-in slide-in-from-right">
            <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                <h3 className="font-semibold text-lg">Build Visual</h3>
                <Button variant="ghost" size="sm" onClick={onCancel}>Close</Button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">

                {/* 1. Visualization Type */}
                <div className="space-y-3">
                    <Label>Visualization Type</Label>
                    <div className="grid grid-cols-4 gap-2">
                        {[
                            { id: 'bar', icon: BarChart2, label: 'Bar' },
                            { id: 'line', icon: LineChart, label: 'Line' },
                            { id: 'pie', icon: PieChart, label: 'Pie' },
                            { id: 'area', icon: ScatterChart, label: 'Area' },
                        ].map((type) => (
                            <button
                                key={type.id}
                                onClick={() => setConfig({ ...config, type: type.id as any })}
                                className={`flex flex-col items-center justify-center p-2 rounded border transition-all ${config.type === type.id ? 'bg-blue-50 border-blue-500 text-blue-700 ring-1 ring-blue-500' : 'hover:bg-gray-50'}`}
                            >
                                <type.icon className="h-5 w-5 mb-1" />
                                <span className="text-[10px] uppercase font-medium">{type.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* 2. Data Configuration */}
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label>Chart Title</Label>
                        <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Sales by City" className="text-black" />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-black">X-Axis (Dimension)</Label>
                        <Select value={config.xAxis} onValueChange={(v: string) => setConfig({ ...config, xAxis: v })}>
                            <SelectTrigger className="text-black border-slate-300">
                                <SelectValue placeholder="Select Column" />
                            </SelectTrigger>
                            <SelectContent className="text-black bg-white border-slate-200">
                                {columns.map(c => <SelectItem key={c} value={c} className="hover:bg-slate-100 text-black">{c}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-black">Y-Axis (Measure)</Label>
                        <Select value={config.yAxis} onValueChange={(v: string) => setConfig({ ...config, yAxis: v })}>
                            <SelectTrigger className="text-black border-slate-300">
                                <SelectValue placeholder="Select Column" />
                            </SelectTrigger>
                            <SelectContent className="text-black bg-white border-slate-200">
                                {columns.map(c => <SelectItem key={c} value={c} className="hover:bg-slate-100 text-black">{c}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-black">Aggregation</Label>
                        <Select value={config.agg} onValueChange={(v: string) => setConfig({ ...config, agg: v as any })}>
                            <SelectTrigger className="text-black border-slate-300">
                                <SelectValue placeholder="Sum" />
                            </SelectTrigger>
                            <SelectContent className="text-black bg-white border-slate-200">
                                <SelectItem value="sum" className="text-black">Sum</SelectItem>
                                <SelectItem value="avg" className="text-black">Average</SelectItem>
                                <SelectItem value="count" className="text-black">Count</SelectItem>
                                <SelectItem value="min" className="text-black">Min</SelectItem>
                                <SelectItem value="max" className="text-black">Max</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="p-4 bg-blue-50/50 rounded-lg text-xs text-blue-700">
                    <p className="font-semibold mb-1">Preview Tip:</p>
                    Select columns above. The visual will be added to the grid immediately upon saving.
                </div>
            </div>

            <div className="p-4 border-t bg-gray-50">
                <Button
                    className="w-full"
                    disabled={!isReady}
                    onClick={() => onSave(config, name)}
                >
                    <Save className="h-4 w-4 mr-2" />
                    Add to Dashboard
                </Button>
            </div>
        </div>
    );
}
