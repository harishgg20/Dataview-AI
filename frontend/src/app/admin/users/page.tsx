"use client";

import { useEffect, useState } from "react";
import { authService, User } from "@/services/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Search, Trash2, Edit } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function UsersPage() {
    const { toast } = useToast();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            const data = await authService.getAllUsers();
            setUsers(data);
        } catch (err) {
            console.error("Failed to load users", err);
            toast({
                title: "Error",
                description: "Failed to load users list",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const filteredUsers = users.filter(user =>
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (user.last_name && user.last_name.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    if (loading) {
        return <div className="p-8 flex justify-center"><Loader2 className="animate-spin h-8 w-8 text-slate-400" /></div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Users</h1>
                    <p className="text-muted-foreground">
                        Manage users, roles, and permissions.
                    </p>
                </div>
                <div className="flex gap-2">
                    {/* Future Add User Button */}
                </div>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>All Users</CardTitle>
                        <div className="relative w-64">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search users..."
                                className="pl-8"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 border-b">
                                <tr>
                                    <th className="h-12 px-4 font-medium text-slate-500">User</th>
                                    <th className="h-12 px-4 font-medium text-slate-500">Email</th>
                                    <th className="h-12 px-4 font-medium text-slate-500">Role</th>
                                    <th className="h-12 px-4 font-medium text-slate-500 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="p-8 text-center text-muted-foreground">
                                            No users found.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredUsers.map((user) => (
                                        <tr key={user.id} className="border-b last:border-0 hover:bg-slate-50/50 transition-colors">
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center border text-xs font-semibold text-slate-600">
                                                        {user.avatar_data ? (
                                                            <img src={user.avatar_data} alt={user.first_name} className="h-full w-full rounded-full object-cover" />
                                                        ) : (
                                                            <span>{user.first_name[0].toUpperCase()}</span>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className="font-medium">{user.first_name} {user.last_name || ""}</div>
                                                        <div className="text-xs text-muted-foreground md:hidden">{user.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4 hidden md:table-cell">{user.email}</td>
                                            <td className="p-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                                                    ${user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-slate-100 text-slate-800'}
                                                `}>
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right">
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-red-600">
                                                    <Trash2 className="h-4 w-4" />
                                                    <span className="sr-only">Delete</span>
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
