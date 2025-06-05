import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-4xl mx-auto text-center space-y-8">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
            Welcome to <span className="text-primary">AutomateAI</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Streamline your workflow with AI-powered automation tools. Get
            started today and transform how you work.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild size="lg">
            <Link href="/register">Get Started</Link>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link href="/login">Sign In</Link>
          </Button>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mt-16">
          <Card>
            <CardHeader>
              <CardTitle>🚀 Fast Setup</CardTitle>
              <CardDescription>
                Get up and running in minutes with our streamlined onboarding
                process.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>🔒 Secure</CardTitle>
              <CardDescription>
                Your data is protected with enterprise-grade security and Google
                OAuth.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>⚡ Powerful</CardTitle>
              <CardDescription>
                Leverage AI to automate complex workflows and boost
                productivity.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        <div className="mt-16 p-8 bg-muted rounded-lg">
          <h2 className="text-2xl font-semibold mb-4">Ready to get started?</h2>
          <p className="text-muted-foreground mb-6">
            Join thousands of users who are already automating their workflows
            with AutomateAI.
          </p>
          <Button asChild size="lg">
            <Link href="/dashboard">Go to Dashboard</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
