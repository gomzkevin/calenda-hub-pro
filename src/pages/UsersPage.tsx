
import React from 'react';
import { Plus, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { sampleUsers } from '@/data/mockData';
import { Badge } from '@/components/ui/badge';

const UsersPage: React.FC = () => {
  const users = sampleUsers;
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold">Users</h1>
        <div className="flex gap-2">
          <div className="relative w-full sm:w-64">
            <Input
              type="text"
              placeholder="Search users..."
              className="w-full"
            />
          </div>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add User
          </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3">Name</th>
                  <th scope="col" className="px-6 py-3">Email</th>
                  <th scope="col" className="px-6 py-3">Role</th>
                  <th scope="col" className="px-6 py-3">Status</th>
                  <th scope="col" className="px-6 py-3">Created</th>
                  <th scope="col" className="px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="bg-white border-b">
                    <td className="px-6 py-4 font-medium">{user.name}</td>
                    <td className="px-6 py-4">{user.email}</td>
                    <td className="px-6 py-4">
                      <Badge variant={user.role === 'admin' ? 'default' : 'outline'}>
                        {user.role === 'admin' ? 'Admin' : 'User'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      {user.active ? (
                        <Check className="w-5 h-5 text-green-500" />
                      ) : (
                        <X className="w-5 h-5 text-red-500" />
                      )}
                    </td>
                    <td className="px-6 py-4">{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        <Button variant="ghost" size="sm">Edit</Button>
                        <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700">
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UsersPage;
