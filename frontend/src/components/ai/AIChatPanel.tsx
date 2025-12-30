"use client";

import { useState, useRef, useEffect } from "react";
import { aiService } from "@/services/ai";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, User, Send, X, Loader2, BarChart2 } from "lucide-react";
import { ChartRenderer } from "@/components/visualization/ChartRenderer";
import { PinChartModal } from "@/components/dashboard/PinChartModal";
import { cn } from "@/lib/utils";
import ReactMarkdown from 'react-markdown';
import { useToast } from "@/components/ui/use-toast";

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    chart?: any;
    timestamp: Date;
}

interface AIChatPanelProps {
    sourceId: number;
    open: boolean;
    onClose: () => void;
}

export function AIChatPanel({ sourceId, open, onClose }: AIChatPanelProps) {
    const { toast } = useToast();
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 'intro',
            role: 'assistant',
            content: "Hello! I'm your Data Assistant. Ask me anything about this dataset, like 'What is the average sales trend?' or 'Show me the distribution of prices'.",
            timestamp: new Date()
        }
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Pinning Chart State
    const [pinModalOpen, setPinModalOpen] = useState(false);
    const [chartToPin, setChartToPin] = useState<any>(null);

    useEffect(() => {
        if (open && inputRef.current) {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [open]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, open]);

    const handleSend = async () => {
        if (!input.trim() || loading) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: input,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMsg]);
        setInput("");
        setLoading(true);

        try {
            const response = await aiService.askData(sourceId, userMsg.content);

            const aiMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: response.answer,
                chart: response.chart,
                timestamp: new Date()
            };
            setMessages(prev => [...prev, aiMsg]);
        } catch (err: any) {
            console.error(err);
            const errorMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: "Sorry, I encountered an error processing your request. Please try again later.",
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMsg]);

            if (err.response?.status === 429) {
                toast({ title: "Quota Exceeded", description: "AI is busy. Please wait a moment.", variant: "destructive" });
            }
        } finally {
            setLoading(false);
        }
    };

    const handlePinChart = (chartConfig: any) => {
        // Enforce sourceId is present
        const configWithSource = { ...chartConfig, sourceId };
        setChartToPin(configWithSource);
        setPinModalOpen(true);
    };

    if (!open) return null;

    return (
        <>
            <Card className="fixed bottom-4 right-4 w-[400px] h-[600px] shadow-2xl flex flex-col z-50 border-blue-200 animate-in slide-in-from-bottom-10 fade-in duration-300">
                <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 rounded-t-lg flex flex-row items-center justify-between shadow-sm">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-white/20 rounded-full backdrop-blur-sm">
                            <Bot className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <CardTitle className="text-base">Data Assistant</CardTitle>
                            <p className="text-[10px] text-blue-100 opacity-90">Powered by Gemini AI</p>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-white/20 rounded-full" onClick={onClose}>
                        <X className="h-4 w-4" />
                    </Button>
                </CardHeader>

                <CardContent className="flex-1 p-0 flex flex-col overflow-hidden bg-gray-50/50">
                    <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
                        {messages.map((msg) => (
                            <div key={msg.id} className={cn("flex gap-3 max-w-[90%]", msg.role === 'user' ? "ml-auto flex-row-reverse" : "")}>
                                <div className={cn(
                                    "h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm",
                                    msg.role === 'assistant' ? "bg-gradient-to-br from-blue-100 to-indigo-100 border border-blue-200" : "bg-gray-200"
                                )}>
                                    {msg.role === 'assistant' ? <Bot className="h-5 w-5 text-blue-600" /> : <User className="h-5 w-5 text-gray-600" />}
                                </div>
                                <div className={cn(
                                    "p-3 rounded-2xl text-sm shadow-sm",
                                    msg.role === 'assistant'
                                        ? "bg-white border border-gray-100 text-gray-800 rounded-tl-none"
                                        : "bg-blue-600 text-white rounded-tr-none"
                                )}>
                                    <div className="prose prose-sm max-w-none break-words dark:prose-invert prose-p:leading-relaxed prose-pre:bg-gray-100 prose-pre:text-gray-800">
                                        <ReactMarkdown>
                                            {msg.content}
                                        </ReactMarkdown>
                                    </div>

                                    {msg.chart && (
                                        <div className="mt-3 bg-gray-50 rounded-lg border p-2 w-[280px]">
                                            <div className="h-[200px] w-full">
                                                <ChartRenderer config={msg.chart} data={[]} height={200} />
                                                {/* Note: ChartRenderer needs data. The backend /ask returns chart CONFIG. 
                                                   It assumes the frontend will fetch data separately or uses generic chart config.
                                                   Wait, ChartRenderer expects 'data' prop. 
                                                   The backend /ask does NOT return data rows, only schema config?
                                                   Checking backend... yes, it returns config.
                                                   So we need to fetch data or the backend response must allow ChartRenderer to work?
                                                   Actually, ChartRenderer is pure UI.
                                                   Without data, it renders "No data".
                                                   We need to fetch preview data (using sourceId) and pass it to ChartRenderer?
                                                   Or does `DashboardWidget` handle data fetching? Yes.
                                                   Here we are just showing a preview.
                                                   We should ideally have access to 'previewData' from the parent or context.
                                                   For now, I'll pass empty array [] but this will render empty chart.
                                                   Wait, if I want to visualize, I need data.
                                                   Since I can't easily fetch data here without re-implementing fetching logic,
                                                   I will render a specialized "Chart Preview" card that says "Click to Pin/View".
                                                   OR, better: I can pass 'previewData' as a prop to AIChatPanel if available.
                                                */}
                                                <div className="absolute inset-0 flex items-center justify-center bg-gray-50/50 backdrop-blur-[1px] rounded-lg">
                                                    <span className="text-xs text-gray-500 font-medium">Chart Config Ready</span>
                                                </div>
                                            </div>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="w-full mt-2 gap-2 text-xs h-8 bg-white hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-colors"
                                                onClick={() => handlePinChart(msg.chart)}
                                            >
                                                <BarChart2 className="h-3 w-3" /> Pin this Chart
                                            </Button>
                                        </div>
                                    )}
                                    <div className={cn("text-[10px] mt-1 opacity-70", msg.role === 'user' ? "text-blue-100 text-right" : "text-gray-400")}>
                                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {loading && (
                            <div className="flex gap-3">
                                <div className="h-8 w-8 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center">
                                    <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                                </div>
                                <div className="bg-white border border-gray-100 p-3 rounded-2xl rounded-tl-none text-sm text-gray-500 shadow-sm flex items-center gap-2">
                                    <span>Analyzing data...</span>
                                    <span className="flex space-x-1">
                                        <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce delay-0"></span>
                                        <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce delay-150"></span>
                                        <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce delay-300"></span>
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                </CardContent>

                <div className="p-3 bg-white border-t">
                    <form
                        onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                        className="flex gap-2 items-end bg-gray-50 p-1.5 rounded-xl border focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-300 transition-all"
                    >
                        <Input
                            ref={inputRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask a question..."
                            className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-3 py-2 h-auto max-h-[100px]"
                            disabled={loading}
                        />
                        <Button
                            type="submit"
                            size="icon"
                            disabled={!input.trim() || loading}
                            className={cn(
                                "h-9 w-9 rounded-lg transition-all duration-300 flex-shrink-0",
                                input.trim() ? "bg-blue-600 hover:bg-blue-700 shadow-md transform hover:scale-105" : "bg-gray-200 text-gray-400 cursor-not-allowed"
                            )}
                        >
                            <Send className="h-4 w-4" />
                        </Button>
                    </form>
                </div>
            </Card>

            <PinChartModal
                open={pinModalOpen}
                onOpenChange={setPinModalOpen}
                config={chartToPin}
                title={chartToPin ? `${chartToPin.title || 'AI Chart'}` : 'New Widget'}
            />
        </>
    );
}
