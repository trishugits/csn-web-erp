import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bell, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { studentApi } from "@/services/studentApi";
import { motion, AnimatePresence } from "framer-motion";

export const StudentHeader = () => {
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const { data: profileData } = useQuery({
    queryKey: ['student-profile'],
    queryFn: () => studentApi.getProfile(),
  });

  const { data: noticesData } = useQuery({
    queryKey: ['student-notifications'],
    queryFn: () => studentApi.getNotices(),
    refetchInterval: 60000, 
  });

  const profile = profileData?.data?.profile;
  const studentName = profile ? `${profile.firstName || ''} ${profile.lastName || ''}`.trim() : "Student";
  const studentId = profile?.studentId || "N/A";

  // Generate initials from name
  const initials = profile?.firstName && profile?.lastName
    ? `${profile.firstName[0]}${profile.lastName[0]}`.toUpperCase()
    : studentName.split(' ').filter(Boolean).map((part) => part[0]?.toUpperCase()).slice(0, 2).join('') || 'S';

  const notices = noticesData?.data?.notices || [];
  const importantCount = notices.filter((n: any) => n.important).length;
  const hasNotifications = notices.length > 0;

  return (
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Search */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              className="pl-10 bg-muted/50"
            />
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-4">
          {/* Notifications */}
          <Popover open={notificationsOpen} onOpenChange={setNotificationsOpen}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-5 h-5" />
                {hasNotifications && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
                )}
                {importantCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-white text-xs rounded-full flex items-center justify-center font-semibold">
                    {importantCount}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-96 p-0" align="end">
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="font-semibold">Notifications</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setNotificationsOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <ScrollArea className="h-[400px]">
                <AnimatePresence>
                  {notices.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                      <Bell className="w-12 h-12 mx-auto mb-2 opacity-20" />
                      <p>No notifications</p>
                    </div>
                  ) : (
                    <div className="divide-y">
                      {notices.map((notice: any, index: number) => (
                        <motion.div
                          key={notice._id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ delay: index * 0.05 }}
                          className="p-4 hover:bg-accent/50 transition-colors cursor-pointer"
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-sm">{notice.title}</p>
                                {notice.important && (
                                  <Badge variant="destructive" className="text-xs">
                                    Important
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {notice.message}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(notice.createdAt).toLocaleDateString()} •
                                By {notice.createdBy?.firstName} {notice.createdBy?.lastName}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </AnimatePresence>
              </ScrollArea>
            </PopoverContent>
          </Popover>

          <div className="flex items-center gap-3 pl-4 border-l border-border">
            <div className="text-right">
              <p className="text-sm font-medium">{studentName}</p>
              <p className="text-xs text-muted-foreground">ID: {studentId}</p>
            </div>
            <Avatar>
              <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </div>
    </header>
  );
};
