import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Plus, Edit, Trash2, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { adminApi, type Notice } from "@/services/adminApi";

interface NoticeFormData {
  title: string;
  message: string;
  startDate: string;
  endDate: string;
  important: boolean;
  targetClasses: string[];
  targetRoles: string[];
}

export default function Notices() {
  const [page, setPage] = useState(1);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingNotice, setEditingNotice] = useState<Notice | null>(null);
  const [formData, setFormData] = useState<NoticeFormData>({
    title: "",
    message: "",
    startDate: "",
    endDate: "",
    important: false,
    targetClasses: [],
    targetRoles: [],
  });
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-published-notices', page],
    queryFn: () => adminApi.getPublishedNotices({ page, limit: 10 }),
  });

  const addMutation = useMutation({
    mutationFn: (data: NoticeFormData) => adminApi.addNotice({
      title: data.title,
      message: data.message,
      startDate: data.startDate,
      endDate: data.endDate || undefined,
      important: data.important,
      target: {
        roles: data.targetRoles.length > 0 ? data.targetRoles : undefined,
      },
    }),
    onSuccess: () => {
      toast.success("Notice created successfully");
      queryClient.invalidateQueries({ queryKey: ['admin-published-notices'] });
      setIsAddDialogOpen(false);
      resetForm();
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : "Failed to create notice");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Notice> }) =>
      adminApi.updateNotice(id, data),
    onSuccess: () => {
      toast.success("Notice updated successfully");
      queryClient.invalidateQueries({ queryKey: ['admin-published-notices'] });
      setIsEditDialogOpen(false);
      setEditingNotice(null);
      resetForm();
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : "Failed to update notice");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteNotice(id),
    onSuccess: () => {
      toast.success("Notice deleted successfully");
      queryClient.invalidateQueries({ queryKey: ['admin-published-notices'] });
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : "Failed to delete notice");
    },
  });

  const resetForm = () => {
    setFormData({
      title: "",
      message: "",
      startDate: "",
      endDate: "",
      important: false,
      targetClasses: [],
      targetRoles: [],
    });
  };

  const handleAdd = () => {
    setIsAddDialogOpen(true);
    resetForm();
  };

  const handleEdit = (notice: Notice) => {
    setEditingNotice(notice);
    setFormData({
      title: notice.title,
      message: notice.message,
      startDate: notice.startDate ? new Date(notice.startDate).toISOString().split('T')[0] : "",
      endDate: notice.endDate ? new Date(notice.endDate).toISOString().split('T')[0] : "",
      important: notice.important || false,
      targetClasses: notice.target?.classes || [],
      targetRoles: notice.target?.roles || [],
    });
    setIsEditDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingNotice) {
      const updateData: Partial<Notice> = {
        title: formData.title,
        message: formData.message,
        startDate: formData.startDate,
        endDate: formData.endDate || undefined,
        important: formData.important,
        target: {
          classes: formData.targetClasses.length > 0 ? formData.targetClasses : undefined,
          roles: formData.targetRoles.length > 0 ? formData.targetRoles : undefined,
        },
      };
      updateMutation.mutate({ id: editingNotice._id, data: updateData });
    } else {
      addMutation.mutate(formData);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this notice?")) {
      deleteMutation.mutate(id);
    }
  };

  const notices = data?.data?.notices || [];
  const totalPages = data?.data?.totalDocuments ? Math.ceil(data.data.totalDocuments / 10) : 1;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Notice Management</h1>
          <p className="text-muted-foreground">Create and manage school notices</p>
        </div>
        <Button className="gap-2" onClick={handleAdd}>
          <Plus className="w-4 h-4" />
          Create Notice
        </Button>
      </div>

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
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card
                  className={`glass-card-hover ${
                    notice.important ? "border-l-4 border-l-warning" : ""
                  }`}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <CardTitle>{notice.title}</CardTitle>
                          {notice.important && (
                            <Badge className="bg-warning">
                              <AlertCircle className="w-3 h-3 mr-1" />
                              Important
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {new Date(notice.startDate).toLocaleDateString()}
                          {notice.endDate &&
                            ` - ${new Date(notice.endDate).toLocaleDateString()}`}
                        </p>
                        {notice.createdBy && (
                          <p className="text-xs text-muted-foreground mt-1">
                            By: {notice.createdBy.firstName} {notice.createdBy.lastName}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(notice)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(notice._id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-foreground whitespace-pre-wrap">{notice.message}</p>
                    {notice.target && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {notice.target.classes && notice.target.classes.length > 0 && (
                          <Badge variant="outline">
                            Classes: {notice.target.classes.join(", ")}
                          </Badge>
                        )}
                        {notice.target.roles && notice.target.roles.length > 0 && (
                          <Badge variant="outline">
                            Roles: {notice.target.roles.join(", ")}
                          </Badge>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {notices.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No notices found</p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
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

      {/* Add Notice Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Notice</DialogTitle>
            <DialogDescription>
              Create a notice to communicate with students, teachers, or specific classes.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Message *</Label>
              <Textarea
                id="message"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                rows={5}
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
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="important"
                checked={formData.important}
                onCheckedChange={(checked) => setFormData({ ...formData, important: checked })}
              />
              <Label htmlFor="important">Mark as Important</Label>
            </div>
            <div className="space-y-2">
              <Label>Target Roles</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={formData.targetRoles.includes('student') ? 'default' : 'outline'}
                  onClick={() => {
                    const roles = formData.targetRoles.includes('student')
                      ? formData.targetRoles.filter((r) => r !== 'student')
                      : [...formData.targetRoles, 'student'];
                    setFormData({ ...formData, targetRoles: roles });
                  }}
                >
                  Students
                </Button>
                <Button
                  type="button"
                  variant={formData.targetRoles.includes('teacher') ? 'default' : 'outline'}
                  onClick={() => {
                    const roles = formData.targetRoles.includes('teacher')
                      ? formData.targetRoles.filter((r) => r !== 'teacher')
                      : [...formData.targetRoles, 'teacher'];
                    setFormData({ ...formData, targetRoles: roles });
                  }}
                >
                  Teachers
                </Button>
                <Button
                  type="button"
                  variant={formData.targetRoles.includes('admin') ? 'default' : 'outline'}
                  onClick={() => {
                    const roles = formData.targetRoles.includes('admin')
                      ? formData.targetRoles.filter((r) => r !== 'admin')
                      : [...formData.targetRoles, 'admin'];
                    setFormData({ ...formData, targetRoles: roles });
                  }}
                >
                  Admins
                </Button>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={addMutation.isPending}>
                {addMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Notice"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Notice Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Notice</DialogTitle>
            <DialogDescription>
              Update the notice details.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Title *</Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-message">Message *</Label>
              <Textarea
                id="edit-message"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                rows={5}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-startDate">Start Date *</Label>
                <Input
                  id="edit-startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-endDate">End Date</Label>
                <Input
                  id="edit-endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="edit-important"
                checked={formData.important}
                onCheckedChange={(checked) => setFormData({ ...formData, important: checked })}
              />
              <Label htmlFor="edit-important">Mark as Important</Label>
            </div>
            <div className="space-y-2">
              <Label>Target Roles</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={formData.targetRoles.includes('student') ? 'default' : 'outline'}
                  onClick={() => {
                    const roles = formData.targetRoles.includes('student')
                      ? formData.targetRoles.filter((r) => r !== 'student')
                      : [...formData.targetRoles, 'student'];
                    setFormData({ ...formData, targetRoles: roles });
                  }}
                >
                  Students
                </Button>
                <Button
                  type="button"
                  variant={formData.targetRoles.includes('teacher') ? 'default' : 'outline'}
                  onClick={() => {
                    const roles = formData.targetRoles.includes('teacher')
                      ? formData.targetRoles.filter((r) => r !== 'teacher')
                      : [...formData.targetRoles, 'teacher'];
                    setFormData({ ...formData, targetRoles: roles });
                  }}
                >
                  Teachers
                </Button>
                <Button
                  type="button"
                  variant={formData.targetRoles.includes('admin') ? 'default' : 'outline'}
                  onClick={() => {
                    const roles = formData.targetRoles.includes('admin')
                      ? formData.targetRoles.filter((r) => r !== 'admin')
                      : [...formData.targetRoles, 'admin'];
                    setFormData({ ...formData, targetRoles: roles });
                  }}
                >
                  Admins
                </Button>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Notice"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
