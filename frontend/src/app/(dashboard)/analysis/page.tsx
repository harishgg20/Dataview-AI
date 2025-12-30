"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { projectService, Project } from "@/services/project";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Plus, Folder } from "lucide-react";
import { Input } from "@/components/ui/input";

import { Label } from "@/components/ui/label";
import { MagicCard } from "@/components/magicui/magic-card";

export default function ProjectsPage() {
    const router = useRouter();
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [newProjectName, setNewProjectName] = useState("");

    useEffect(() => {
        console.log("Loading projects...");
        loadProjects();
    }, []);

    const loadProjects = async () => {
        setError(null);
        // Safety timeout
        const timeout = setTimeout(() => {
            console.warn("Projects load timed out");
            setLoading(false);
            setError("Request timed out. Please check backend.");
        }, 5000);

        try {
            console.log("Fetching projects API...");
            const data = await projectService.getAll();
            console.log("Projects fetched:", data);
            setProjects(data);
        } catch (error: any) {
            console.error("Failed to load projects", error);
            setError(error.message || "Failed to load projects");
        } finally {
            clearTimeout(timeout);
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!newProjectName.trim()) return;
        try {
            await projectService.create({ name: newProjectName });
            setNewProjectName("");
            setIsCreating(false);
            loadProjects();
        } catch (error) {
            console.error("Failed to create project", error);
            alert("Failed to create project");
        }
    };

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">My Analyses</h1>
                <Button onClick={() => router.push("/analysis/new")}>
                    <Plus className="mr-2 h-4 w-4" /> New Analysis
                </Button>
            </div>

            {error && (
                <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-md">
                    Error loading projects: {error}
                </div>
            )}



            {loading ? (
                <div>Loading...</div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {projects.map((project) => (
                        <MagicCard
                            key={project.id}
                            className="cursor-pointer flex flex-col justify-between"
                            gradientColor="#D9D9D955"
                            onClick={() => router.push(`/analysis/${project.id}`)}
                        >
                            <CardHeader className="flex flex-row items-center gap-4 pb-2">
                                <div className="p-2 bg-blue-100 rounded-lg">
                                    <Folder className="h-6 w-6 text-blue-600" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg">{project.name}</CardTitle>
                                    <CardDescription>Last updated {new Date(project.created_at).toLocaleDateString()}</CardDescription>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-sm text-muted-foreground">
                                    {project.description || "No description"}
                                </div>
                            </CardContent>
                            <CardFooter className="flex justify-between">
                                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                                    {project.status}
                                </span>
                                <Button variant="ghost" size="sm">Open</Button>
                            </CardFooter>
                        </MagicCard>
                    ))}

                    {projects.length === 0 && !isCreating && (
                        <div className="col-span-full text-center py-12 text-muted-foreground">
                            No analyses found. Create one to get started.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
