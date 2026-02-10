import { useEffect, useState } from 'react';
import { wpLeadsApi } from '@/db/wpLeadsApi';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Users, CheckCircle, Clock, AlertCircle, TrendingUp, Activity } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import { CardContainer, CardBody, CardItem } from '@/components/ui/3d-card';

const COLORS = ['#1F86E0', '#0A4F8B', '#3B82F6', '#60A5FA'];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export default function DashboardPage() {
  const [stats, setStats] = useState<{
    total: number;
    pending: number;
    completed: number;
    remainder: number;
    bySource: {
      facebook: number;
      linkedin: number;
      form: number;
      seo: number;
      website: number;
    };
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await wpLeadsApi.getAll();

      const stats = {
        total: data.length,
        pending: data.filter((l: any) => l.status === 'pending').length,
        completed: data.filter((l: any) => l.status === 'completed').length,
        remainder: data.filter((l: any) => l.status === 'remainder').length,
        bySource: {
          facebook: data.filter((l: any) => l.source === 'facebook').length,
          linkedin: data.filter((l: any) => l.source === 'linkedin').length,
          form: data.filter((l: any) => l.source === 'form').length,
          seo: data.filter((l: any) => l.source === 'seo').length,
          website: data.filter((l: any) => l.source === 'website').length,
        }
      };

      setStats(stats);
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const sourceData = stats ? [
    { name: 'Facebook', value: stats.bySource.facebook },
    { name: 'LinkedIn', value: stats.bySource.linkedin },
    { name: 'Form', value: stats.bySource.form },
    { name: 'SEO', value: stats.bySource.seo },
    { name: 'Website', value: stats.bySource.website },
  ] : [];

  const statusData = stats ? [
    { name: 'Pending', value: stats.pending },
    { name: 'Completed', value: stats.completed },
    { name: 'Reminder', value: stats.remainder },
  ] : [];

  if (loading) {
    return (
      <div className="p-8 space-y-8">
        <div className="flex items-center space-x-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[200px]" />
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-40 w-full rounded-xl" />
          ))}
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-[400px] w-full rounded-xl" />
          <Skeleton className="h-[400px] w-full rounded-xl" />
        </div>
      </div>
    )
  }

  const StatCard = ({ title, value, icon: Icon, color, subtitle }: any) => (
    <CardContainer className="inter-var w-full p-0">
      <CardBody className="bg-white relative group/card dark:hover:shadow-2xl dark:hover:shadow-emerald-500/[0.1] dark:bg-black dark:border-white/[0.2] border-black/[0.1] w-full h-auto rounded-xl p-6 border shadow-sm hover:shadow-xl transition-all duration-300">
        <CardItem
          translateZ="50"
          className="text-xl font-bold text-neutral-600 dark:text-white"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-muted-foreground">{title}</span>
            <div className={`p-2 rounded-full bg-${color}-50`}>
              <Icon className={`h-5 w-5 text-${color}-500`} style={{ color: color }} />
            </div>
          </div>
        </CardItem>
        <CardItem
          as="p"
          translateZ="60"
          className="text-neutral-500 text-sm max-w-sm mt-2 dark:text-neutral-300"
        >
          <span className="text-3xl font-bold text-[#2C313A]">{value}</span>
          <div className="flex items-center text-xs text-muted-foreground mt-1">
            {subtitle}
          </div>
        </CardItem>
        <div className="absolute -right-10 -bottom-10 opacity-5 group-hover/card:opacity-10 transition-opacity">
          <Icon className="w-32 h-32" />
        </div>
      </CardBody>
    </CardContainer>
  );

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-8 p-2 md:p-8 max-w-7xl mx-auto"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#2C313A]">Dashboard</h1>
          <p className="text-muted-foreground">Real-time overview of your marketing performance.</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-[#1F86E0] font-medium bg-blue-50 px-4 py-2 rounded-full">
          <Activity className="w-4 h-4" />
          <span>Live Updates Active</span>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Leads"
          value={stats?.total || 0}
          icon={Users}
          color="#1F86E0"
          subtitle="All time leads captured"
        />
        <StatCard
          title="Pending Actions"
          value={stats?.pending || 0}
          icon={Clock}
          color="#F59E0B"
          subtitle="Leads awaiting response"
        />
        <StatCard
          title="Completed"
          value={stats?.completed || 0}
          icon={CheckCircle}
          color="#10B981"
          subtitle="Successfully closed deals"
        />
        <StatCard
          title="Needs Attention"
          value={stats?.remainder || 0}
          icon={AlertCircle}
          color="#EF4444"
          subtitle="Overdue follow-ups"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Leads by Source Bar Chart */}
        <motion.div
          variants={item}
          className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-[#2C313A]">Lead Sources</h3>
              <p className="text-sm text-muted-foreground">Where your traffic comes from</p>
            </div>
            <div className="p-2 bg-blue-50 rounded-lg">
              <TrendingUp className="w-5 h-5 text-[#1F86E0]" />
            </div>
          </div>

          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sourceData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorBar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1F86E0" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#1F86E0" stopOpacity={0.3} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                <Tooltip
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar
                  dataKey="value"
                  fill="url(#colorBar)"
                  radius={[8, 8, 0, 0]}
                  barSize={40}
                  animationDuration={1500}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Leads by Status Pie Chart */}
        <motion.div
          variants={item}
          className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-[#2C313A]">Lead Status</h3>
              <p className="text-sm text-muted-foreground">Current pipeline distribution</p>
            </div>
            <div className="p-2 bg-blue-50 rounded-lg">
              <Activity className="w-5 h-5 text-[#1F86E0]" />
            </div>
          </div>

          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <defs>
                  {statusData.map((entry, index) => (
                    <linearGradient key={`gradient-${index}`} id={`gradient-${index}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={COLORS[index % COLORS.length]} stopOpacity={1} />
                      <stop offset="100%" stopColor={COLORS[index % COLORS.length]} stopOpacity={0.6} />
                    </linearGradient>
                  ))}
                </defs>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={110}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={`url(#gradient-${index})`} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      <motion.div
        variants={item}
        className="rounded-2xl bg-gradient-to-r from-[#1F86E0] to-[#0A4F8B] p-8 text-white relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <TrendingUp className="w-64 h-64 -mr-20 -mt-20 transform rotate-12" />
        </div>

        <div className="relative z-10 max-w-2xl">
          <h2 className="text-2xl font-bold mb-2">Need detailed analytics?</h2>
          <p className="text-blue-100 mb-6">Check out the Activity Logs for a granular view of all system actions and user performance metrics.</p>
          <button className="bg-white text-[#1F86E0] px-6 py-2 rounded-lg font-semibold hover:bg-blue-50 transition-colors shadow-lg">
            View Activity Logs
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
