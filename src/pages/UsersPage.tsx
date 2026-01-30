import { useEffect, useState } from 'react';
import { profilesApi, activityLogsApi } from '@/db/api';
import { paginationHelper, type PaginationParams } from '@/db/helpers';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { DataPagination } from '@/components/common/DataPagination';
import { Plus, Edit, Trash2, Search, Eye, UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/db/supabase';
import { notificationHelper } from '@/lib/notificationHelper';

type UserRole = 'admin' | 'sales' | 'seo' | 'client';

type Profile = {
  id: string;
  username: string;
  email: string | null;
  phone: string | null;
  role: UserRole;
  is_client_paid: boolean;
  subscription_plan: string | null;
  subscription_start: string | null;
  subscription_end: string | null;
  created_at: string;
  updated_at: string;
};

export default function UsersPage() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalItems, setTotalItems] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  const [showDialog, setShowDialog] = useState(false);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<Profile | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    phone: '',
    password: '',
    role: 'sales' as UserRole,
    is_client_paid: false,
    subscription_plan: '',
    subscription_start: '',
    subscription_end: '',
  });

  const [inviteData, setInviteData] = useState({
    email: '',
    username: '',
    password: '',
    role: 'sales' as UserRole,
  });

  const { profile, hasPermission } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadUsers();
  }, [currentPage, pageSize, searchQuery, roleFilter]);

  const loadUsers = async () => {
    try {
      setLoading(true);

      const filters: Record<string, unknown> = {};
      if (roleFilter !== 'all') filters.role = roleFilter;

      const params: PaginationParams = {
        page: currentPage,
        pageSize,
        search: searchQuery,
        filters,
      };

      const result = await paginationHelper.paginate<Profile>(
        'profiles',
        params,
        '*',
        ['username', 'email']
      );

      setUsers(result.data);
      setTotalItems(result.total);
    } catch (error) {
      console.error('Failed to load users:', error);
      toast({
        title: 'Error',
        description: 'Failed to load users',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInviteUser = async () => {
    if (!hasPermission('users', 'write')) {
      toast({
        title: 'Permission Denied',
        description: 'You do not have permission to invite users',
        variant: 'destructive',
      });
      return;
    }

    if (!inviteData.email || !inviteData.username || !inviteData.password) {
      toast({
        title: 'Validation Error',
        description: 'Email, username, and password are required',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Create user with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: inviteData.email,
        password: inviteData.password,
        options: {
          data: {
            username: inviteData.username,
          },
        },
      });

      if (authError) throw authError;

      if (authData.user) {
        // Update the profile with the role
        await profilesApi.update(authData.user.id, {
          role: inviteData.role,
        });

        // Notify the new user
        await notificationHelper.notifyUser(
          authData.user.id,
          'Welcome!',
          `Your account has been created with ${inviteData.role} role.`,
          'success',
          'user_created'
        );

        // Notify admins
        await notificationHelper.notifyAdmins(
          'New User Created',
          `${inviteData.username} has been added as ${inviteData.role}.`,
          'info',
          'user_created',
          'user',
          authData.user.id
        );

        if (profile) {
          await activityLogsApi.create({
            user_id: profile.id as string,
            action: 'create_user',
            resource_type: 'user',
            resource_id: authData.user.id,
            details: { username: inviteData.username, role: inviteData.role },
          });
        }

        toast({
          title: 'Success',
          description: 'User invited successfully',
        });

        setShowInviteDialog(false);
        setInviteData({
          email: '',
          username: '',
          password: '',
          role: 'sales',
        });
        loadUsers();
      }
    } catch (error) {
      console.error('Failed to invite user:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to invite user',
        variant: 'destructive',
      });
    }
  };

  const handleSaveUser = async () => {
    if (!hasPermission('users', 'write')) {
      toast({
        title: 'Permission Denied',
        description: 'You do not have permission to manage users',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.username.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Username is required',
        variant: 'destructive',
      });
      return;
    }

    try {
      if (editingUser) {
        // Update existing user
        await profilesApi.update(editingUser.id, {
          username: formData.username,
          email: formData.email || null,
          phone: formData.phone || null,
          role: formData.role,
          is_client_paid: formData.is_client_paid,
          subscription_plan: formData.subscription_plan || null,
          subscription_start: formData.subscription_start || null,
          subscription_end: formData.subscription_end || null,
        });

        // Notify the user
        await notificationHelper.notifyUser(
          editingUser.id,
          'Profile Updated',
          'Your profile has been updated by an administrator.',
          'info',
          'user_updated'
        );

        // Notify admins
        await notificationHelper.notifyAdmins(
          'User Updated',
          `${formData.username}'s profile has been updated.`,
          'info',
          'user_updated',
          'user',
          editingUser.id
        );

        if (profile) {
          await activityLogsApi.create({
            user_id: profile.id as string,
            action: 'update_user',
            resource_type: 'user',
            resource_id: editingUser.id,
            details: { username: formData.username, role: formData.role },
          });
        }

        toast({
          title: 'Success',
          description: 'User updated successfully',
        });
      }

      setShowDialog(false);
      setEditingUser(null);
      setFormData({
        username: '',
        email: '',
        phone: '',
        password: '',
        role: 'sales',
        is_client_paid: false,
        subscription_plan: '',
        subscription_start: '',
        subscription_end: '',
      });
      loadUsers();
    } catch (error) {
      console.error('Failed to save user:', error);
      toast({
        title: 'Error',
        description: 'Failed to save user',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteUser = async (userId: string, username: string) => {
    if (!hasPermission('users', 'write')) {
      toast({
        title: 'Permission Denied',
        description: 'You do not have permission to delete users',
        variant: 'destructive',
      });
      return;
    }

    try {
      await profilesApi.delete(userId);

      // Notify admins
      await notificationHelper.notifyAdmins(
        'User Deleted',
        `${username} has been removed from the system.`,
        'warning',
        'user_deleted',
        'user',
        userId
      );

      if (profile) {
        await activityLogsApi.create({
          user_id: profile.id as string,
          action: 'delete_user',
          resource_type: 'user',
          resource_id: userId,
          details: { username },
        });
      }

      toast({
        title: 'Success',
        description: 'User deleted successfully',
      });

      loadUsers();
    } catch (error) {
      console.error('Failed to delete user:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete user',
        variant: 'destructive',
      });
    }
  };

  const openEditDialog = (user: Profile) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      email: user.email || '',
      phone: user.phone || '',
      password: '',
      role: user.role,
      is_client_paid: user.is_client_paid,
      subscription_plan: user.subscription_plan || '',
      subscription_start: user.subscription_start || '',
      subscription_end: user.subscription_end || '',
    });
    setShowDialog(true);
  };

  const getRoleBadge = (role: UserRole) => {
    const variants = {
      admin: 'bg-red-500 text-white',
      sales: 'bg-blue-500 text-white',
      seo: 'bg-green-500 text-white',
      client: 'bg-purple-500 text-white',
    };
    return <Badge className={variants[role]}>{role}</Badge>;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground">Manage system users and their roles</p>
        </div>
        {hasPermission('users', 'write') && (
          <Button onClick={() => setShowInviteDialog(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Invite User
          </Button>
        )}
      </div>

      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="sales">Sales</SelectItem>
                <SelectItem value="seo">SEO</SelectItem>
                <SelectItem value="client">Client</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery('');
                setRoleFilter('all');
              }}
            >
              Clear Filters
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Username</TableHead>
                      <TableHead className="hidden md:table-cell">Email</TableHead>
                      <TableHead className="hidden lg:table-cell">Phone</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead className="hidden xl:table-cell">Subscription</TableHead>
                      <TableHead className="hidden xl:table-cell">Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                          No users found
                        </TableCell>
                      </TableRow>
                    ) : (
                      users.map((user) => (
                        <TableRow key={user.id} className="hover:bg-muted/50 transition-colors">
                          <TableCell className="font-medium">{user.username}</TableCell>
                          <TableCell className="hidden md:table-cell">{user.email || '-'}</TableCell>
                          <TableCell className="hidden lg:table-cell">{user.phone || '-'}</TableCell>
                          <TableCell>{getRoleBadge(user.role)}</TableCell>
                          <TableCell className="hidden xl:table-cell">
                            {user.role === 'client' ? (
                              <div className="flex flex-col gap-1">
                                {user.is_client_paid ? (
                                  <Badge variant="default">Active</Badge>
                                ) : (
                                  <Badge variant="secondary">Inactive</Badge>
                                )}
                                {user.subscription_plan && (
                                  <span className="text-xs text-muted-foreground">
                                    {user.subscription_plan}
                                  </span>
                                )}
                              </div>
                            ) : (
                              '-'
                            )}
                          </TableCell>
                          <TableCell className="hidden xl:table-cell">
                            {new Date(user.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => navigate(`/users/${user.id}`)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {hasPermission('users', 'write') && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => openEditDialog(user)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  {user.id !== profile?.id && (
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button variant="ghost" size="icon">
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>Delete User?</AlertDialogTitle>
                                          <AlertDialogDescription>
                                            This will permanently delete {user.username} and all associated data.
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                                          <AlertDialogAction
                                            onClick={() => handleDeleteUser(user.id, user.username)}
                                          >
                                            Delete
                                          </AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  )}
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              <DataPagination
                currentPage={currentPage}
                totalPages={Math.ceil(totalItems / pageSize)}
                pageSize={pageSize}
                totalItems={totalItems}
                onPageChange={setCurrentPage}
                onPageSizeChange={(size) => {
                  setPageSize(size);
                  setCurrentPage(1);
                }}
              />
            </>
          )}
        </CardContent>
      </Card>

      {/* Invite User Dialog */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite New User</DialogTitle>
            <DialogDescription>
              Create a new user account with email and password
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="invite_email">Email *</Label>
              <Input
                id="invite_email"
                type="email"
                value={inviteData.email}
                onChange={(e) => setInviteData({ ...inviteData, email: e.target.value })}
                placeholder="user@example.com"
              />
            </div>
            <div>
              <Label htmlFor="invite_username">Username *</Label>
              <Input
                id="invite_username"
                value={inviteData.username}
                onChange={(e) => setInviteData({ ...inviteData, username: e.target.value })}
                placeholder="johndoe"
              />
            </div>
            <div>
              <Label htmlFor="invite_password">Password *</Label>
              <Input
                id="invite_password"
                type="password"
                value={inviteData.password}
                onChange={(e) => setInviteData({ ...inviteData, password: e.target.value })}
                placeholder="••••••••"
              />
            </div>
            <div>
              <Label htmlFor="invite_role">Role</Label>
              <Select
                value={inviteData.role}
                onValueChange={(value) => setInviteData({ ...inviteData, role: value as UserRole })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="sales">Sales</SelectItem>
                  <SelectItem value="seo">SEO</SelectItem>
                  <SelectItem value="client">Client</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInviteDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleInviteUser}>Invite User</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information and role
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="username">Username *</Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="johndoe"
                />
              </div>
              <div>
                <Label htmlFor="role">Role</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => setFormData({ ...formData, role: value as UserRole })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="sales">Sales</SelectItem>
                    <SelectItem value="seo">SEO</SelectItem>
                    <SelectItem value="client">Client</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="john@example.com"
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+1-555-0123"
                />
              </div>
            </div>

            {formData.role === 'client' && (
              <>
                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-3">Subscription Details</h4>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="is_client_paid"
                        checked={formData.is_client_paid}
                        onChange={(e) => setFormData({ ...formData, is_client_paid: e.target.checked })}
                        className="rounded"
                      />
                      <Label htmlFor="is_client_paid">Active Subscription</Label>
                    </div>

                    <div>
                      <Label htmlFor="subscription_plan">Subscription Plan</Label>
                      <Select
                        value={formData.subscription_plan}
                        onValueChange={(value) => setFormData({ ...formData, subscription_plan: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select plan" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="basic">Basic - $29/month</SelectItem>
                          <SelectItem value="professional">Professional - $79/month</SelectItem>
                          <SelectItem value="enterprise">Enterprise - $199/month</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="subscription_start">Start Date</Label>
                        <Input
                          id="subscription_start"
                          type="date"
                          value={formData.subscription_start}
                          onChange={(e) => setFormData({ ...formData, subscription_start: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="subscription_end">End Date</Label>
                        <Input
                          id="subscription_end"
                          type="date"
                          value={formData.subscription_end}
                          onChange={(e) => setFormData({ ...formData, subscription_end: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveUser}>Update User</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
