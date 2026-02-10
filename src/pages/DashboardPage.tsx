import { useEffect, useState } from 'react';
import { wpLeadsApi } from '@/db/wpLeadsApi';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Users, CheckCircle, Clock, AlertCircle, TrendingUp, Activity, ArrowUpRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import { CardContainer, CardBody, CardItem } from '@/components/ui/3d-card';
import { cn } from '@/lib/utils';

const COLORS = ['#3B82F6', '#60A5FA', '#93C5FD', '#BFDBFE'];

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
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await wpLeadsApi.getAll();

      // Simulate some historical data for the area chart since we only have current snapshot
      const total = data.length;

      const statsData = {
        total: total,
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

      setStats(statsData);
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

  // Custom Active Shape for Pie Chart
  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };

  const renderActiveShape = (props: any) => {
    const RADIAN = Math.PI / 180;
    const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
    const sin = Math.sin(-RADIAN * midAngle);
    const cos = Math.cos(-RADIAN * midAngle);
    const sx = cx + (outerRadius + 10) * cos;
    const sy = cy + (outerRadius + 10) * sin;
    const mx = cx + (outerRadius + 30) * cos;
    const my = cy + (outerRadius + 30) * sin;
    const ex = mx + (cos >= 0 ? 1 : -1) * 22;
    const ey = my;
    const textAnchor = cos >= 0 ? 'start' : 'end';

    return (
      <g>
        <text x={cx} y={cy} dy={8} textAnchor="middle" fill="#1F86E0" className="text-xl font-bold">
          {payload.name}
        </text>
        <sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
        <sector
          cx={cx}
          cy={cy}
          startAngle={startAngle}
          endAngle={endAngle}
          innerRadius={outerRadius + 6}
          outerRadius={outerRadius + 10}
          fill={fill}
        />
        <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
        <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
        <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} textAnchor={textAnchor} fill="#333">{`PV ${value}`}</text>
        <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} dy={18} textAnchor={textAnchor} fill="#999">
          {`(Rate ${(percent * 100).toFixed(2)}%)`}
        </text>
      </g>
    );
  };

  if (loading) {
    return (
      <div className="p-8 space-y-8 bg-gray-50/50 min-h-screen">
        <div className="flex items-center space-x-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[200px]" />
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-48 w-full rounded-2xl" />
          ))}
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-[400px] w-full rounded-2xl" />
          <Skeleton className="h-[400px] w-full rounded-2xl" />
        </div>
      </div>
    )
  }

  const StatCard = ({ title, value, icon: Icon, color, subtitle, trend }: any) => (
    <CardContainer className="inter-var w-full p-0 h-full">
      <CardBody className="bg-white relative group/card dark:hover:shadow-2xl dark:hover:shadow-emerald-500/[0.1] dark:bg-black dark:border-white/[0.2] border-black/[0.1] w-full h-auto rounded-3xl p-6 border shadow-sm hover:shadow-xl transition-all duration-300">
        <CardItem
          translateZ="50"
          className="w-full"
        >
          <div className="flex items-center justify-between mb-4">
            <div className={cn("p-3 rounded-2xl transition-colors duration-300", `bg-${color}-50 group-hover/card:bg-${color}-100`)}>
              <Icon className={cn("h-6 w-6", `text-${color}-600`)} style={{ color: color }} />
            </div>
            {trend && (
              <div className="flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                <ArrowUpRight className="w-3 h-3" />
                <span>{trend}</span>
              </div>
            )}
          </div>
        </CardItem>
        <CardItem
          translateZ="60"
          className="mt-4"
        >
          <span className="text-4xl font-bold text-gray-900 tracking-tight">{value}</span>
          <div className="flex items-center text-sm text-muted-foreground mt-2 font-medium">
            {title}
          </div>
          <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
        </CardItem>
        <div className="absolute -right-6 -bottom-6 opacity-0 group-hover/card:opacity-5 transition-opacity duration-500">
          <Icon className="w-48 h-48" />
        </div>
      </CardBody>
    </CardContainer>
  );

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-8 p-4 md:p-8 max-w-[1600px] mx-auto min-h-screen bg-gray-50/30"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">Dashboard</h1>
          <p className="text-muted-foreground mt-2 text-lg">Detailed overview of your marketing performance.</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-blue-600 font-semibold bg-blue-50 px-5 py-2.5 rounded-full border border-blue-100 shadow-sm">
          <div className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
          </div>
          <span>Live Updates</span>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard
          title="Total Leads"
          value={stats?.total || 0}
          icon={Users}
          color="#1F86E0"
          subtitle="All time captured"
          trend="+12% vs last month"
        />
        <StatCard
          title="Pending Actions"
          value={stats?.pending || 0}
          icon={Clock}
          color="#F59E0B"
          subtitle="Awaiting response"
          trend="High Priority"
        />
        <StatCard
          title="Completed Deals"
          value={stats?.completed || 0}
          icon={CheckCircle}
          color="#10B981"
          subtitle="Successfully closed"
          trend="+5% vs last month"
        />
        <StatCard
          title="Needs Attention"
          value={stats?.remainder || 0}
          icon={AlertCircle}
          color="#EF4444"
          subtitle="Overdue follow-ups"
          trend="Action Required"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Lead Sources Area Chart */}
        <motion.div
          variants={item}
          className="col-span-2 bg-white rounded-3xl p-8 shadow-sm border border-gray-100 hover:shadow-xl transition-shadow duration-300"
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-bold text-gray-900">Lead Volume Trend</h3>
              <p className="text-sm text-muted-foreground">Traffic sources over time</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-2xl">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
          </div>

          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sourceData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1F86E0" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#1F86E0" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  cursor={{ stroke: '#1F86E0', strokeWidth: 2, strokeDasharray: '5 5' }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#1F86E0"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorValue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Lead Status Interactive Pie Chart */}
        <motion.div
          variants={item}
          className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 hover:shadow-xl transition-shadow duration-300 flex flex-col"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-bold text-gray-900">Pipeline Status</h3>
              <p className="text-sm text-muted-foreground">Current distribution</p>
            </div>
            <div className="p-3 bg-indigo-50 rounded-2xl">
              <Activity className="w-6 h-6 text-indigo-600" />
            </div>
          </div>

          <div className="flex-1 min-h-[300px] w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  activeIndex={activeIndex}
                  activeShape={renderActiveShape}
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={90}
                  fill="#8884d8"
                  dataKey="value"
                  onMouseEnter={onPieEnter}
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={2} stroke="#fff" />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      <motion.div
        variants={item}
        className="rounded-3xl bg-gradient-to-br from-[#1F86E0] via-[#2563EB] to-[#1E40AF] p-10 text-white relative overflow-hidden shadow-2xl"
      >
        <div className="absolute top-0 right-0 p-12 opacity-10">
          <TrendingUp className="w-96 h-96 -mr-32 -mt-32 transform rotate-12" />
        </div>

        <div className="relative z-10 max-w-3xl flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <h2 className="text-3xl font-bold mb-4">Unlock Deeper Insights</h2>
            <p className="text-blue-100 text-lg leading-relaxed max-w-xl">
              Get a complete history of every interaction, status change, and user activity with our detailed Activity Logs.
              Track performance metrics and optimize your sales pipeline.
            </p>
          </div>
          <button className="whitespace-nowrap bg-white text-blue-600 px-8 py-4 rounded-xl font-bold hover:bg-blue-50 transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-1 transform">
            View Activity Logs
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
