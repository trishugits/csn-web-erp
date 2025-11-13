import { MetricCard } from "@/components/admin/MetricCard";
import { Users, Bell, DollarSign, TrendingUp, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { teacherApi } from "@/services/teacherApi";

const Dashboard = () => {
  const { data: profileData } = useQuery({
    queryKey: ['teacher-profile'],
    queryFn: () => teacherApi.getProfile(),
  });

  const { data: studentsData, isLoading: studentsLoading } = useQuery({
    queryKey: ['teacher-students'],
    queryFn: () => teacherApi.getStudents({ limit: 50 }),
  });

  const { data: noticesData } = useQuery({
    queryKey: ['teacher-notices'],
    queryFn: () => teacherApi.getNotices(),
  });

  const { data: feeSummaryData } = useQuery({
    queryKey: ['teacher-fee-summary'],
    queryFn: () => teacherApi.getFeeSummary(),
  });

  const profile = profileData?.data?.profile;
  const totalStudents = studentsData?.data?.totalDocuments || 0;
  const activeNotices = noticesData?.data?.count || 0;
  const feeCollection = feeSummaryData?.data?.totalCollected || 0;

  const metrics = [
    {
      title: "Total Students",
      value: studentsLoading ? "..." : totalStudents.toString(),
      icon: Users,
      gradient: "bg-gradient-to-br from-primary/80 to-primary"
    },
    {
      title: "Active Notices",
      value: activeNotices.toString(),
      icon: Bell,
      gradient: "bg-gradient-to-br from-blue-500/80 to-blue-600"
    },
    {
      title: "Fee Collection",
      value: `₹${feeCollection.toLocaleString()}`,
      icon: DollarSign,
      gradient: "bg-gradient-to-br from-green-500/80 to-green-600"
    },
    {
      title: "Class",
      value: profile?.allotedClass || "N/A",
      icon: TrendingUp,
      gradient: "bg-gradient-to-br from-purple-500/80 to-purple-600"
    },
  ];

  const recentActivity = [
    { action: "Added new student", name: "John Doe", time: "2 hours ago" },
    { action: "Published notice", name: "Exam Schedule", time: "5 hours ago" },
    { action: "Updated fee structure", name: "Q2 Fees", time: "1 day ago" },
  ];

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold gradient-text">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            {profile ? `Class ${profile.allotedClass} Overview` : 'Loading...'}
          </p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => (
          <MetricCard
            key={metric.title}
            {...metric}
            delay={index * 0.1}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="glass-card p-6">
            <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{activity.action}</p>
                    <p className="text-sm text-muted-foreground">{activity.name}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">{activity.time}</span>
                </motion.div>
              ))}
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="glass-card p-6">
            <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
            <div className="space-y-3">
              {[
                { label: "Add Student", color: "from-primary/20 to-primary/10" },
                { label: "Create Notice", color: "from-blue-500/20 to-blue-500/10" },
                { label: "Update Fees", color: "from-green-500/20 to-green-500/10" },
              ].map((action, index) => (
                <motion.button
                  key={action.label}
                  whileHover={{ scale: 1.02, x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  className={`w-full p-4 rounded-lg bg-gradient-to-r ${action.color} border border-border/50 text-left font-medium hover:shadow-lg transition-all`}
                >
                  {action.label}
                </motion.button>
              ))}
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
