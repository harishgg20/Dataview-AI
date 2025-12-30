"use client";

import { useDashboardStore } from "@/store/dashboardStore";
import { Button } from "@/components/ui/button";
import { Filter, X, Plus } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface GlobalSlicerProps {
    columns: string[];
    className?: string;
}

export function GlobalSlicer({ columns, className }: GlobalSlicerProps) {
    const { globalFilters, addGlobalFilter, removeGlobalFilter } = useDashboardStore();
    const [newFilter, setNewFilter] = useState({ column: '', operator: 'contains', value: '' });

    const handleAdd = () => {
        if (!newFilter.column || !newFilter.value) return;
        addGlobalFilter({ ...newFilter, id: Date.now().toString() } as any);
        setNewFilter({ ...newFilter, value: '' }); // reset value
    };

    return (
        <div className={cn("flex flex-wrap items-center gap-2", className)}>
            <div className="flex items-center text-sm font-medium text-muted-foreground mr-2">
                <Filter className="h-4 w-4 mr-1" />
                Global Filters:
            </div>

            {globalFilters.map((filter) => (
                <div key={filter.id} className="flex items-center gap-2 bg-white px-3 py-1 rounded-full border text-xs shadow-sm shadow-blue-100">
                    <span className="font-semibold text-blue-700">{filter.column}</span>
                    <span className="text-muted-foreground">{filter.operator}</span>
                    <span className="font-mono bg-slate-100 px-1 rounded">{filter.value}</span>
                    <button onClick={() => removeGlobalFilter(filter.id)} className="text-slate-400 hover:text-red-500 ml-1">
                        <X className="h-3 w-3" />
                    </button>
                </div>
            ))}

            <Popover>
                <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="h-7 text-xs border-dashed">
                        <Plus className="h-3 w-3 mr-1" /> Add Slicer
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-3" align="start">
                    <div className="space-y-3">
                        <div className="space-y-4">
                            <div className="pb-2 border-b">
                                <h4 className="font-semibold text-sm">Add Global Filter</h4>
                                <p className="text-[10px] text-muted-foreground">Filter all charts by a specific column.</p>
                            </div>
                            <div className="grid gap-3">
                                <div className="space-y-1">
                                    <label className="text-[10px] uppercase font-bold text-gray-500">Column</label>
                                    <Select value={newFilter.column} onValueChange={(v: string) => setNewFilter({ ...newFilter, column: v })}>
                                        <SelectTrigger className="h-9 text-sm">
                                            <SelectValue placeholder="Select Column" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {columns.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] uppercase font-bold text-gray-500">Operator</label>
                                    <Select value={newFilter.operator} onValueChange={(v: string) => setNewFilter({ ...newFilter, operator: v })}>
                                        <SelectTrigger className="h-9 text-sm">
                                            <SelectValue placeholder="Operator" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="contains">Contains</SelectItem>
                                            <SelectItem value="not_contains">Does not contain</SelectItem>
                                            <SelectItem value="eq">Equals (=)</SelectItem>
                                            <SelectItem value="neq">Not Equal (!=)</SelectItem>
                                            <SelectItem value="gt">Greater Than (&gt;)</SelectItem>
                                            <SelectItem value="lt">Less Than (&lt;)</SelectItem>
                                            <SelectItem value="gte">Greater/Equal (&gt;=)</SelectItem>
                                            <SelectItem value="lte">Less/Equal (&lt;=)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] uppercase font-bold text-gray-500">Value</label>
                                    <Input
                                        placeholder="Enter value..."
                                        value={newFilter.value}
                                        onChange={(e) => setNewFilter({ ...newFilter, value: e.target.value })}
                                        className="h-9 text-sm"
                                    />
                                </div>

                                <Button size="sm" onClick={handleAdd} className="w-full mt-2">Apply Filter</Button>
                            </div>
                        </div>
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    );
}
