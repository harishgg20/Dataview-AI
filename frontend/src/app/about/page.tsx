
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BarChart3, Database, Cpu, Lock } from "lucide-react";

export default function AboutPage() {
    return (
        <div className="flex flex-col min-h-screen">
            <header className="px-4 lg:px-6 h-14 flex items-center border-b">
                <Link className="flex items-center justify-center font-bold text-xl text-blue-600" href="/">
                    <BarChart3 className="h-6 w-6 mr-2" />
                    Dataview AI
                </Link>
                <nav className="ml-auto flex gap-4 sm:gap-6">
                    <Link className="text-sm font-medium hover:underline underline-offset-4" href="/">
                        Home
                    </Link>
                    <Link className="text-sm font-medium hover:underline underline-offset-4" href="/login">
                        Login
                    </Link>
                    <Link className="text-sm font-medium hover:underline underline-offset-4" href="/signup">
                        Sign Up
                    </Link>
                </nav>
            </header>
            <main className="flex-1">
                <section className="w-full py-12 md:py-24 lg:py-32 bg-gray-50">
                    <div className="container px-4 md:px-6 mx-auto">
                        <div className="flex flex-col items-center space-y-4 text-center">
                            <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl">
                                About Our Platform
                            </h1>
                            <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400">
                                Built for modern data teams who need speed, security, and smart insights.
                            </p>
                        </div>
                    </div>
                </section>

                <section className="w-full py-12 md:py-24 lg:py-32 bg-white">
                    <div className="container px-4 md:px-6 mx-auto grid gap-12 lg:grid-cols-2 lg:gap-16 items-start">
                        <div className="space-y-4">
                            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">
                                Why we built this?
                            </h2>
                            <p className="text-gray-500 md:text-lg">
                                Traditional BI tools are clunky, expensive, and slow. We wanted to create a lightweight, high-performance analytics workspace that brings the power of Python and SQL directly to your browser without the complexity.
                            </p>
                            <div className="grid gap-6 mt-8">
                                <div className="flex items-start space-x-3">
                                    <Database className="h-6 w-6 text-blue-600 mt-1" />
                                    <div>
                                        <h3 className="font-bold">DuckDB Power</h3>
                                        <p className="text-sm text-gray-500">In-memory analytical database engine for sub-second queries on large datasets.</p>
                                    </div>
                                </div>
                                <div className="flex items-start space-x-3">
                                    <Cpu className="h-6 w-6 text-purple-600 mt-1" />
                                    <div>
                                        <h3 className="font-bold">AI Integration</h3>
                                        <p className="text-sm text-gray-500">Automated insights and data cleaning suggestions powered by advanced LLMs.</p>
                                    </div>
                                </div>
                                <div className="flex items-start space-x-3">
                                    <Lock className="h-6 w-6 text-green-600 mt-1" />
                                    <div>
                                        <h3 className="font-bold">Secure by Design</h3>
                                        <p className="text-sm text-gray-500">Role-based access control and encrypted token handling keep your data safe.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gray-100 rounded-xl p-8 border flex flex-col justify-center items-center text-center space-y-6">
                            <h3 className="text-2xl font-bold">Ready to explore?</h3>
                            <p className="text-gray-600">
                                Join thousands of data analysts using our platform to perform advanced EDA and visualization.
                            </p>
                            <div className="flex gap-4">
                                <Link href="/signup">
                                    <Button size="lg" className="w-full sm:w-auto">Create Free Account</Button>
                                </Link>
                                <Link href="/">
                                    <Button variant="outline" size="lg" className="w-full sm:w-auto">
                                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
                                    </Button>
                                </Link>
                            </div>
                        </div>

                    </div>
                </section>
            </main>
            <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
                <p className="text-xs text-gray-500 dark:text-gray-400">© 2025 Dataview AI. All rights reserved.</p>
                <nav className="sm:ml-auto flex gap-4 sm:gap-6">
                    <Link className="text-xs hover:underline underline-offset-4" href="#">
                        Terms of Service
                    </Link>
                    <Link className="text-xs hover:underline underline-offset-4" href="#">
                        Privacy
                    </Link>
                </nav>
            </footer>
        </div>
    );
}
