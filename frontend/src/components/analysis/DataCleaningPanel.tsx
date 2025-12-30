"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectItem, SelectTrigger, SelectValue, SelectContent } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import {
    Eraser, ArrowRight, Save, RotateCcw, Trash2, Wand2,
    Type, Filter, Scissors, AlertTriangle, CheckCircle2,
    Split, Merge, Replace, BookTemplate, Download, Play, GripVertical, FileSpreadsheet, Activity, Check
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Reorder, useDragControls } from "framer-motion";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface CleaningStep {
    id: number;
    type: string;
    description: string;
    column?: string;
    active: boolean;
    rowsBefore: number;
    rowsAfter: number;
}

interface DataCleaningPanelProps {
    columns: string[];
    data?: any[];
    totalRows?: number;
    onSaveRecipe?: (pipeline: CleaningStep[]) => void;
}

// Draggable Item Component
const DraggableStep = ({ step, index, toggleStep, removeStep }: { step: CleaningStep, index: number, toggleStep: any, removeStep: any }) => {
    const controls = useDragControls();

    return (
        <Reorder.Item value={step} id={String(step.id)} dragListener={false} dragControls={controls} className="w-full max-w-2xl mb-4 text-left list-none">
            <div className={`flex flex-col items-center w-full transition-all ${!step.active ? 'opacity-50 grayscale' : ''}`}>
                <div className="bg-white p-4 rounded shadow-sm border w-full flex items-center gap-4 group hover:border-blue-300 transition-colors relative overflow-hidden">
                    {/* Drag Handle */}
                    <div
                        className="cursor-move p-1 text-slate-400 hover:text-slate-600"
                        onPointerDown={(e) => controls.start(e)}
                    >
                        <GripVertical className="h-4 w-4" />
                    </div>

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
                                <span className="font-medium text-slate-700">{step.rowsBefore.toLocaleString()}</span>
                                <ArrowRight className="h-3 w-3" />
                                <span className={`font-medium ${step.rowsAfter < step.rowsBefore ? 'text-amber-600' : 'text-slate-700'}`}>
                                    {step.rowsAfter.toLocaleString()}
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
                            <Label htmlFor={`switch-${step.id}`} className="text-xs text-muted-foreground cursor-pointer select-none">
                                {step.active ? 'Active' : 'Disabled'}
                            </Label>
                            <Switch id={`switch-${step.id}`} checked={step.active} onCheckedChange={() => toggleStep(step.id)} />
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-500" onClick={() => removeStep(step.id)}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>
            {/* Connector Line (visual only) */}
            <div className="h-6 w-0.5 bg-slate-300 shrink-0 mx-auto"></div>
        </Reorder.Item>
    )
}


