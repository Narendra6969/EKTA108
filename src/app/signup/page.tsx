
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { HeartPulse, UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { useFirebaseAuth, useFirebaseDb } from "@/lib/firebase";

// Mapping roles to their primary dashboard URLs
const roleDashboardMap: { [key: string]: string } = {
  patient: '/dashboard/user',
  paramedic: '/dashboard/ambulance',
  doctor: '/dashboard/hospital', // Doctors now go to hospital management
  hospital_admin: '/dashboard/hospital',
  admin: '/dashboard/hospital', // Admins can default to hospital view
};


export default function SignupPage() {
  const { toast } = useToast();
  const router = useRouter();
  const auth = useFirebaseAuth(); // Use the hook to get auth instance
  const db = useFirebaseDb(); // Use the hook to get db instance

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (password.length < 6) {
        toast({
            variant: "destructive",
            title: "Password Too Short",
            description: "Please choose a password with at least 6 characters.",
        });
        setIsLoading(false);
        return;
    }
     if (!role) {
        toast({
            variant: "destructive",
            title: "Role Not Selected",
            description: "Please select a role to continue.",
        });
        setIsLoading(false);
        return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Update the user's profile with their full name
      await updateProfile(user, { displayName: fullName });
      
      // Store additional user information (like the role) in Firestore
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        fullName: fullName,
        email: user.email,
        role: role,
        createdAt: new Date(),
      });

      toast({
        title: "Account Created Successfully",
        description: "Welcome to AcciAssist! Redirecting you to your dashboard.",
      });

      // Redirect to role-specific dashboard
      const redirectUrl = roleDashboardMap[role] || '/dashboard/user';
      router.push(redirectUrl);

    } catch (error: any) {
      console.error("Firebase signup error: ", error);
      let errorMessage = "An unknown error occurred. Please try again.";
       // Handle specific Firebase auth errors
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = "This email address is already registered. Please log in instead.";
          break;
        case 'auth/invalid-email':
          errorMessage = "The email address you entered is not valid.";
          break;
        case 'auth/weak-password':
          errorMessage = "The password is too weak. Please choose a stronger password.";
          break;
        case 'auth/configuration-not-found':
           errorMessage = "Firebase configuration is missing or invalid. Please contact support.";
          break;
        default:
          errorMessage = `Signup failed: ${error.message}.`;
          break;
      }
      toast({
        variant: "destructive",
        title: "Signup Failed",
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
          <CardTitle className="mt-4 text-2xl font-bold">Create an Account</CardTitle>
          <CardDescription>
            Join AcciAssist to help save lives and improve emergency response.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
             <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="Jane Doe"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={isLoading}
              />
            </div>
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
              <Label htmlFor="password">Password (min. 6 characters)</Label>
              <Input 
                id="password" 
                type="password" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
                <Label htmlFor="role">What is your role? *</Label>
                <Select value={role} onValueChange={setRole} required disabled={isLoading}>
                <SelectTrigger id="role">
                    <SelectValue placeholder="Select a role..." />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="patient">Patient / General User</SelectItem>
                    <SelectItem value="paramedic">Paramedic / Ambulance Staff</SelectItem>
                    <SelectItem value="hospital_admin">Hospital Administrator / Staff</SelectItem>
                </SelectContent>
                </Select>
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Creating Account..." : <><UserPlus className="mr-2 h-4 w-4" />Sign Up</>}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            Already have an account?{" "}
            <Link href="/login" className="underline hover:text-primary">
              Log in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

    