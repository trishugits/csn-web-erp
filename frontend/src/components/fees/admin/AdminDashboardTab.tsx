import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown } from "lucide-react";

interface ClassWiseStat {
  class: string;
  totalStudents: number;
  paidStudents: number;
  unpaidStudents: number;
  partialStudents: number;
  totalExpected: number;
  totalCollected: number;
  totalPending: number;
}

interface AdminDashboardTabProps {
  classWiseStats: ClassWiseStat[];
  session: string;
}

export function AdminDashboardTab({ classWiseStats, session }: AdminDashboardTabProps) {
  const getCollectionRate = (collected: number, expected: number) => {
    if (expected === 0) return '0%';
    return ((collected / expected) * 100).toFixed(1) + '%';
  };

  const getStatusColor = (rate: number) => {
    if (rate >= 80) return 'text-green-500';
    if (rate >= 50) return 'text-orange-500';
    return 'text-red-500';
  };

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle>Class-wise Fee Collection Summary - Session {session}</CardTitle>
      </CardHeader>
      <CardContent>
        {classWiseStats.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No fee data available for this session
          </div>
        ) : (
          <div className="rounded-lg border border-border/50 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Class</TableHead>
                  <TableHead>Total Students</TableHead>
                  <TableHead>Paid</TableHead>
                  <TableHead>Unpaid</TableHead>
                  <TableHead>Partial</TableHead>
                  <TableHead>Expected</TableHead>
                  <TableHead>Collected</TableHead>
                  <TableHead>Pending</TableHead>
                  <TableHead>Collection %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {classWiseStats.map((stat, index) => {
                  const collectionRate = parseFloat(getCollectionRate(stat.totalCollected, stat.totalExpected));
                  return (
                    <motion.tr
                      key={stat.class}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-accent/50 transition-colors"
                    >
                      <TableCell className="font-medium">{stat.class}</TableCell>
                      <TableCell>{stat.totalStudents}</TableCell>
                      <TableCell>
                        <Badge className="bg-green-500">{stat.paidStudents}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="destructive">{stat.unpaidStudents}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{stat.partialStudents}</Badge>
                      </TableCell>
                      <TableCell>₹{stat.totalExpected.toLocaleString()}</TableCell>
                      <TableCell className="text-green-500 font-medium">
                        ₹{stat.totalCollected.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-red-500 font-medium">
                        ₹{stat.totalPending.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <div className={`flex items-center gap-2 font-bold ${getStatusColor(collectionRate)}`}>
                          {collectionRate >= 50 ? (
                            <TrendingUp className="w-4 h-4" />
                          ) : (
                            <TrendingDown className="w-4 h-4" />
                          )}
                          {getCollectionRate(stat.totalCollected, stat.totalExpected)}
                        </div>
                      </TableCell>
                    </motion.tr>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
