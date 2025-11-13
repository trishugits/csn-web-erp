import { motion } from "framer-motion";
import { Bell, CreditCard, User, TrendingUp, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { studentApi } from "@/services/studentApi";

export default function StudentDashboard() {
  const { data: profileData } = useQuery({
    queryKey: ['student-profile'],
    queryFn: () => studentApi.getProfile(),
  });

  const { data: feesData } = useQuery({
    queryKey: ['student-fees'],
    queryFn: () => studentApi.getMyFees(),
  });

  const { data: noticesData } = useQuery({
    queryKey: ['student-notices'],
    queryFn: () => studentApi.getNotices(),
  });

  // Debug: Log API responses to understand structure
  console.log('Fees Data:', feesData);
  console.log('Notices Data:', noticesData);

  interface FeeRecord {
    amountDue: number;
    amountPaid: number;
  }

  interface Notice {
    _id: string;
    title: string;
    createdAt: string;
    important: boolean;
  }

  const profile = profileData?.data?.profile;

  // Safely extract fees array - handle different API response structures
  const feesArray = Array.isArray(feesData?.data)
    ? feesData.data
    : Array.isArray(feesData?.data?.fees)
      ? feesData.data.fees
      : [];
  const fees = feesArray as FeeRecord[];

  // Safely extract notices array
  const noticesArray = Array.isArray(noticesData?.data?.notices)
    ? noticesData.data.notices
    : Array.isArray(noticesData?.data)
      ? noticesData.data
      : [];
  const notices = noticesArray as Notice[];

  // Calculate fee statistics with safety checks
  const totalPending = Array.isArray(fees)
    ? fees.reduce((sum: number, fee: FeeRecord) =>
      sum + ((fee.amountDue || 0) - (fee.amountPaid || 0)), 0)
    : 0;
  const totalPaid = Array.isArray(fees)
    ? fees.reduce((sum: number, fee: FeeRecord) =>
      sum + (fee.amountPaid || 0), 0)
    : 0;
  const unreadNotices = Array.isArray(notices)
    ? notices.filter((n: Notice) => n.important).length
    : 0;

  const stats = [
    { label: "Pending Fees", value: `₹${totalPending.toLocaleString()}`, icon: CreditCard, color: "text-orange-500" },
    { label: "Total Paid", value: `₹${totalPaid.toLocaleString()}`, icon: TrendingUp, color: "text-green-500" },
    { label: "Unread Notices", value: unreadNotices.toString(), icon: Bell, color: "text-blue-500" },
    { label: "Class", value: profile?.class || "N/A", icon: User, color: "text-purple-500" },
  ];

  const recentNotices = notices.slice(0, 3).map((notice: Notice) => ({
    id: notice._id,
    title: notice.title,
    date: new Date(notice.createdAt).toLocaleDateString(),
    priority: notice.important ? "high" as const : "medium" as const,
  }));

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-4xl font-bold text-foreground mb-2">
          Welcome back, <span className="gradient-text">{profile ? `${profile.firstName}!` : 'Student!'}</span>
        </h1>
        <p className="text-muted-foreground">Here's what's happening with your account today.</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="glass-panel hover:scale-105 transition-transform duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <stat.icon className={`w-8 h-8 ${stat.color}`} />
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: index * 0.1 + 0.3, type: "spring" }}
                  >
                    <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                  </motion.div>
                </div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="glass-panel">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Recent Notices
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentNotices.map((notice) => (
                <motion.div
                  key={notice.id}
                  className="p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-foreground">{notice.title}</h3>
                      <p className="text-sm text-muted-foreground">{notice.date}</p>
                    </div>
                    <Badge
                      variant={
                        notice.priority === "high"
                          ? "destructive"
                          : notice.priority === "medium"
                            ? "default"
                            : "secondary"
                      }
                    >
                      {notice.priority}
                    </Badge>
                  </div>
                </motion.div>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="glass-panel">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Profile Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {profile ? (
                <>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-2xl font-bold text-white">
                      {profile.firstName?.[0]}{profile.lastName?.[0]}
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{profile.firstName} {profile.lastName}</h3>
                      <p className="text-sm text-muted-foreground">Class {profile.class} • ID: {profile.studentId}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Email:</span>
                      <span className="text-foreground">{profile.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Phone:</span>
                      <span className="text-foreground">{profile.phone || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Father:</span>
                      <span className="text-foreground">{profile.fatherName || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Mother:</span>
                      <span className="text-foreground">{profile.motherName || 'N/A'}</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="animate-spin text-primary" size={32} />
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
