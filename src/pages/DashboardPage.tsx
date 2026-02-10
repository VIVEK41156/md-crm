import { useEffect, useState, useCallback, useRef } from 'react';
import { wpLeadsApi } from '@/db/wpLeadsApi';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';
import {
  Users, CheckCircle, AlertCircle, TrendingUp, Activity
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/* ─── Color Palette ─── */
const COLORS = {
  primary: '#1F86E0',
  cyan: '#2DD4BF',
  purple: '#A78BFA',
  pink: '#F472B6',
  blue: '#3B82F6',
  lightBlue: '#60A5FA',
  green: '#10B981',
  bg: '#F9FAFB',
  cardBg: '#FFFFFF',
  text: '#2C313A',
  textMuted: '#6B7280',
  border: '#E5E7EB',
};

const PIE_COLORS = [COLORS.blue, COLORS.purple, COLORS.pink, COLORS.cyan];

/* ─── Framer Motion Variants ─── */
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.2 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  show: {
    opacity: 1, y: 0,
    transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }
  }
};

/* ─── Custom Tooltip ─── */
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: COLORS.cardBg,
        border: `1px solid ${COLORS.border}`,
        borderRadius: '12px',
        padding: '12px 16px',
        boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
      }}>
        <p style={{ color: COLORS.text, fontWeight: 600, marginBottom: 6, fontSize: 13 }}>{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ color: entry.color || COLORS.primary, fontSize: 12, marginTop: 2 }}>
            {entry.name}: <strong>{entry.value}</strong>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

