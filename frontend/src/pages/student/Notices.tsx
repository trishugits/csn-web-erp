import { useState } from "react";
import { motion } from "framer-motion";
import { Bell, Calendar, Filter, Loader2, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { studentApi } from "@/services/studentApi";

export default function StudentNotices() {
  const [filter, setFilter] = useState("all");

  const { data, isLoading, error } = useQuery({
    queryKey: ['student-notices'],
    queryFn: () => studentApi.getNotices(),
  });

  const notices = data?.data?.notices || [];
  const filteredNotices = filter === "all"
    ? notices
    : notices.filter((n: any) => {
      if (filter === "high") return n.important;
      if (filter === "medium") return !n.important;
      return true;
    });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Bell className="w-8 h-8" />
            Notices & Announcements
          </h1>
          <p className="text-muted-foreground mt-1">Stay updated with the latest school announcements</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-48 glass-panel">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filter by priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Notices</SelectItem>
              <SelectItem value="high">High Priority</SelectItem>
              <SelectItem value="medium">Medium Priority</SelectItem>
              <SelectItem value="low">Low Priority</SelectItem>
            </SelectContent>
          </Select>
        </motion.div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-destructive" />
          <p className="text-destructive">Error loading notices. Please try again.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredNotices.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p className="text-muted-foreground">No notices available</p>
            </div>
          ) : (
            filteredNotices.map((notice: any, index: number) => (
              <motion.div
                key={notice._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card
                  className={`glass-panel hover:scale-[1.01] transition-all duration-300 ${notice.important ? "border-l-4 border-l-destructive" : ""
                    }`}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {notice.important && (
                          <motion.div
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ repeat: Infinity, duration: 2 }}
                          >
                            <AlertCircle className="w-5 h-5 text-destructive" />
                          </motion.div>
                        )}
                        <CardTitle className="text-xl">{notice.title}</CardTitle>
                      </div>
                      <Badge variant={notice.important ? "destructive" : "default"}>
                        {notice.important ? "Important" : "Normal"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">{notice.message}</p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(notice.createdAt).toLocaleDateString()}</span>
                      </div>
                      {notice.createdBy && (
                        <span className="px-2 py-1 bg-white/5 rounded">
                          By: {notice.createdBy.firstName} {notice.createdBy.lastName}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
