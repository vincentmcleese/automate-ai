"use client";

import { useAuth } from "@/lib/auth/context";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function DashboardPage() {
  const { user, loading, signOut } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You need to be signed in to access this page.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage
                    src={
                      user.user_metadata?.avatar_url ||
                      user.user_metadata?.picture
                    }
                    alt={
                      user.user_metadata?.full_name ||
                      user.user_metadata?.name ||
                      "User"
                    }
                  />
                  <AvatarFallback>
                    {(
                      user.user_metadata?.full_name ||
                      user.user_metadata?.name ||
                      user.email ||
                      "U"
                    )
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="text-2xl">Welcome back!</h1>
                  <p className="text-muted-foreground">
                    {user.user_metadata?.full_name ||
                      user.user_metadata?.name ||
                      user.email}
                  </p>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium">Account Information</h3>
                  <div className="mt-2 space-y-2 text-sm">
                    <p>
                      <span className="font-medium">Email:</span> {user.email}
                    </p>
                    <p>
                      <span className="font-medium">Provider:</span> Google
                    </p>
                    <p>
                      <span className="font-medium">Member since:</span>{" "}
                      {new Date(user.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="pt-4">
                  <Button onClick={signOut} variant="outline">
                    Sign Out
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Dashboard</CardTitle>
              <CardDescription>
                This is a protected page that requires authentication.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                You can now build your application features here. This page is
                protected by middleware and will redirect unauthenticated users
                to the login page.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
