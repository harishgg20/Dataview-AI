import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { ArrowRight, BarChart3, Shield, Zap } from "lucide-react";
import { Meteors } from "@/components/magicui/meteors";
import { MagicCard } from "@/components/magicui/magic-card";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="px-4 lg:px-6 h-14 flex items-center border-b">
        <Link className="flex items-center justify-center font-bold text-xl text-blue-600" href="#">
          <BarChart3 className="h-6 w-6 mr-2" />
          Analytics Platform
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Link className="text-sm font-medium hover:underline underline-offset-4" href="/login">
            Login
          </Link>
          <Link className="text-sm font-medium hover:underline underline-offset-4" href="/signup">
            Sign Up
          </Link>
        </nav>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-gray-900 relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <Meteors number={30} />
          </div>
          <div className="container px-4 md:px-6 mx-auto relative z-10">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none text-white bg-clip-text text-transparent bg-gradient-to-b from-neutral-200 to-neutral-600 dark:from-neutral-200 dark:to-neutral-600">
                  Enterprise Analytics for Modern Teams
                </h1>
                <p className="mx-auto max-w-[700px] text-gray-400 md:text-xl">
                  Connect your data, run complex queries with DuckDB, and get AI-powered insights in seconds.
                </p>
              </div>
              <div className="space-x-4">
                <Link href="/login" className={buttonVariants({ size: "lg", className: "gap-2 bg-blue-600 hover:bg-blue-700 text-white" })}>
                  Get Started <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/about" className={buttonVariants({ variant: "outline", size: "lg", className: "text-white border-gray-700 hover:bg-gray-800" })}>
                  Learn More
                </Link>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full py-12 md:py-24 lg:py-32 bg-white">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
              <MagicCard className="flex flex-col items-center space-y-2 p-6 shadow-none" gradientColor="#D9D9D955">
                <div className="p-2 bg-blue-100 rounded-full mb-2">
                  <Zap className="h-6 w-6 text-blue-600" />
                </div>
                <h2 className="text-xl font-bold">Fast Execution</h2>
                <p className="text-gray-500 text-center text-sm">
                  Powered by DuckDB and Pandas for rapid in-memory processing.
                </p>
              </MagicCard>
              <MagicCard className="flex flex-col items-center space-y-2 p-6 shadow-none" gradientColor="#D9D9D955">
                <div className="p-2 bg-green-100 rounded-full mb-2">
                  <Shield className="h-6 w-6 text-green-600" />
                </div>
                <h2 className="text-xl font-bold">Secure & Private</h2>
                <p className="text-gray-500 text-center text-sm">
                  Your data stays with you. Enterprise-grade security built-in.
                </p>
              </MagicCard>
              <MagicCard className="flex flex-col items-center space-y-2 p-6 shadow-none" gradientColor="#D9D9D955">
                <div className="p-2 bg-purple-100 rounded-full mb-2">
                  <BarChart3 className="h-6 w-6 text-purple-600" />
                </div>
                <h2 className="text-xl font-bold">Advanced EDA</h2>
                <p className="text-gray-500 text-center text-sm">
                  Visual exploratory data analysis and AI insights generation.
                </p>
              </MagicCard>
            </div>
          </div>
        </section>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t bg-slate-900 text-slate-200">
        <p className="text-xs">© 2025 Analytics Platform. All rights reserved.</p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link className="text-xs hover:underline underline-offset-4 hover:text-white transition-colors" href="/legal/terms">
            Terms of Service
          </Link>
          <Link className="text-xs hover:underline underline-offset-4 hover:text-white transition-colors" href="/legal/privacy">
            Privacy
          </Link>
          <Link className="text-xs hover:underline underline-offset-4 hover:text-white transition-colors" href="/legal/cookies">
            Cookies
          </Link>
        </nav>
      </footer>
    </div>
  );
}