export function DataCleaningPanel({ columns = [], data = [], totalRows = 0, onSaveRecipe }: DataCleaningPanelProps) {
    const { toast } = useToast();
    // Fallback if no columns provided
    const cols = columns.length > 0 ? columns : ["Order ID", "Order Date", "Customer Name", "Segment", "City", "State", "Sales", "Quantity", "Profit"];
    const previewRows = data.length > 0 ? data : [...Array(20)].map(() => cols.reduce((acc, col) => ({ ...acc, [col]: "Sample Val" }), {}));

    // Use passed totalRows or fallback to mocked 15425 for dev/demo if 0
    const initialRows = totalRows > 0 ? totalRows : 15425;

    const [pipeline, setPipeline] = useState<CleaningStep[]>([
    ]);

    // Initialize pipeline with a sample step only if using mock data, otherwise empty to start fresh?
    // Actually user might want no steps initially. Let's start empty or with a harmless step.
    // Preserving the "Drop Null Rows" as a default example but adapting it.
    useEffect(() => {
        if (pipeline.length === 0) {
            setPipeline([{ id: 1, type: "filter", description: "Drop Null Rows", active: true, rowsBefore: initialRows, rowsAfter: Math.floor(initialRows * 0.99) }]);
        }
    }, [initialRows]); // Reset if file changes (initialRows changes)

    // Template Persistence
    const [savedTemplates, setSavedTemplates] = useState<{ name: string, description: string, steps: CleaningStep[] }[]>([
        {
            name: "Standard Clean",
            description: "Basic null removal and trimming",
            steps: [
                { id: 1, type: "filter", description: "Drop Null Rows", active: true, rowsBefore: initialRows, rowsAfter: initialRows - 25 },
                { id: 2, type: "text", description: "Trim Whitespace", column: "City", active: true, rowsBefore: initialRows - 25, rowsAfter: initialRows - 25 },
                { id: 3, type: "standardize", description: "Standardize City Names", column: "City", active: true, rowsBefore: initialRows - 25, rowsAfter: initialRows - 25 },
            ]
        },
        {
            name: "Aggressive Clean",
            description: "Remove outliers and duplicates",
            steps: [
                { id: 1, type: "filter", description: "Drop Null Rows", active: true, rowsBefore: initialRows, rowsAfter: initialRows - 25 },
                { id: 2, type: "outlier", description: "Remove Outliers (IQR)", active: true, rowsBefore: initialRows - 25, rowsAfter: Math.floor((initialRows - 25) * 0.9) },
                { id: 3, type: "filter", description: "Remove Duplicates", active: true, rowsBefore: Math.floor((initialRows - 25) * 0.9), rowsAfter: Math.floor((initialRows - 25) * 0.88) },
            ]
        }
    ]);

    // Template State
    const [templateName, setTemplateName] = useState("");
    const [showSaveTemplate, setShowSaveTemplate] = useState(false);
    const [isLoadTemplateOpen, setIsLoadTemplateOpen] = useState(false);

    // Merge State
    const [mergeCol1, setMergeCol1] = useState("");
    const [mergeCol2, setMergeCol2] = useState("");
    const [mergeSeparator, setMergeSeparator] = useState(", ");

    // Split State
    const [splitCol, setSplitCol] = useState("");
    const [splitDelimiter, setSplitDelimiter] = useState(",");

    // Standardize State
    const [stdCol, setStdCol] = useState("");
    const [mockMappings, setMockMappings] = useState<{ from: string, to: string }[]>([]);

    // Preview Modal State
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);

    // Re-calculate mock row counts on reorder/change
    useEffect(() => {
        // Simple mock: strictly decreasing row count based on step type
        // In real app, this would trigger a backend dry-run
        let currentRows = initialRows;
        const newPipeline = pipeline.map(step => {
            const rowsBefore = currentRows;
            // Some logical reduction
            let reduction = 0;
            if (step.active) {
                if (step.description.includes("Drop") || step.description.includes("Remove")) reduction = 25;
                if (step.description.includes("Null")) reduction = 23;
            }
            // Ensure we don't go below 0
            currentRows = Math.max(0, rowsBefore - reduction);
            return { ...step, rowsBefore, rowsAfter: currentRows };
        });
        // Only update if numbers changed to avoid infinite loop
        const changed = JSON.stringify(newPipeline.map(p => p.rowsAfter)) !== JSON.stringify(pipeline.map(p => p.rowsAfter));
        if (changed) setPipeline(newPipeline);
    }, [pipeline.length, initialRows]); // Added initialRows dependency

    const addStep = (type: string, description: string, column?: string) => {
        const lastCount = pipeline.length > 0 ? pipeline[pipeline.length - 1].rowsAfter : initialRows;
        // Mocking 'After' count reduction
        const reduction = type === "filter" || type === "outlier" ? Math.floor(Math.random() * 50) : 0;

        const newStep: CleaningStep = {
            id: Date.now(),
            type,
            description,
            column,
            active: true,
            rowsBefore: lastCount,
            rowsAfter: Math.max(0, lastCount - reduction)
        };
        setPipeline([...pipeline, newStep]);
    };

    const toggleStep = (id: number) => {
        setPipeline(pipeline.map(step => step.id === id ? { ...step, active: !step.active } : step));
    };

    const removeStep = (id: number) => {
        setPipeline(pipeline.filter(step => step.id !== id));
    };

    const handleSaveTemplate = () => {
        if (!templateName) {
            toast({ title: "Error", description: "Please enter a template name", variant: "destructive" });
            return;
        }
        setSavedTemplates([...savedTemplates, {
            name: templateName,
            description: `${pipeline.length} steps custom recipe`,
            steps: [...pipeline]
        }]);
        setTemplateName("");
        setShowSaveTemplate(false);
        toast({
            title: "Template Saved",
            description: `Saved "${templateName}" to your templates.`,
            variant: "success"
        });
    };

    const handleApplyTemplate = (steps: CleaningStep[]) => {
        setPipeline([...steps]);
        setIsLoadTemplateOpen(false);
        toast({ title: "Template Applied", description: `Applied recipe successfully.`, variant: "success" });
    };

    const downloadCSV = () => {
        if (!data || data.length === 0) {
            toast({ title: "No Data", description: "Nothing to export.", variant: "destructive" });
            return;
        }

        // simple CSV conversion
        const headers = Object.keys(data[0]).join(",");
        const rows = data.map(row => Object.values(row).map(v => `"${String(v).replace(/"/g, '""')}"`).join(","));
        const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "cleaned_data_export.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleExport = () => {
        toast({
            title: "Export Started",
            description: "Generating CSV file...",
            variant: "default"
        });
        downloadCSV();
        toast({ title: "Export Complete", description: "Your file has been downloaded.", variant: "success" });
    };

    // Remove hardcoded handleApplyTemplate completely and rely on the new one above


    // Calculate Summary Metrics
    const stepsCount = pipeline.filter(p => p.active).length;
    // initialRows is already defined at the top
    const finalRows = pipeline.length > 0 ? pipeline[pipeline.length - 1].rowsAfter : initialRows;
    const removedRows = initialRows - finalRows;
    const integrityScore = Math.round((finalRows / initialRows) * 100);

    return (
        <div className="flex flex-col gap-6 h-full">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-xl font-bold tracking-tight">Advanced Data Cleaning</h3>
                    <p className="text-sm text-muted-foreground">Build a robust cleaning recipe</p>
                </div>
                <div className="flex gap-2">
                    <Dialog open={isLoadTemplateOpen} onOpenChange={setIsLoadTemplateOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                                <BookTemplate className="mr-2 h-4 w-4" /> Load Template
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                                <DialogTitle>Load Cleaning Template</DialogTitle>
                                <DialogDescription>Choose a pre-defined recipe to apply.</DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4 max-h-[300px] overflow-y-auto pr-1">
                                {savedTemplates.map((template, idx) => (
                                    <div key={idx} onClick={() => handleApplyTemplate(template.steps)} className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                                        <div className={`h-10 w-10 rounded-full flex items-center justify-center mr-4 text-white ${idx % 2 === 0 ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}`}>
                                            <Wand2 className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-sm">{template.name}</p>
                                            <p className="text-xs text-muted-foreground">{template.description}</p>
                                        </div>
                                        <ArrowRight className="ml-auto h-4 w-4 text-slate-400" />
                                    </div>
                                ))}
                                {savedTemplates.length === 0 && <div className="text-center text-sm text-gray-500 py-4">No saved templates yet.</div>}
                            </div>
                        </DialogContent>
                    </Dialog>
                    <Dialog open={isPreviewOpen} onOpenChange={(open: boolean) => setIsPreviewOpen(open)}>
                        <DialogTrigger>
                            <Button variant="secondary" size="sm">
                                <FileSpreadsheet className="mr-2 h-4 w-4" /> Preview Data
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl h-[80vh]">
                            <DialogHeader>
                                <DialogTitle>Data Preview (First 50 Rows)</DialogTitle>
                                <DialogDescription>Previewing data after {stepsCount} cleaning steps.</DialogDescription>
                            </DialogHeader>
                            <ScrollArea className="h-full border rounded-md">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 sticky top-0">
                                        <tr>{cols.slice(0, 6).map(c => <th key={c} className="px-4 py-3">{c}</th>)}</tr>
                                    </thead>
                                    <tbody>
                                        {previewRows.slice(0, 50).map((row: any, i: number) => (
                                            <tr key={i} className="border-b hover:bg-gray-50">
                                                {cols.slice(0, 6).map(c => <td key={c} className="px-4 py-2 text-gray-600 truncate max-w-[150px]">{String(row[c] ?? "")}</td>)}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </ScrollArea>
                        </DialogContent>
                    </Dialog>
                    <Button variant="outline" size="sm" onClick={handleExport}>
                        <Download className="mr-2 h-4 w-4" /> Export CSV
                    </Button>
                    <div className="border-l pl-2 flex gap-2">
                        <Dialog open={showSaveTemplate} onOpenChange={setShowSaveTemplate}>
                            <DialogTrigger asChild>
                                <Button size="sm">
                                    <Save className="mr-2 h-4 w-4" /> Save Recipe
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-md">
                                <DialogHeader>
                                    <DialogTitle>Save Cleaning Recipe</DialogTitle>
                                    <DialogDescription>Save this pipeline as a reusable template.</DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="space-y-3">
                                        <Label htmlFor="name" className="text-sm font-medium">Template Name</Label>
                                        <Input
                                            id="name"
                                            placeholder="e.g. Monthly Sales Clean v1"
                                            value={templateName}
                                            onChange={(e) => setTemplateName(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") {
                                                    e.preventDefault();
                                                    handleSaveTemplate();
                                                }
                                            }}
                                            className="h-10 border-slate-300 focus-visible:ring-blue-500"
                                            autoFocus
                                        />
                                        <p className="text-[10px] text-muted-foreground">This will save your current {pipeline.length} cleaning steps.</p>
                                    </div>
                                </div>
                                <div className="flex justify-end gap-2">
                                    <Button variant="outline" onClick={() => setShowSaveTemplate(false)}>Cancel</Button>
                                    <Button onClick={handleSaveTemplate}>Save Template</Button>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-12 h-full">

                {/* LEFT SIDEBAR: Operations Library */}
                <div className="md:col-span-4 space-y-6 flex flex-col h-full overflow-y-auto pr-2">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Operations</CardTitle>
                            <CardDescription>Select a transformation category</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Tabs defaultValue="column">
                                <TabsList className="grid w-full grid-cols-5 mb-4 px-1">
                                    <TabsTrigger value="column" title="Column Ops"><Type className="h-4 w-4" /></TabsTrigger>
                                    <TabsTrigger value="text" title="Text Ops"><Scissors className="h-4 w-4" /></TabsTrigger>
                                    <TabsTrigger value="merge" title="Merge/Split"><Split className="h-4 w-4" /></TabsTrigger>
                                    <TabsTrigger value="std" title="Standardize"><Replace className="h-4 w-4" /></TabsTrigger>
                                    <TabsTrigger value="filter" title="Filter"><Filter className="h-4 w-4" /></TabsTrigger>
                                </TabsList>

                                {/* TAB 1: Column & Type Operations */}
                                <TabsContent value="column" className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Target Column</Label>
                                        <Select>
                                            <SelectTrigger><SelectValue placeholder="Select Column..." /></SelectTrigger>
                                            <SelectContent>
                                                {cols.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
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
                                            <Button size="sm" variant="secondary" onClick={() => addStep("type", "Convert Type", "Selected Col")}>Apply</Button>
                                        </div>
                                    </div>
                                    <Button variant="outline" className="w-full justify-start text-xs" onClick={() => addStep("column", "Fill Nulls with 0", "Selected Col")}>
                                        <RotateCcw className="mr-2 h-3 w-3" /> Fill Missing (0)
                                    </Button>
                                    <Button variant="outline" className="w-full justify-start text-xs text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => addStep("column", "Drop Column", "Selected Col")}>
                                        <Eraser className="mr-2 h-3 w-3" /> Drop Column
                                    </Button>
                                </TabsContent>

                                {/* TAB 2: Text Cleaning */}
                                <TabsContent value="text" className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Target Column</Label>
                                        <Select>
                                            <SelectTrigger><SelectValue placeholder="Select Text Column..." /></SelectTrigger>
                                            <SelectContent>
                                                {cols.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <Button variant="outline" size="sm" onClick={() => addStep("text", "Trim Whitespace", "Selected Col")}>Trim</Button>
                                        <Button variant="outline" size="sm" onClick={() => addStep("text", "To Uppercase", "Selected Col")}>UPPER</Button>
                                        <Button variant="outline" size="sm" onClick={() => addStep("text", "To Lowercase", "Selected Col")}>lower</Button>
                                        <Button variant="outline" size="sm" onClick={() => addStep("text", "To Title Case", "Selected Col")}>Title</Button>
                                    </div>
                                    <Button variant="outline" size="sm" className="w-full" onClick={() => addStep("text", "Remove Special Chars", "Selected Col")}>Remove Special Chars</Button>
                                </TabsContent>

                                {/* TAB 3: Merge / Split */}
                                <TabsContent value="merge" className="space-y-6">
                                    {/* Split Section */}
                                    <div className="space-y-3 border-b pb-4">
                                        <Label className="flex items-center gap-2"><Split className="h-4 w-4" /> Split Column</Label>
                                        <Select onValueChange={setSplitCol}>
                                            <SelectTrigger><SelectValue placeholder="Column to Split..." /></SelectTrigger>
                                            <SelectContent>{cols.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                                        </Select>
                                        <div className="flex gap-2 items-center">
                                            <Input placeholder="Delimiter (e.g. ,)" className="w-24 h-9" value={splitDelimiter} onChange={e => setSplitDelimiter(e.target.value)} />
                                            <Button size="sm" variant="secondary" onClick={() => addStep("split", `Split by '${splitDelimiter}'`, splitCol || "Col")}>Split</Button>
                                        </div>
                                    </div>

                                    {/* Merge Section */}
                                    <div className="space-y-3">
                                        <Label className="flex items-center gap-2"><Merge className="h-4 w-4" /> Merge Columns</Label>
                                        <div className="grid grid-cols-2 gap-2">
                                            <Select onValueChange={setMergeCol1}>
                                                <SelectTrigger><SelectValue placeholder="Col 1" /></SelectTrigger>
                                                <SelectContent>{cols.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                                            </Select>
                                            <Select onValueChange={setMergeCol2}>
                                                <SelectTrigger><SelectValue placeholder="Col 2" /></SelectTrigger>
                                                <SelectContent>{cols.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                                            </Select>
                                        </div>
                                        <div className="flex gap-2 items-center">
                                            <Input placeholder="Separator (e.g. space)" className="w-full h-9" value={mergeSeparator} onChange={e => setMergeSeparator(e.target.value)} />
                                            <Button size="sm" variant="secondary" onClick={() => addStep("merge", `Merge with '${mergeSeparator}'`, `${mergeCol1}+${mergeCol2}`)}>Merge</Button>
                                        </div>
                                    </div>
                                </TabsContent>

                                {/* TAB 4: Standardize */}
                                <TabsContent value="std" className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Standardize Values</Label>
                                        <Select onValueChange={(val) => {
                                            setStdCol(val);
                                            // Mock scanning for values
                                            setMockMappings([
                                                { from: "Delhi", to: "New Delhi" },
                                                { from: "New Delhi", to: "New Delhi" },
                                                { from: "BLR", to: "Bangalore" },
                                                { from: "Bangalore", to: "Bangalore" },
                                            ]);
                                        }}>
                                            <SelectTrigger><SelectValue placeholder="Select Column to Scan..." /></SelectTrigger>
                                            <SelectContent>{cols.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                                        </Select>
                                    </div>

                                    {stdCol && (
                                        <div className="space-y-2 animate-in fade-in">
                                            <div className="text-xs text-muted-foreground flex justify-between">
                                                <span>Detected Variants</span>
                                                <span className="text-blue-600 cursor-pointer hover:underline" onClick={() => toast({ title: "Auto-Matched", description: "AI found 2 corrections", variant: "success" })}>Auto-Match</span>
                                            </div>
                                            <div className="border rounded-md overflow-hidden text-xs">
                                                <div className="bg-gray-50 flex font-medium p-2 border-b">
                                                    <div className="w-1/2">Original</div>
                                                    <div className="w-1/2">Map To</div>
                                                </div>
                                                <div className="max-h-[150px] overflow-y-auto">
                                                    {mockMappings.map((m, i) => (
                                                        <div key={i} className="flex p-2 border-b last:border-0 items-center">
                                                            <div className="w-1/2 truncate pr-2">{m.from}</div>
                                                            <div className="w-1/2 bg-blue-50 text-blue-700 px-1 rounded flex items-center justify-between group cursor-pointer">
                                                                {m.to}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                            <Button className="w-full" size="sm" onClick={() => addStep("std", "Standardize Values", stdCol)}>Apply Mapping</Button>
                                        </div>
                                    )}
                                </TabsContent>

                                {/* TAB 5: Filters & Rules */}
                                <TabsContent value="filter" className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Filter Rules</Label>
                                        <Button variant="outline" className="w-full justify-start text-xs" onClick={() => addStep("filter", "Remove rows where Value < 0")}>
                                            <Eraser className="mr-2 h-3 w-3" /> Remove Negatives
                                        </Button>
                                        <Button variant="outline" className="w-full justify-start text-xs" onClick={() => addStep("filter", "Remove future dates")}>
                                            <Eraser className="mr-2 h-3 w-3" /> Remove Future Dates
                                        </Button>
                                        <Button variant="outline" className="w-full justify-start text-xs" onClick={() => addStep("filter", "Remove duplicates")}>
                                            <Eraser className="mr-2 h-3 w-3" /> Remove Duplicates
                                        </Button>
                                    </div>
                                    <div className="pt-4 border-t">
                                        <Label className="mb-2 block">Outliers</Label>
                                        <Button variant="outline" className="w-full justify-start text-xs mb-2" onClick={() => addStep("outlier", "Remove Outliers (IQR)")}>
                                            <Scissors className="mr-2 h-3 w-3" /> Remove Outliers (IQR)
                                        </Button>
                                        <Button variant="outline" className="w-full justify-start text-xs" onClick={() => addStep("outlier", "Cap Outliers (Winsorize)")}>
                                            <RotateCcw className="mr-2 h-3 w-3" /> Cap at 1st/99th Percentile
                                        </Button>
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </CardContent>
                    </Card>

                    {/* AI Suggestions Panel */}
                    <Card className="bg-gradient-to-br from-indigo-50 to-white border-indigo-100 mt-auto">
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center text-indigo-700 text-sm">
                                <Wand2 className="mr-2 h-4 w-4" /> Smart Suggestions
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="p-3 bg-white rounded-md border border-indigo-100 shadow-sm cursor-pointer hover:border-indigo-300 transition-colors" onClick={() => addStep("text", "Fix Inconsistent Casing", "City")}>
                                <div className="flex justify-between items-start">
                                    <span className="text-xs font-medium text-indigo-900">Inconsistent Casing</span>
                                    <Badge variant="secondary" className="text-[10px] bg-indigo-100 text-indigo-700">High</Badge>
                                </div>
                                <p className="text-[10px] text-muted-foreground mt-1">Mixed case values detected in 'City'. Apply Title Case?</p>
                            </div>
                            <div className="p-3 bg-white rounded-md border border-indigo-100 shadow-sm cursor-pointer hover:border-indigo-300 transition-colors" onClick={() => addStep("type", "Convert to Date", "Order Date")}>
                                <div className="flex justify-between items-start">
                                    <span className="text-xs font-medium text-indigo-900">Wrong Data Type</span>
                                    <Badge variant="secondary" className="text-[10px] bg-indigo-100 text-indigo-700">Med</Badge>
                                </div>
                                <p className="text-[10px] text-muted-foreground mt-1">'Order Date' is Text. Convert to Date?</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* RIGHT MAIN: Pipeline Canvas */}
                <div className="md:col-span-8 flex flex-col h-full overflow-hidden">
                    {/* Metrics Dashboard */}
                    <div className="grid grid-cols-4 gap-4 mb-4">
                        <Card className="bg-slate-50 border-slate-200 shadow-sm">
                            <CardContent className="p-4 flex items-center justify-between">
                                <div>
                                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Initial</div>
                                    <div className="text-xl font-bold text-slate-900">{initialRows.toLocaleString()}</div>
                                </div>
                                <Activity className="h-4 w-4 text-slate-400" />
                            </CardContent>
                        </Card>
                        <Card className="bg-slate-50 border-slate-200 shadow-sm">
                            <CardContent className="p-4 flex items-center justify-between">
                                <div>
                                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Dropped</div>
                                    <div className="text-xl font-bold text-red-600">-{removedRows.toLocaleString()}</div>
                                </div>
                                <Trash2 className="h-4 w-4 text-red-400" />
                            </CardContent>
                        </Card>
                        <Card className="bg-slate-50 border-slate-200 shadow-sm">
                            <CardContent className="p-4 flex items-center justify-between">
                                <div>
                                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Steps</div>
                                    <div className="text-xl font-bold text-blue-600">{stepsCount}</div>
                                </div>
                                <Filter className="h-4 w-4 text-blue-400" />
                            </CardContent>
                        </Card>
                        <Card className="bg-slate-50 border-slate-200 shadow-sm">
                            <CardContent className="p-4 flex items-center justify-between">
                                <div>
                                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Integrity</div>
                                    <div className="text-xl font-bold text-green-600">{integrityScore}%</div>
                                </div>
                                <CheckCircle2 className="h-4 w-4 text-green-400" />
                            </CardContent>
                        </Card>
                    </div>

                    {/* Pipeline */}
                    <Card className="flex-1 flex flex-col">
                        <CardHeader className="pb-4 py-3 border-b bg-gray-50/50">
                            <div className="flex justify-between items-center">
                                <div>
                                    <CardTitle className="text-lg">Cleaning Recipe</CardTitle>
                                    <CardDescription className="text-xs">Drag steps to reorder logic</CardDescription>
                                </div>
                                <Badge variant="outline" className="text-xs font-normal">Auto-saving...</Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-y-auto bg-slate-50/50 p-6">
                            <div className="flex flex-col items-center gap-4 min-h-full">

                                {/* Input Node */}
                                <div className="bg-white p-4 rounded shadow-sm border w-full max-w-2xl flex items-center gap-4">
                                    <div className="h-10 w-10 bg-blue-100 rounded flex items-center justify-center text-blue-600 font-bold shrink-0">CSV</div>
                                    <div>
                                        <div className="text-xs text-muted-foreground uppercase font-bold">Source</div>
                                        <div className="font-medium">Raw Dataset</div>
                                    </div>
                                    <div className="ml-auto text-sm text-muted-foreground bg-slate-100 px-2 py-1 rounded">{initialRows.toLocaleString()} rows</div>
                                </div>

                                {/* Flow Line */}
                                <div className="h-6 w-0.5 bg-slate-300 shrink-0"></div>

                                {/* Reorderable List */}
                                <div className="w-full max-w-2xl">
                                    <Reorder.Group axis="y" values={pipeline} onReorder={setPipeline}>
                                        {pipeline.map((step, index) => (
                                            <DraggableStep
                                                key={step.id}
                                                step={step}
                                                index={index}
                                                toggleStep={toggleStep}
                                                removeStep={removeStep}
                                            />
                                        ))}
                                    </Reorder.Group>
                                </div>

                                {/* Output Node */}
                                <div className="bg-green-50 p-4 rounded shadow-sm border border-green-200 w-full max-w-2xl flex items-center gap-4 opacity-100 mt-2">
                                    <div className="h-10 w-10 bg-green-100 rounded flex items-center justify-center text-green-700 font-bold shrink-0">
                                        <CheckCircle2 className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <div className="text-xs text-green-700 uppercase font-bold">Final Output</div>
                                        <div className="font-medium text-green-900">Ready for Analysis</div>
                                    </div>
                                    <div className="ml-auto text-sm font-bold text-green-700 bg-green-100 px-3 py-1 rounded">
                                        {pipeline.length > 0 ? pipeline[pipeline.length - 1].rowsAfter.toLocaleString() : initialRows.toLocaleString()} rows
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
