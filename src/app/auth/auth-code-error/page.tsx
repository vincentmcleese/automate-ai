import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AuthCodeError() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Authentication Error</CardTitle>
          <CardDescription>
            Sorry, we couldn&apos;t complete your sign-in process.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground text-center">
            <p>This could happen for several reasons:</p>
            <ul className="mt-2 space-y-1 text-left">
              <li>• The authentication session expired</li>
              <li>• You cancelled the sign-in process</li>
              <li>• There was a temporary server issue</li>
            </ul>
          </div>
          <div className="flex flex-col space-y-2">
            <Button asChild>
              <Link href="/login">Try Again</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/">Go Home</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
