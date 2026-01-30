import { useEffect, useState } from 'react';
import { blogsApi, activityLogsApi } from '@/db/api';
import { useAuth } from '@/contexts/AuthContext';
import { notificationHelper } from '@/lib/notificationHelper';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { Plus, Edit, Trash2, Image as ImageIcon, Upload, X } from 'lucide-react';

type Blog = {
  id: string;
  title: string;
  description: string;
  content: string | null;
  feature_image: string | null;
  category: string;
  tags: string[];
  author_id: string;
  status: string;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  author?: {
    id: string;
    username: string;
  };
};

const CATEGORIES = [
  'Marketing',
  'SEO',
  'Social Media',
  'Content Strategy',
  'Analytics',
  'Lead Generation',
  'Email Marketing',
  'PPC',
  'Other',
];

export default function BlogsPage() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingBlog, setEditingBlog] = useState<Blog | null>(null);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    feature_image: '',
    category: 'Marketing',
    tags: '',
    status: 'draft',
  });

  const { profile, hasPermission } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    loadBlogs();
  }, []);

  const loadBlogs = async () => {
    try {
      setLoading(true);
      const data = await blogsApi.getAll();
      setBlogs(data as Blog[]);
    } catch (error) {
      console.error('Failed to load blogs:', error);
      toast({
        title: 'Error',
        description: 'Failed to load blogs',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);

    try {
      const imageUrl = await blogsApi.uploadImage(file);
      setFormData({ ...formData, feature_image: imageUrl });
      
      toast({
        title: 'Success',
        description: file.size > 1024 * 1024 
          ? 'Image uploaded and compressed successfully'
          : 'Image uploaded successfully',
      });
    } catch (error) {
      console.error('Failed to upload image:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to upload image',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = async () => {
    if (formData.feature_image) {
      try {
        await blogsApi.deleteImage(formData.feature_image);
        setFormData({ ...formData, feature_image: '' });
        toast({
          title: 'Success',
          description: 'Image removed successfully',
        });
      } catch (error) {
        console.error('Failed to remove image:', error);
      }
    }
  };

  const handleSave = async () => {
    if (!profile) return;

    if (!formData.title.trim() || !formData.description.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Title and description are required',
        variant: 'destructive',
      });
      return;
    }

    try {
      const tagsArray = formData.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      const blogData = {
        title: formData.title,
        description: formData.description,
        content: formData.content || undefined,
        feature_image: formData.feature_image || undefined,
        category: formData.category,
        tags: tagsArray,
        status: formData.status,
      };

      if (editingBlog) {
        await blogsApi.update(editingBlog.id, blogData);

        await notificationHelper.notifyUserAndAdmins(
          profile.id as string,
          'Blog Updated',
          `Blog "${formData.title}" has been updated.`,
          'success',
          'blog_updated',
          'blog',
          editingBlog.id
        );

        toast({
          title: 'Success',
          description: 'Blog updated successfully',
        });
      } else {
        const newBlog = await blogsApi.create(blogData);

        await notificationHelper.notifyUserAndAdmins(
          profile.id as string,
          'Blog Created',
          `New blog "${formData.title}" has been created.`,
          'success',
          'blog_created',
          'blog',
          newBlog?.id || ''
        );

        toast({
          title: 'Success',
          description: 'Blog created successfully',
        });
      }

      if (profile) {
        await activityLogsApi.create({
          user_id: profile.id as string,
          action: editingBlog ? 'update_blog' : 'create_blog',
          resource_type: 'blog',
          resource_id: editingBlog?.id || '',
          details: { title: formData.title },
        });
      }

      setShowDialog(false);
      setEditingBlog(null);
      setFormData({
        title: '',
        description: '',
        content: '',
        feature_image: '',
        category: 'Marketing',
        tags: '',
        status: 'draft',
      });
      loadBlogs();
    } catch (error) {
      console.error('Failed to save blog:', error);
      toast({
        title: 'Error',
        description: 'Failed to save blog',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (blogId: string, title: string) => {
    try {
      await blogsApi.delete(blogId);

      if (profile) {
        await activityLogsApi.create({
          user_id: profile.id as string,
          action: 'delete_blog',
          resource_type: 'blog',
          resource_id: blogId,
          details: { title },
        });

        await notificationHelper.notifyAdmins(
          'Blog Deleted',
          `Blog "${title}" has been deleted.`,
          'warning',
          'blog_deleted',
          'blog',
          blogId
        );
      }

      toast({
        title: 'Success',
        description: 'Blog deleted successfully',
      });

      loadBlogs();
    } catch (error) {
      console.error('Failed to delete blog:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete blog',
        variant: 'destructive',
      });
    }
  };

  const openEditDialog = (blog: Blog) => {
    setEditingBlog(blog);
    setFormData({
      title: blog.title,
      description: blog.description,
      content: blog.content || '',
      feature_image: blog.feature_image || '',
      category: blog.category,
      tags: blog.tags.join(', '),
      status: blog.status,
    });
    setShowDialog(true);
  };

  const openNewDialog = () => {
    setEditingBlog(null);
    setFormData({
      title: '',
      description: '',
      content: '',
      feature_image: '',
      category: 'Marketing',
      tags: '',
      status: 'draft',
    });
    setShowDialog(true);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      draft: 'bg-gray-500 text-white',
      published: 'bg-green-500 text-white',
      archived: 'bg-red-500 text-white',
    };
    return <Badge className={variants[status] || 'bg-gray-500 text-white'}>{status}</Badge>;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Blog Management</h1>
          <p className="text-muted-foreground">Create and manage blog posts</p>
        </div>
        <Button onClick={openNewDialog}>
          <Plus className="h-4 w-4 mr-2" />
          New Blog Post
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : blogs.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <p className="text-muted-foreground">No blog posts yet</p>
          </div>
        ) : (
          blogs.map((blog) => (
            <Card key={blog.id} className="hover:shadow-lg transition-shadow">
              {blog.feature_image && (
                <div className="w-full h-48 overflow-hidden rounded-t-lg">
                  <img
                    src={blog.feature_image}
                    alt={blog.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-lg line-clamp-2">{blog.title}</CardTitle>
                  {getStatusBadge(blog.status)}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Badge variant="outline">{blog.category}</Badge>
                  <span>•</span>
                  <span>{blog.author?.username || 'Unknown'}</span>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                  {blog.description}
                </p>
                {blog.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {blog.tags.slice(0, 3).map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {blog.tags.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{blog.tags.length - 3}
                      </Badge>
                    )}
                  </div>
                )}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(blog)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Blog?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete "{blog.title}". This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(blog.id, blog.title)}>
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingBlog ? 'Edit Blog Post' : 'Create New Blog Post'}</DialogTitle>
            <DialogDescription>
              {editingBlog ? 'Update your blog post details' : 'Fill in the details for your new blog post'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter blog title"
              />
            </div>

            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of the blog post"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Full blog content"
                rows={6}
              />
            </div>

            <div>
              <Label>Feature Image</Label>
              <div className="space-y-2">
                {formData.feature_image ? (
                  <div className="relative">
                    <img
                      src={formData.feature_image}
                      alt="Feature"
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={handleRemoveImage}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed rounded-lg p-8 text-center">
                    <ImageIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <Label htmlFor="image-upload" className="cursor-pointer">
                      <div className="flex items-center justify-center gap-2">
                        <Upload className="h-4 w-4" />
                        <span>{uploading ? 'Uploading...' : 'Upload Image'}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Max 1MB. Images will be automatically compressed.
                      </p>
                    </Label>
                    <Input
                      id="image-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                      disabled={uploading}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="tags">Tags</Label>
              <Input
                id="tags"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="Enter tags separated by commas"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Example: marketing, seo, social media
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {editingBlog ? 'Update' : 'Create'} Blog
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
