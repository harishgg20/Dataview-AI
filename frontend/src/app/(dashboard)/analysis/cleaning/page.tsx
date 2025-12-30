"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectItem, SelectTrigger, SelectValue, SelectContent } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Eraser, ArrowRight, Save, RotateCcw, Trash2, Wand2, Type, Filter, Scissors, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function DataCleaningPage() {
    const [selectedDataset, setSelectedDataset] = useState("raw_sales_data.csv");

    // Mock columns for the column selector
    const columns = ["Order ID", "Order Date", "Customer Name", "Segment", "City", "State", "Sales", "Quantity", "Profit"];

    interface CleaningStep {
        id: number;
        type: string;
        description: string;
        column?: string;
        active: boolean;
        rowsBefore: number;
        rowsAfter: number;
    }

    const [pipeline, setPipeline] = useState<CleaningStep[]>([
        { id: 1, type: "filter", description: "Drop Null Rows", active: true, rowsBefore: 15425, rowsAfter: 15402 },
    ]);

    const addStep = (type: string, description: string, column?: string) => {
        const lastCount = pipeline.length > 0 ? pipeline[pipeline.length - 1].rowsAfter : 15425;
        // Mocking 'After' count reduction for demo
        const reduction = type === "filter" || type === "outlier" ? Math.floor(Math.random() * 50) : 0;

        const newStep: CleaningStep = {
            id: Date.now(),
            type,
            description,
            column,
            active: true,
            rowsBefore: lastCount,
            rowsAfter: lastCount - reduction
        };
        setPipeline([...pipeline, newStep]);
    };

    const toggleStep = (id: number) => {
        setPipeline(pipeline.map(step => step.id === id ? { ...step, active: !step.active } : step));
    };

    const removeStep = (id: number) => {
        setPipeline(pipeline.filter(step => step.id !== id));
    };

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Advanced Data Cleaning</h1>
                    <p className="text-muted-foreground">Build a robust cleaning recipe for {selectedDataset}</p>
                </div>
                <Button>
                    <Save className="mr-2 h-4 w-4" /> Save Recipe
                </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-12">

                {/* LEFT SIDEBAR: Operations Library */}
                <div className="md:col-span-4 space-y-6">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle>Operations</CardTitle>
                            <CardDescription>Select a transformation category</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Tabs defaultValue="column">
                                <TabsList className="grid w-full grid-cols-4 mb-4">
                                    <TabsTrigger value="column"><Type className="h-4 w-4" /></TabsTrigger>
                                    <TabsTrigger value="text"><Scissors className="h-4 w-4" /></TabsTrigger>
                                    <TabsTrigger value="filter"><Filter className="h-4 w-4" /></TabsTrigger>
                                    <TabsTrigger value="outlier"><AlertTriangle className="h-4 w-4" /></TabsTrigger>
                                </TabsList>

                                {/* TAB 1: Column & Type Operations */}
                                <TabsContent value="column" className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Target Column</Label>
                                        <Select>
                                            <SelectTrigger><SelectValue placeholder="Select Column..." /></SelectTrigger>
                                            <SelectContent>
                                                {columns.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Change Data Type</Label>
                                        <div className="flex gap-2">
                                            <Select>
                                                <SelectTrigger><SelectValue placeholder="To Type..." /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="int">Integer</SelectItem>
                                                    <SelectItem value="float">Decimal</SelectItem>
                                                    <SelectItem value="date">Date</SelectItem>
                                                    <SelectItem value="text">Text</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <Button size="sm" onClick={() => addStep("type", "Convert 'Sales' to Decimal", "Sales")}>Apply</Button>
                                        </div>
                                    </div>
                                    <Button variant="outline" className="w-full justify-start" onClick={() => addStep("column", "Fill Nulls with 0", "Sales")}>
                                        <RotateCcw className="mr-2 h-4 w-4" /> Fill Missing (0)
                                    </Button>
                                    <Button variant="outline" className="w-full justify-start" onClick={() => addStep("column", "Drop Column", "Order ID")}>
                                        <Eraser className="mr-2 h-4 w-4" /> Drop Column
                                    </Button>
                                </TabsContent>

                                {/* TAB 2: Text Cleaning */}
                                <TabsContent value="text" className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Target Column</Label>
                                        <Select>
                                            <SelectTrigger><SelectValue placeholder="Select Text Column..." /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="customer">Customer Name</SelectItem>
                                                <SelectItem value="city">City</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <Button variant="outline" onClick={() => addStep("text", "Trim Whitespace", "City")}>Trim</Button>
                                        <Button variant="outline" onClick={() => addStep("text", "To Uppercase", "City")}>UPPER</Button>
                                        <Button variant="outline" onClick={() => addStep("text", "To Lowercase", "City")}>lower</Button>
                                        <Button variant="outline" onClick={() => addStep("text", "To Title Case", "City")}>Title</Button>
                                    </div>
                                    <Button variant="outline" className="w-full" onClick={() => addStep("text", "Remove Special Chars", "Customer Name")}>Remove Special Chars</Button>
                                </TabsContent>

                                {/* TAB 3: Filters & Rules */}
                                <TabsContent value="filter" className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Filter Rules</Label>
                                        <Button variant="outline" className="w-full justify-start" onClick={() => addStep("filter", "Remove rows where Sales < 0")}>
                                            <Eraser className="mr-2 h-4 w-4" /> Remove Negative Values
                                        </Button>
                                        <Button variant="outline" className="w-full justify-start" onClick={() => addStep("filter", "Remove future dates")}>
                                            <Eraser className="mr-2 h-4 w-4" /> Remove Future Dates
                                        </Button>
                                        <Button variant="outline" className="w-full justify-start" onClick={() => addStep("filter", "Remove duplicates")}>
                                            <Eraser className="mr-2 h-4 w-4" /> Remove Duplicates
                                        </Button>
                                    </div>
                                </TabsContent>

                                {/* TAB 4: Outliers */}
                                <TabsContent value="outlier" className="space-y-4">
                                    <div className="p-3 bg-yellow-50 rounded-md border text-sm text-yellow-800">
                                        <AlertTriangle className="h-4 w-4 inline mr-1 mb-0.5" />
                                        Handling outliers can significantly impact statistical validity.
                                    </div>
                                    <Button variant="outline" className="w-full justify-start" onClick={() => addStep("outlier", "Remove Outliers (IQR)")}>
                                        <Scissors className="mr-2 h-4 w-4" /> Remove Outliers (IQR)
                                    </Button>
                                    <Button variant="outline" className="w-full justify-start" onClick={() => addStep("outlier", "Cap Outliers (Winsorize)")}>
                                        <RotateCcw className="mr-2 h-4 w-4" /> Cap at 1st/99th Percentile
                                    </Button>
                                </TabsContent>
                            </Tabs>
                        </CardContent>
                    </Card>

                    {/* AI Suggestions Panel */}
                    <Card className="bg-gradient-to-br from-indigo-50 to-white border-indigo-100">
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center text-indigo-700">
                                <Wand2 className="mr-2 h-4 w-4" /> Smart Suggestions
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="p-3 bg-white rounded-md border border-indigo-100 shadow-sm cursor-pointer hover:border-indigo-300 transition-colors" onClick={() => addStep("text", "Fix Inconsistent Casing", "City")}>
                                <div className="flex justify-between items-start">
                                    <span className="text-sm font-medium text-indigo-900">Inconsistent Casing</span>
                                    <Badge variant="secondary" className="text-[10px] bg-indigo-100 text-indigo-700">High Conf.</Badge>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">Column 'City' has mixed case values (e.g., 'New york'). Apply Title Case?</p>
                            </div>
                            <div className="p-3 bg-white rounded-md border border-indigo-100 shadow-sm cursor-pointer hover:border-indigo-300 transition-colors" onClick={() => addStep("type", "Convert to Date", "Order Date")}>
                                <div className="flex justify-between items-start">
                                    <span className="text-sm font-medium text-indigo-900">Wrong Data Type</span>
                                    <Badge variant="secondary" className="text-[10px] bg-indigo-100 text-indigo-700">Med Conf.</Badge>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">'Order Date' is currently Text. Convert to Date?</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* RIGHT MAIN: Pipeline Canvas */}
                <div className="md:col-span-8">
                    <Card className="h-full">
                        <CardHeader>
                            <CardTitle>Cleaning Recipe</CardTitle>
                            <CardDescription>Applied steps flow top-to-bottom</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="min-h-[500px] border-2 border-dashed rounded-lg p-6 bg-slate-50/50 flex flex-col items-center gap-4">

                                {/* Input Node */}
                                <div className="bg-white p-4 rounded shadow-sm border w-full max-w-2xl flex items-center gap-4">
                                    <div className="h-10 w-10 bg-blue-100 rounded flex items-center justify-center text-blue-600 font-bold shrink-0">CSV</div>
                                    <div>
                                        <div className="text-xs text-muted-foreground uppercase font-bold">Source</div>
                                        <div className="font-medium">{selectedDataset}</div>
                                    </div>
                                    <div className="ml-auto text-sm text-muted-foreground bg-slate-100 px-2 py-1 rounded">15,425 rows</div>
                                </div>

                                {/* Flow Line */}
                                <div className="h-6 w-0.5 bg-slate-300"></div>

                                {/* Pipeline Steps */}
                                {pipeline.map((step, index) => (
                                    <div key={step.id} className={`flex flex-col items-center w-full max-w-2xl transition-all ${!step.active ? 'opacity-50 grayscale' : ''}`}>
                                        <div className="bg-white p-4 rounded shadow-sm border w-full flex items-center gap-4 group hover:border-blue-300 transition-colors relative overflow-hidden">
                                            {/* Step Number */}
                                            <div className="h-8 w-8 bg-slate-100 rounded-full flex items-center justify-center text-sm font-bold text-slate-500 shrink-0">
                                                {index + 1}
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-semibold text-sm">{step.description}</span>
                                                    {step.column && <Badge variant="outline" className="text-[10px] h-5">{step.column}</Badge>}
                                                </div>
                                                <div className="flex items-center gap-4 mt-1">
                                                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                                                        <span>Rows:</span>
                                                        <span className="font-medium text-slate-700">{step.rowsBefore}</span>
                                                        <ArrowRight className="h-3 w-3" />
                                                        <span className={`font-medium ${step.rowsAfter < step.rowsBefore ? 'text-amber-600' : 'text-slate-700'}`}>
                                                            {step.rowsAfter}
                                                        </span>
                                                    </div>
                                                    {step.rowsAfter < step.rowsBefore && (
                                                        <span className="text-[10px] text-amber-600 font-medium bg-amber-50 px-1.5 rounded">
                                                            -{step.rowsBefore - step.rowsAfter} dropped
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex items-center gap-2">
                                                <div className="flex items-center gap-2 mr-2">
                                                    <Label htmlFor={`switch-${step.id}`} className="text-xs text-muted-foreground cursor-pointer">
                                                        {step.active ? 'Active' : 'Disabled'}
                                                    </Label>
                                                    <Switch id={`switch-${step.id}`} checked={step.active} onCheckedChange={() => toggleStep(step.id)} />
                                                </div>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-500" onClick={() => removeStep(step.id)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                        {/* Connector Line (if not last) */}
                                        <div className="h-6 w-0.5 bg-slate-300"></div>
                                    </div>
                                ))}

                                {/* Output Node */}
                                <div className="bg-green-50 p-4 rounded shadow-sm border border-green-200 w-full max-w-2xl flex items-center gap-4 opacity-100">
                                    <div className="h-10 w-10 bg-green-100 rounded flex items-center justify-center text-green-700 font-bold shrink-0">
                                        <CheckCircle2 className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <div className="text-xs text-green-700 uppercase font-bold">Final Output</div>
                                        <div className="font-medium text-green-900">Ready for Analysis</div>
                                    </div>
                                    <div className="ml-auto text-sm font-bold text-green-700 bg-green-100 px-3 py-1 rounded">
                                        {pipeline.length > 0 ? pipeline[pipeline.length - 1].rowsAfter : 15425} rows
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
