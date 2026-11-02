
"use client";

import { useState } from "react";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, Users, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import React from "react";

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  avatar: string;
};

function UsersPage() {
  const { toast } = useToast();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [users, setUsers] = useState<User[]>([
    { id: "user1", name: "Dr. Alex Johnson", email: "alex.j@hospital.com", role: "Hospital Admin", status: "Active", avatar: "https://i.pravatar.cc/40?u=user1" },
    { id: "user2", name: "Maria Garcia", email: "maria.g@ambulance.org", role: "Paramedic", status: "Active", avatar: "https://i.pravatar.cc/40?u=user2" },
    { id: "user3", name: "John Patient", email: "john.p@email.com", role: "Patient", status: "Inactive", avatar: "https://i.pravatar.cc/40?u=user3" },
    { id: "user4", name: "Admin User", email: "admin@ekta108.com", role: "Admin", status: "Active", avatar: "https://i.pravatar.cc/40?u=user4" },
  ]);


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !role) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please fill out all fields to add a new user.",
      });
      return;
    }

    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      const newUser: User = {
          id: `user${Date.now()}`,
          name: fullName,
          email,
          role,
          status: "Active",
          avatar: `https://i.pravatar.cc/40?u=${Date.now()}`
      };
      setUsers(prev => [newUser, ...prev]);
      toast({
        title: "User Added Successfully",
        description: `${fullName} has been added with the role: ${role}.`,
      });
      setFullName("");
      setEmail("");
      setRole("");
      setIsLoading(false);
    }, 1000);
  };
  
  return (
    <div className="space-y-6">
        <h1 className="text-3xl font-bold">User Management</h1>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
                 <DashboardCard title="User Roster" icon={<Users className="h-6 w-6" />} description="List of all users in the system.">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>User</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead className="text-center">Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users.map(user => (
                                <TableRow key={user.id}>
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-3">
                                            <Avatar>
                                                <AvatarImage src={user.avatar} alt={user.name} data-ai-hint="person user"/>
                                                <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p>{user.name}</p>
                                                <p className="text-xs text-muted-foreground">{user.email}</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>{user.role}</TableCell>
                                    <TableCell className="text-center">
                                        <Badge variant={user.status === "Active" ? "default" : "outline"} className={user.status === 'Active' ? 'bg-green-100 text-green-800 border-green-200' : ''}>
                                            {user.status}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </DashboardCard>
            </div>
            <div className="space-y-6">
                 <DashboardCard 
                    title="Add New User" 
                    icon={<UserPlus className="h-6 w-6" />} 
                    description="Create a new user profile and assign them a role."
                >
                    <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label htmlFor="fullName">Full Name</Label>
                        <Input id="fullName" placeholder="e.g., Dr. Jane Smith" value={fullName} onChange={(e) => setFullName(e.target.value)} />
                    </div>
                    <div>
                        <Label htmlFor="email">Email Address</Label>
                        <Input id="email" type="email" placeholder="e.g., jane.smith@hospital.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                    </div>
                    <div>
                        <Label htmlFor="role">Assign Role</Label>
                        <Select value={role} onValueChange={setRole}>
                        <SelectTrigger id="role"><SelectValue placeholder="Select a role..." /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Admin">Admin</SelectItem>
                            <SelectItem value="Hospital Admin">Hospital Admin</SelectItem>
                            <SelectItem value="Paramedic">Paramedic</SelectItem>
                            <SelectItem value="Patient">Patient</SelectItem>
                        </SelectContent>
                        </Select>
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin"/>Adding User...</> : "Add User"}
                    </Button>
                    </form>
                </DashboardCard>
            </div>
        </div>
    </div>
  );
}

export default UsersPage;
