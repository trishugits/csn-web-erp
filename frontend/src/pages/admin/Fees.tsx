import { useState } from "react";
import { motion } from "framer-motion";
import { Loader2, DollarSign, TrendingUp, Users, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/services/adminApi";
import { AdminDashboardTab } from "@/components/fees/admin/AdminDashboardTab";
import { AdminFeeStructuresTab } from "@/components/fees/admin/AdminFeeStructuresTab";
import { AdminClassReportTab } from "@/components/fees/admin/AdminClassReportTab";
import { AdminPaymentReportsTab } from "@/components/fees/admin/AdminPaymentReportsTab";

const AdminFees = () => {
  const [selectedSession, setSelectedSession] = useState(new Date().getFullYear().toString());

  // Get dashboard summary
  const { data: dashboardData, isLoading: dashboardLoading } = useQuery({
    queryKey: ['admin-dashboard-summary', selectedSession],
    queryFn: () => adminApi.getAdminDashboardSummary({ session: selectedSession }),
  });

  const overallStats = dashboardData?.data?.overallStats;
  const classWiseStats = dashboardData?.data?.classWiseStats || [];

  // Available sessions
  const currentYear = new Date().getFullYear();
  const sessions = [
    (currentYear - 1).toString(),
    currentYear.toString(),
    (currentYear + 1).toString(),
  ];

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold gradient-text">Fee Management</h1>
            <p className="text-muted-foreground mt-1">
              Complete fee management and collection tracking
            </p>
          </div>
          <Select value={selectedSession} onValueChange={setSelectedSession}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Session" />
            </SelectTrigger>
            <SelectContent>
              {sessions.map((session) => (
                <SelectItem key={session} value={session}>
                  Session {session}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </motion.div>


      {/* Overall Statistics Cards */}
      {dashboardLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      ) : overallStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="glass-card">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 rounded-lg bg-gradient-to-br from-blue-500/80 to-blue-600">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
              </div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Total Expected</h3>
              <p className="text-2xl font-bold">₹{overallStats.totalExpected?.toLocaleString() || 0}</p>
              <p className="text-sm text-muted-foreground mt-1">{overallStats.totalStudents || 0} students</p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 rounded-lg bg-gradient-to-br from-green-500/80 to-green-600">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
              </div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Total Collected</h3>
              <p className="text-2xl font-bold text-green-500">₹{overallStats.totalCollected?.toLocaleString() || 0}</p>
              <p className="text-sm text-muted-foreground mt-1">{overallStats.paidCount || 0} paid</p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 rounded-lg bg-gradient-to-br from-red-500/80 to-red-600">
                  <AlertCircle className="w-6 h-6 text-white" />
                </div>
              </div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Total Pending</h3>
              <p className="text-2xl font-bold text-red-500">₹{overallStats.totalPending?.toLocaleString() || 0}</p>
              <p className="text-sm text-muted-foreground mt-1">{overallStats.unpaidCount || 0} unpaid</p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 rounded-lg bg-gradient-to-br from-purple-500/80 to-purple-600">
                  <Users className="w-6 h-6 text-white" />
                </div>
              </div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Collection Rate</h3>
              <p className="text-2xl font-bold text-purple-500">{overallStats.collectionPercentage || '0%'}</p>
              <p className="text-sm text-muted-foreground mt-1">{overallStats.partialCount || 0} partial</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="dashboard" className="space-y-6">
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="structures">Fee Structures</TabsTrigger>
          <TabsTrigger value="reports">Class Reports</TabsTrigger>
          <TabsTrigger value="payment-reports">Payment Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <AdminDashboardTab
            classWiseStats={classWiseStats}
            session={selectedSession}
          />
        </TabsContent>

        <TabsContent value="structures">
          <AdminFeeStructuresTab session={selectedSession} />
        </TabsContent>

        <TabsContent value="reports">
          <AdminClassReportTab session={selectedSession} />
        </TabsContent>

        <TabsContent value="payment-reports">
          <AdminPaymentReportsTab session={selectedSession} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminFees;
