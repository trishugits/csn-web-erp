import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MetricCard } from "@/components/admin/MetricCard";
import { Users, GraduationCap, DollarSign, FileText, Loader2, CreditCard, AlertCircle, PieChart as PieChartIcon, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { adminApi } from "@/services/adminApi";
import { motion } from "framer-motion";

const COLORS = ["#0891b2", "#06b6d4", "#22d3ee", "#67e8f9", "#a5f3fc", "#cffafe"];

export default function Dashboard() {
  const [classData, setClassData] = useState<Array<{ name: string; value: number; color: string }>>([]);
  const currentYear = new Date().getFullYear();
  const [selectedSession, setSelectedSession] = useState(currentYear.toString());

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-dashboard-stats'],
    queryFn: () => adminApi.getDashboardStats(),
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const { data: classwiseData, isLoading: classwiseLoading } = useQuery({
    queryKey: ['admin-students-classwise'],
    queryFn: () => adminApi.getStudentsClasswise(),
  });

  // Fee collection statistics
  const { data: feeStatsData, isLoading: feeStatsLoading } = useQuery({
    queryKey: ['admin-fee-dashboard', selectedSession],
    queryFn: () => adminApi.getAdminDashboardSummary({ session: selectedSession }),
    refetchInterval: 30000,
  });

  useEffect(() => {
    if (classwiseData?.data?.summary?.classBreakdown) {
      const breakdown = classwiseData.data.summary.classBreakdown;
      const formatted = breakdown.map((item: { class: string; count: number }, index: number) => ({
        name: item.class,
        value: item.count,
        color: COLORS[index % COLORS.length],
      }));
      setClassData(formatted);
    }
  }, [classwiseData]);

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    );
  }

  const totalStudents = stats?.totalStudents || 0;
  const totalTeachers = stats?.totalTeachers || 0;
  const totalNotices = stats?.totalNotices || 0;
  const feeCollection = stats?.feeCollection?.totalCollected || 0;

  // Fee statistics from the detailed endpoint
  const feeStats = feeStatsData?.data?.overallStats || {
    totalExpected: 0,
    totalCollected: 0,
    totalPending: 0,
    collectionPercentage: '0%',
    totalStudents: 0,
    paidCount: 0,
    unpaidCount: 0,
    partialCount: 0,
  };

  const classWiseStats = feeStatsData?.data?.classWiseStats || [];

  // Available sessions
  const sessions = [
    (currentYear - 1).toString(),
    currentYear.toString(),
    (currentYear + 1).toString(),
  ];
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary mb-2">Dashboard Overview</h1>
          <p className="text-muted-foreground">Welcome back! Here's what's happening today.</p>
        </div>
        <Select value={selectedSession} onValueChange={setSelectedSession}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select Session" />
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

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        <MetricCard
          title="Total Students"
          value={totalStudents.toLocaleString()}
          icon={GraduationCap}
          delay={0.1}
          gradient="gradient-primary"
        />
        <MetricCard
          title="Total Teachers"
          value={totalTeachers.toLocaleString()}
          icon={Users}
          delay={0.2}
          gradient="gradient-success"
        />
        {/* <MetricCard
          title="Fee Collection"
          value={`₹${feeCollection.toLocaleString()}`}
          icon={DollarSign}
          delay={0.3}
          gradient="gradient-warning"
        />
        <MetricCard
          title="Active Notices"
          value={totalNotices.toLocaleString()}
          icon={FileText}
          delay={0.4}
          gradient="gradient-danger"
        /> */}
      </div>

      {/* Fee Collection Statistics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <h2 className="text-2xl font-bold mb-4 text-primary">Fee Collection Summary - Session {selectedSession}</h2>
        {feeStatsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="glass-card">
                <CardContent className="p-6">
                  <div className="animate-pulse">
                    <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                    <div className="h-8 bg-muted rounded w-1/2"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <Card className="glass-card hover:shadow-lg transition-all duration-300 border-l-4 border-l-emerald-500">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-gradient-to-br from-emerald-500/20 to-emerald-600/20">
                    <DollarSign className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Expected</p>
                    <p className="text-2xl font-bold">₹{feeStats.totalExpected?.toLocaleString() || 0}</p>
                    <p className="text-xs text-muted-foreground">{feeStats.totalStudents || 0} students</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card hover:shadow-lg transition-all duration-300 border-l-4 border-l-green-500">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-gradient-to-br from-green-500/20 to-green-600/20">
                    <CreditCard className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Collected</p>
                    <p className="text-2xl font-bold text-green-600">₹{feeStats.totalCollected?.toLocaleString() || 0}</p>
                    <p className="text-xs text-muted-foreground">{feeStats.paidCount || 0} paid</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card hover:shadow-lg transition-all duration-300 border-l-4 border-l-red-500">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-gradient-to-br from-red-500/20 to-red-600/20">
                    <AlertCircle className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Pending</p>
                    <p className="text-2xl font-bold text-red-600">₹{feeStats.totalPending?.toLocaleString() || 0}</p>
                    <p className="text-xs text-muted-foreground">{feeStats.unpaidCount || 0} unpaid</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card hover:shadow-lg transition-all duration-300 border-l-4 border-l-purple-500">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-gradient-to-br from-purple-500/20 to-purple-600/20">
                    <PieChartIcon className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Collection Rate</p>
                    <p className="text-2xl font-bold text-purple-600">{feeStats.collectionPercentage || '0%'}</p>
                    <p className="text-xs text-muted-foreground">{feeStats.partialCount || 0} partial</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </motion.div>

      {/* Class-wise Fee Collection Table */}
      {!feeStatsLoading && classWiseStats.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mb-6"
        >
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                <div className="text-primary">Class-wise Fee Collection</div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border/50">
                      <th className="text-left py-3 px-4 font-medium">Class</th>
                      <th className="text-left py-3 px-4 font-medium">Students</th>
                      <th className="text-left py-3 px-4 font-medium">Expected</th>
                      <th className="text-left py-3 px-4 font-medium">Collected</th>
                      <th className="text-left py-3 px-4 font-medium">Pending</th>
                      <th className="text-left py-3 px-4 font-medium">Rate</th>
                      <th className="text-left py-3 px-4 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {classWiseStats.map((classData: any, index: number) => {
                      const collectionRate = classData.totalExpected > 0
                        ? ((classData.totalCollected / classData.totalExpected) * 100).toFixed(1)
                        : '0';
                      const rateColor = parseFloat(collectionRate) >= 80
                        ? 'text-green-600'
                        : parseFloat(collectionRate) >= 50
                          ? 'text-orange-600'
                          : 'text-red-600';

                      return (
                        <motion.tr
                          key={classData.class}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.7 + index * 0.05 }}
                          className="border-b border-border/30 hover:bg-muted/30 transition-colors"
                        >
                          <td className="py-3 px-4 font-medium">{classData.class}</td>
                          <td className="py-3 px-4">{classData.totalStudents}</td>
                          <td className="py-3 px-4">₹{classData.totalExpected?.toLocaleString()}</td>
                          <td className="py-3 px-4 text-green-600">₹{classData.totalCollected?.toLocaleString()}</td>
                          <td className="py-3 px-4 text-red-600">₹{classData.totalPending?.toLocaleString()}</td>
                          <td className={`py-3 px-4 font-bold ${rateColor}`}>{collectionRate}%</td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <div className="flex gap-1">
                                <div className="w-2 h-2 rounded-full bg-green-500" title={`Paid: ${classData.paidStudents}`}></div>
                                <div className="w-2 h-2 rounded-full bg-orange-500" title={`Partial: ${classData.partialStudents}`}></div>
                                <div className="w-2 h-2 rounded-full bg-red-500" title={`Unpaid: ${classData.unpaidStudents}`}></div>
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {classData.paidStudents}P {classData.partialStudents}Pa {classData.unpaidStudents}U
                              </span>
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Class Distribution */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle><div className="text-primary">Students by Class</div></CardTitle>
          </CardHeader>
          <CardContent>
            {classwiseLoading ? (
              <div className="flex items-center justify-center h-[300px]">
                <Loader2 className="animate-spin text-primary" size={32} />
              </div>
            ) : classData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={classData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {classData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No class data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Summary Stats */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle><div className="text-primary">Summary Statistics</div></CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <p className="text-sm font-medium">Total Classes</p>
                <p className="text-lg font-bold text-primary">
                  {classwiseData?.data?.summary?.totalClasses || 0}
                </p>
              </div>
              {stats?.feeCollection && (
                <>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <p className="text-sm font-medium">Pending Collection</p>
                    <p className="text-lg font-bold text-warning">
                      ₹{feeStats.totalPending?.toLocaleString() || 0}
                    </p>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <p className="text-sm font-medium">Collection Rate</p>
                    <p className="text-lg font-bold text-success">
                      {feeStats.collectionPercentage || '0%'}
                    </p>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
