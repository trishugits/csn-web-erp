import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Edit, Trash2, AlertCircle, Loader2, Inbox, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { teacherApi, type Notice } from "@/services/teacherApi";
import { data } from "react-router-dom";

interface NoticeFormData {
  title: string;
  message: string;
  target: {
    roles: string[];
    classes: string[];
  };
  startDate: string;
  endDate: string;
  important: boolean;
}

const Notices = () => {
  const [activeTab, setActiveTab] = useState<'published' | 'received'>('published');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingNotice, setEditingNotice] = useState<Notice | null>(null);
  const [page, setPage] = useState(1);
  const [formData, setFormData] = useState<NoticeFormData>({
    title: "",
    message: "",
    target: {
      roles: [],
      classes: [],
    },
    startDate: new Date().toISOString().split('T')[0],
    endDate: "",
    important: false,
  });
  const queryClient = useQueryClient();

  const { data: profileData } = useQuery({
    queryKey: ['teacher-profile'],
    queryFn: () => teacherApi.getProfile(),
  });

  // Get notices created BY the teacher
  const { data: publishedData, isLoading: publishedLoading, error: publishedError } = useQuery({
    queryKey: ['teacher-published-notices', page],
    queryFn: () => teacherApi.getPublishedNotices({ page, limit: 10 }),
    enabled: activeTab === 'published',
  });

  // Get notices received FROM admin
  const { data: receivedData, isLoading: receivedLoading, error: receivedError } = useQuery({
    queryKey: ['teacher-received-notices'],
    queryFn: () => teacherApi.getNotices(),
    enabled: activeTab === 'received',
  });

  const addMutation = useMutation({
    mutationFn: (data: NoticeFormData) => {
      const profile = profileData?.data;
      return teacherApi.addNotice({
        ...data,
        target: {
          ...data.target,
          classes: profile?.allotedClass ? [profile.allotedClass] : [],
        },
      });
    },
    onSuccess: () => {
      toast.success("Notice created successfully");
      queryClient.invalidateQueries({ queryKey: ['teacher-published-notices'] });
      queryClient.invalidateQueries({ queryKey: ['teacher-notifications'] });
      setIsAddDialogOpen(false);
      resetForm();
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : "Failed to create notice");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Notice> }) =>
      teacherApi.updateNotice(id, data),
    onSuccess: () => {
      toast.success("Notice updated successfully");
      queryClient.invalidateQueries({ queryKey: ['teacher-published-notices'] });
      queryClient.invalidateQueries({ queryKey: ['teacher-notifications'] });
      setIsEditDialogOpen(false);
      setEditingNotice(null);
      resetForm();
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : "Failed to update notice");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => teacherApi.deleteNotice(id),
    onSuccess: () => {
      toast.success("Notice deleted successfully");
      queryClient.invalidateQueries({ queryKey: ['teacher-published-notices'] });
      queryClient.invalidateQueries({ queryKey: ['teacher-notifications'] });
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : "Failed to delete notice");
    },
  });

  const resetForm = () => {
    setFormData({
      title: "",
      message: "",
      target: {
        roles: [],
        classes: [],
      },
      startDate: new Date().toISOString().split('T')[0],
      endDate: "",
      important: false,
    });
  };

  const handleEdit = (notice: Notice) => {
    setEditingNotice(notice);
    setFormData({
      title: notice.title,
      message: notice.message,
      target: {
        roles: notice.target.roles || [],
        classes: notice.target.classes || [],
      },
      startDate: notice.startDate ? new Date(notice.startDate).toISOString().split('T')[0] : "",
      endDate: notice.endDate ? new Date(notice.endDate).toISOString().split('T')[0] : "",
      important: notice.important || false,
    });
    setIsEditDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingNotice) {
      updateMutation.mutate({
        id: editingNotice._id,
        data: {
          title: formData.title,
          message: formData.message,
          target: formData.target,
          startDate: formData.startDate,
          endDate: formData.endDate || undefined,
          important: formData.important,
        },
      });
    } else {
      addMutation.mutate(formData);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this notice?")) {
      deleteMutation.mutate(id);
    }
  };

  const publishedNotices = publishedData?.data?.notices || [];
  const receivedNotices = receivedData?.data?.notices || [];
  const totalPages = publishedData?.data?.totalDocuments ? Math.ceil(publishedData.data.totalDocuments / 10) : 1;
  
  const notices = activeTab === 'published' ? publishedNotices : receivedNotices;
  const isLoading = activeTab === 'published' ? publishedLoading : receivedLoading;
  const error = activeTab === 'published' ? publishedError : receivedError;

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold gradient-text">Notices</h1>
            <p className="text-muted-foreground mt-1">
              {activeTab === 'published' 
                ? 'Create and manage your class notices' 
                : 'View notices from administration'}
            </p>
          </div>
          {activeTab === 'published' && (
            <Button onClick={() => {
              resetForm();
              setIsAddDialogOpen(true);
            }}>
              <Plus className="w-4 h-4 mr-2" />
              Create Notice
            </Button>
          )}
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex gap-2 border-b border-border"
      >
        <Button
          variant={activeTab === 'published' ? 'default' : 'ghost'}
          className="rounded-b-none"
          onClick={() => {
            setActiveTab('published');
            setPage(1);
          }}
        >
          <Send className="w-4 h-4 mr-2" />
          My Published Notices
        </Button>
        <Button
          variant={activeTab === 'received' ? 'default' : 'ghost'}
          className="rounded-b-none"
          onClick={() => {
            setActiveTab('received');
          }}
        >
          <Inbox className="w-4 h-4 mr-2" />
          Received from Admin
        </Button>
      </motion.div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-destructive">Error loading notices. Please try again.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4">
            {notices.map((notice: Notice, index: number) => (
              <motion.div
                key={notice._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card
                  className={`glass-card p-6 hover:shadow-lg transition-all ${
                    notice.important ? "border-2 border-destructive" : ""
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {notice.important && (
                          <motion.div
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ repeat: Infinity, duration: 2 }}
                          >
                            <AlertCircle className="w-5 h-5 text-destructive" />
                          </motion.div>
                        )}
                        <h3 className="text-lg font-semibold">{notice.title}</h3>
                        {notice.important && (
                          <Badge variant="destructive">Important</Badge>
                        )}
                      </div>
                      <p className="text-muted-foreground mb-2">{notice.message}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <p>Posted: {new Date(notice.createdAt).toLocaleDateString()}</p>
                        {notice.startDate && (
                          <p>Start: {new Date(notice.startDate).toLocaleDateString()}</p>
                        )}
                        {notice.endDate && (
                          <p>End: {new Date(notice.endDate).toLocaleDateString()}</p>
                        )}
                        {activeTab === 'received' && notice.createdBy && (
                          <p>By: {notice.createdBy.firstName} {notice.createdBy.lastName}</p>
                        )}
                      </div>
                    </div>
                    {activeTab === 'published' && (
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(notice)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-destructive"
                          onClick={() => handleDelete(notice._id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

          {notices.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                {activeTab === 'published' 
                  ? 'No notices found. Create your first notice!' 
                  : 'No notices received from administration yet.'}
              </p>
            </div>
          )}

          {activeTab === 'published' && totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-sm text-muted-foreground">
                Page {page} of {totalPages} ({data?.data?.totalDocuments || 0} total)
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Add/Edit Notice Dialog */}
      <Dialog open={isAddDialogOpen || isEditDialogOpen} onOpenChange={(open) => {
        setIsAddDialogOpen(open);
        setIsEditDialogOpen(open);
        if (!open) {
          setEditingNotice(null);
          resetForm();
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingNotice ? "Edit Notice" : "Create New Notice"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter notice title"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Message *</Label>
              <Textarea
                id="message"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Enter notice message"
                rows={4}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date (Optional)</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                />
              </div>
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-0.5">
                <Label htmlFor="important">Mark as Important</Label>
                <p className="text-sm text-muted-foreground">
                  Important notices will be highlighted
                </p>
              </div>
              <Switch
                id="important"
                checked={formData.important}
                onCheckedChange={(checked) => setFormData({ ...formData, important: checked })}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => {
                setIsAddDialogOpen(false);
                setIsEditDialogOpen(false);
                setEditingNotice(null);
                resetForm();
              }}>
                Cancel
              </Button>
              <Button type="submit" disabled={addMutation.isPending || updateMutation.isPending}>
                {(addMutation.isPending || updateMutation.isPending) ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {editingNotice ? "Updating..." : "Creating..."}
                  </>
                ) : (
                  editingNotice ? "Update Notice" : "Create Notice"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Notices;
