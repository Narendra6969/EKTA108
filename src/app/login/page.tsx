
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { HeartPulse, LogIn } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useFirebaseAuth, useFirebaseDb } from "@/lib/firebase";

// Mapping roles to their primary dashboard URLs
const roleDashboardMap: { [key: string]: string } = {
  patient: '/dashboard/user',
  paramedic: '/dashboard/ambulance',
  doctor: '/dashboard/hospital', // Doctors now go to hospital management
  hospital_admin: '/dashboard/hospital',
  admin: '/dashboard/hospital', // Admins can default to hospital view
};


export default function LoginPage() {
  const { toast } = useToast();
  const router = useRouter();
  const auth = useFirebaseAuth();
  const db = useFirebaseDb();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Fetch user's role from Firestore to redirect them correctly
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);

      let redirectUrl = '/dashboard/user'; // Default redirect
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const userRole = userData.role;
        redirectUrl = roleDashboardMap[userRole] || redirectUrl;
      }
      
      toast({
        title: "Login Successful",
        description: "Welcome back! Redirecting you to your dashboard.",
      });

      router.push(redirectUrl);

    } catch (error: any) {
      console.error("Firebase login error: ", error);
      let errorMessage = "An unknown error occurred. Please check your credentials and try again.";
      switch (error.code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
          errorMessage = "Invalid email or password. Please try again.";
          break;
        case 'auth/invalid-email':
          errorMessage = "The email address you entered is not valid.";
          break;
        case 'auth/too-many-requests':
          errorMessage = "Too many login attempts. Please try again later.";
          break;
        case 'auth/configuration-not-found':
          errorMessage = "Firebase configuration is missing or invalid. Please contact support.";
          break;
        default:
          errorMessage = `Login failed: ${error.message}.`;
          break;
      }
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
           <Link href="/" className="mx-auto flex items-center justify-center">
            <HeartPulse className="h-10 w-10 text-primary" />
          </Link>
          <CardTitle className="mt-4 text-2xl font-bold">Welcome Back</CardTitle>
          <CardDescription>
            Log in to access your AcciAssist portal.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="jane.doe@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                type="password" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Logging In..." : <><LogIn className="mr-2 h-4 w-4" />Log In</>}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            Don't have an account?{" "}
            <Link href="/signup" className="underline hover:text-primary">
              Sign up
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

    