/* ─── Mini Bar Chart Component ─── */
const MiniBarChart = ({ data }: { data: number[] }) => {
  const chartData = data.map((value, index) => ({ value, index }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
        <Bar
          dataKey="value"
          fill={COLORS.lightBlue}
          radius={[2, 2, 0, 0]}
          isAnimationActive={true}
          animationDuration={1200}
          animationEasing="ease-out"
        />
      </BarChart>
    </ResponsiveContainer>
  );
};

/* ─── Stat Card Component ─── */
const StatCard = ({ title, value, icon: Icon, subtitle, trend, miniChartData, index }: any) => {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (cardRef.current) {
      gsap.fromTo(
        cardRef.current,
        { opacity: 0, y: 40, rotateX: -15 },
        {
          opacity: 1,
          y: 0,
          rotateX: 0,
          duration: 0.8,
          delay: index * 0.15,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: cardRef.current,
            start: 'top 85%',
            toggleActions: 'play none none reverse',
          }
        }
      );
    }
  }, [index]);

  return (
    <motion.div
      ref={cardRef}
      variants={itemVariants}
      whileHover={{
        scale: 1.02,
        y: -6,
        rotateY: 2,
        transition: { duration: 0.3 }
      }}
      className="relative group cursor-pointer"
      style={{ perspective: '1000px' }}
    >
      <div
        className="rounded-2xl p-5 md:p-6 transition-all duration-300 overflow-hidden border"
        style={{
          background: COLORS.cardBg,
          borderColor: COLORS.border,
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        }}
      >
        {/* Icon and Trend */}
        <div className="flex items-start justify-between mb-4">
          <div
            className="p-2.5 rounded-xl transition-all duration-300 group-hover:scale-110"
            style={{ background: `${COLORS.primary}10`, border: `1px solid ${COLORS.primary}20` }}
          >
            <Icon className="h-5 w-5" style={{ color: COLORS.primary }} />
          </div>
          {trend && (
            <span
              className="text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1"
              style={{
                color: COLORS.green,
                background: `${COLORS.green}15`,
              }}
            >
              {trend}
            </span>
          )}
        </div>

        {/* Value and Mini Chart Row */}
        <div className="flex items-end justify-between gap-4">
          <div className="flex-1">
            <div className="text-3xl md:text-4xl font-bold tracking-tight mb-2" style={{ color: COLORS.text }}>
              {value}
            </div>
            <div className="text-sm font-medium" style={{ color: COLORS.text }}>
              {title}
            </div>
            <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>{subtitle}</p>
          </div>

          {/* Mini Chart */}
          <div className="w-24 h-16 opacity-60 group-hover:opacity-100 transition-opacity">
            <MiniBarChart data={miniChartData} />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

/* ─── Main Dashboard ─── */
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
  const [chartKey, setChartKey] = useState(0);

  const areaChartRef = useRef<HTMLDivElement>(null);
  const pieChartRef = useRef<HTMLDivElement>(null);

  const loadStats = useCallback(async () => {
    try {
      const data = await wpLeadsApi.getAll();

      const statsData = {
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

      setStats(statsData);
      setChartKey(prev => prev + 1);
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  // GSAP Scroll Animations for Charts
  useEffect(() => {
    if (!loading && areaChartRef.current) {
      gsap.fromTo(
        areaChartRef.current,
        { opacity: 0, y: 50, scale: 0.95 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: areaChartRef.current,
            start: 'top 80%',
            toggleActions: 'play none none reverse',
          }
        }
      );
    }

    if (!loading && pieChartRef.current) {
      gsap.fromTo(
        pieChartRef.current,
        { opacity: 0, x: 50, rotateY: -20 },
        {
          opacity: 1,
          x: 0,
          rotateY: 0,
          duration: 1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: pieChartRef.current,
            start: 'top 80%',
            toggleActions: 'play none none reverse',
          }
        }
      );
    }
  }, [loading]);

  /* ─── Chart Data ─── */
  const leadVolumeData = stats ? [
    { name: 'Mon', Contract: stats.bySource.facebook, Payroll: stats.bySource.linkedin, Near: stats.bySource.form },
    { name: 'Tues', Contract: stats.bySource.linkedin, Payroll: stats.bySource.seo, Near: stats.bySource.website },
    { name: 'Wed', Contract: stats.bySource.form, Payroll: stats.bySource.facebook, Near: stats.bySource.linkedin },
    { name: 'Thurs', Contract: stats.bySource.seo, Payroll: stats.bySource.website, Near: stats.bySource.form },
    { name: 'Fri', Contract: stats.bySource.website, Payroll: stats.bySource.facebook, Near: stats.bySource.seo },
  ] : [];

  const pipelineDonutData = stats ? [
    { name: 'Contract', value: stats.completed },
    { name: 'Payroll', value: stats.pending },
    { name: 'Personal', value: stats.remainder },
  ] : [];

  const pipelineBarData = stats ? [
    { name: 'New', value: stats.pending },
    { name: 'Qualified', value: Math.round(stats.pending * 0.7) },
    { name: 'Prioritized', value: stats.completed },
    { name: 'Proposed', value: Math.round(stats.remainder * 0.8) },
    { name: 'Won', value: Math.round(stats.completed * 0.6) },
  ] : [];

  // Mini chart data for stat cards
  const miniChartData1 = [12, 19, 15, 25, 22, 30, 28];
  const miniChartData2 = [8, 12, 10, 18, 15, 22, 20];
  const miniChartData3 = [15, 18, 12, 20, 25, 28, 32];

  /* ─── Loading State ─── */
  if (loading) {
    return (
      <div className="p-4 md:p-8 space-y-8 min-h-screen" style={{ background: COLORS.bg }}>
        <div className="flex items-center space-x-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[200px]" />
          </div>
        </div>
        <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-44 w-full rounded-2xl" />
          ))}
        </div>
        <div className="grid gap-4 md:gap-6 md:grid-cols-2">
          <Skeleton className="h-[420px] w-full rounded-2xl" />
          <Skeleton className="h-[420px] w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6 md:space-y-8 p-4 md:p-8 min-h-screen"
      style={{ background: COLORS.bg }}
    >
      {/* ─── Header ─── */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight" style={{ color: COLORS.text }}>
            Dashboard
          </h1>
          <p className="mt-1 text-sm md:text-base" style={{ color: COLORS.textMuted }}>
            Detailed overview of your marketing performance.
          </p>
        </div>
        <button
          className="flex items-center gap-2 text-sm font-medium px-4 py-2.5 rounded-xl transition-all duration-300 hover:scale-105"
          style={{
            background: COLORS.cardBg,
            border: `1px solid ${COLORS.border}`,
            color: COLORS.primary,
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}
        >
          <div className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
          </div>
          <span>Live Updates</span>
        </button>
      </motion.div>

      {/* ─── Stats Cards ─── */}
      <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Total Leads"
          value={stats?.total || 0}
          icon={Users}
          subtitle="All time captured"
          trend="+45% vs last month"
          miniChartData={miniChartData1}
          index={0}
        />
        <StatCard
          title="Pending Actions"
          value={stats?.pending || 0}
          icon={Activity}
          subtitle="Awaiting response"
          trend="+45% vs last month"
          miniChartData={miniChartData2}
          index={1}
        />
        <StatCard
          title="Completed Deals"
          value={stats?.completed || 0}
          icon={CheckCircle}
          subtitle="Successfully closed"
          trend="Needs Attention"
          miniChartData={miniChartData3}
          index={2}
        />
      </div>

      {/* ─── Charts Row ─── */}
      <div className="grid gap-4 md:gap-6 md:grid-cols-2">

        {/* Lead Volume Trend - Area Chart */}
        <motion.div
          ref={areaChartRef}
          variants={itemVariants}
          className="rounded-2xl p-5 md:p-8 transition-all duration-300 hover:shadow-lg border"
          style={{
            background: COLORS.cardBg,
            borderColor: COLORS.border,
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold" style={{ color: COLORS.text }}>Lead Volume Trend</h3>
              <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>Traffic sources over time</p>
            </div>
            <div
              className="p-2.5 rounded-xl"
              style={{ background: `${COLORS.primary}10`, border: `1px solid ${COLORS.primary}20` }}
            >
              <TrendingUp className="w-5 h-5" style={{ color: COLORS.primary }} />
            </div>
          </div>

          <div className="h-[280px] md:h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart key={chartKey} data={leadVolumeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={COLORS.cyan} stopOpacity={0.4} />
                    <stop offset="100%" stopColor={COLORS.purple} stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={COLORS.border} />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: COLORS.textMuted, fontSize: 11 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: COLORS.textMuted, fontSize: 11 }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: 12, paddingTop: 20 }}
                  iconType="circle"
                />
                <Area
                  type="monotone"
                  dataKey="Contract"
                  stackId="1"
                  stroke={COLORS.cyan}
                  fill={COLORS.cyan}
                  fillOpacity={0.6}
                  isAnimationActive={true}
                  animationDuration={2000}
                  animationEasing="ease-out"
                />
                <Area
                  type="monotone"
                  dataKey="Payroll"
                  stackId="1"
                  stroke={COLORS.purple}
                  fill={COLORS.purple}
                  fillOpacity={0.6}
                  isAnimationActive={true}
                  animationDuration={2000}
                  animationEasing="ease-out"
                />
                <Area
                  type="monotone"
                  dataKey="Near"
                  stackId="1"
                  stroke={COLORS.pink}
                  fill={COLORS.pink}
                  fillOpacity={0.6}
                  isAnimationActive={true}
                  animationDuration={2000}
                  animationEasing="ease-out"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Pipeline Status - Donut + Bar Chart */}
        <motion.div
          ref={pieChartRef}
          variants={itemVariants}
          className="rounded-2xl p-5 md:p-8 transition-all duration-300 hover:shadow-lg border"
          style={{
            background: COLORS.cardBg,
            borderColor: COLORS.border,
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold" style={{ color: COLORS.text }}>Pipeline Status</h3>
              <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>Current distribution</p>
            </div>
            <div
              className="p-2.5 rounded-xl"
              style={{ background: `${COLORS.purple}10`, border: `1px solid ${COLORS.purple}20` }}
            >
              <Activity className="w-5 h-5" style={{ color: COLORS.purple }} />
            </div>
          </div>

          {/* Donut Chart */}
          <div className="h-[180px] w-full mb-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pipelineDonutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={2}
                  dataKey="value"
                  isAnimationActive={true}
                  animationBegin={400}
                  animationDuration={1500}
                  animationEasing="ease-out"
                >
                  {pipelineDonutData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign="middle"
                  align="right"
                  layout="vertical"
                  iconType="circle"
                  wrapperStyle={{ fontSize: 11, paddingLeft: 10 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Bar Chart */}
          <div className="h-[120px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pipelineBarData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={COLORS.border} />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: COLORS.textMuted, fontSize: 10 }}
                  dy={5}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: COLORS.textMuted, fontSize: 10 }}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: `${COLORS.primary}10` }} />
                <Bar
                  dataKey="value"
                  fill={COLORS.lightBlue}
                  radius={[6, 6, 0, 0]}
                  isAnimationActive={true}
                  animationBegin={600}
                  animationDuration={1500}
                  animationEasing="ease-out"
                >
                  {pipelineBarData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* ─── CTA Banner ─── */}
      <motion.div
        variants={itemVariants}
        whileHover={{ scale: 1.01, transition: { duration: 0.2 } }}
        className="rounded-2xl p-6 md:p-10 text-white relative overflow-hidden cursor-pointer"
        style={{
          background: `linear-gradient(135deg, ${COLORS.primary} 0%, #2563EB 50%, #1E40AF 100%)`,
          boxShadow: '0 10px 40px rgba(31, 134, 224, 0.3)',
        }}
      >
        {/* Decorative wave pattern */}
        <div className="absolute top-0 right-0 bottom-0 w-1/2 opacity-10 pointer-events-none">
          <svg viewBox="0 0 400 300" fill="none" className="w-full h-full">
            <path d="M200 0C300 50 350 150 400 300H0C50 200 100 100 200 0Z" fill="white" />
            <path d="M250 50C320 100 380 200 400 300H100C150 200 180 100 250 50Z" fill="white" fillOpacity="0.5" />
          </svg>
        </div>

        <div className="absolute top-4 right-4 md:top-8 md:right-8 opacity-10">
          <TrendingUp className="w-32 h-32 md:w-48 md:h-48 transform rotate-12" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="max-w-xl">
            <h2 className="text-2xl md:text-3xl font-bold mb-3">Unlock Deeper Insights</h2>
            <p className="text-blue-100 text-sm md:text-base leading-relaxed opacity-90">
              Get a complete history of every interaction, status change, and user activity.
              Track performance metrics and optimize your sales pipeline effectively.
            </p>
          </div>
          <button
            className="whitespace-nowrap px-6 md:px-8 py-3 md:py-4 rounded-xl font-bold transition-all duration-300 hover:shadow-xl hover:-translate-y-1 transform text-sm md:text-base"
            style={{
              background: COLORS.cardBg,
              color: COLORS.primary,
              border: `2px solid transparent`,
            }}
          >
            View Activity Logs
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
