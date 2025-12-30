"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ArrowLeft, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { projectService } from "@/services/project";

const formSchema = z.object({
    name: z.string().min(2, {
        message: "Analysis name must be at least 2 characters.",
    }),
    description: z.string().optional(),
});

export default function NewAnalysisPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            description: "",
        },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsLoading(true);
        try {
            const newProject = await projectService.create(values);
            toast({
                title: "Analysis created",
                description: `Analysis "${newProject.name}" has been created successfully.`,
            });
            // Redirect to the new analysis dashboard
            router.push(`/analysis/${newProject.id}`);
        } catch (error) {
            console.error("Failed to create analysis:", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to create analysis. Please try again.",
            });
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6" suppressHydrationWarning>
            <div className="flex items-center space-x-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Create New Analysis</h1>
                    <p className="text-muted-foreground">
                        Start a new data analysis project to explore and visualize your data.
                    </p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Analysis Details</CardTitle>
                    <CardDescription>
                        Enter a name for your analysis workspace.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. Sales Analysis Q4" {...field} />
                                        </FormControl>
                                        <FormDescription>
                                            A descriptive name for your analysis.
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Description</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="What are the goals of this analysis?"
                                                className="resize-none"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            Optional context or notes.
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div className="flex justify-end space-x-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => router.back()}
                                    disabled={isLoading}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={isLoading}>
                                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Create Analysis
                                </Button>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}
