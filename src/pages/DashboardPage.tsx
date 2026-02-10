import { useEffect, useState, useCallback } from 'react';
import { wpLeadsApi } from '@/db/wpLeadsApi';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Legend, Cell
} from 'recharts';
import {
  Users, CheckCircle, Clock, AlertCircle,
  TrendingUp, Activity, Settings
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';

/* ─── Brand Colors ─── */
const BRAND = {
  primary: '#1F86E0',
  dark: '#2C313A',
  white: '#FFFFFF',
  // Dark theme palette derived from brand
  bg: '#1A1D2E',
  cardBg: '#222639',
  cardBorder: '#2E3348',
  textMuted: '#8B8FA3',
  accent: '#1F86E0',
  accentCyan: '#2DD4BF',
};

const PIPELINE_COLORS = ['#1F86E0', '#2DD4BF', '#0F4880', '#60A5FA'];

/* ─── Framer Motion Variants ─── */
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1, y: 0,
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }
  }
};

/* ─── Custom Tooltip ─── */
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: BRAND.cardBg,
        border: `1px solid ${BRAND.cardBorder}`,
        borderRadius: '12px',
        padding: '12px 16px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
      }}>
        <p style={{ color: BRAND.white, fontWeight: 600, marginBottom: 4 }}>{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ color: entry.color || BRAND.accentCyan, fontSize: 13 }}>
            {entry.name}: <strong>{entry.value}</strong>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

/* ─── Stat Card Component ─── */
const StatCard = ({ title, value, icon: Icon, accentColor, subtitle, trend, index }: any) => (
  <motion.div
    variants={itemVariants}
    whileHover={{
      scale: 1.03,
      y: -4,
      transition: { duration: 0.2 }
    }}
    className="relative group cursor-pointer"
  >
    <div
      className="rounded-2xl p-5 md:p-6 transition-all duration-300 overflow-hidden"
      style={{
        background: BRAND.cardBg,
        border: `1px solid ${BRAND.cardBorder}`,
      }}
    >
      {/* Accent top border glow */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px] opacity-70 group-hover:opacity-100 transition-opacity"
        style={{ background: `linear-gradient(90deg, ${accentColor}, transparent)` }}
      />

      {/* Header row: icon + title + trend */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className="p-2.5 rounded-xl transition-all duration-300 group-hover:scale-110"
            style={{ background: `${accentColor}20`, border: `1px solid ${accentColor}30` }}
          >
            <Icon className="h-5 w-5" style={{ color: accentColor }} />
          </div>
          <span style={{ color: BRAND.textMuted }} className="text-sm font-medium">{title}</span>
        </div>
        {trend && (
          <span
            className="text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1"
            style={{
              color: accentColor,
              background: `${accentColor}15`,
            }}
          >
            <TrendingUp className="w-3 h-3" />
            {trend}
          </span>
        )}
      </div>

      {/* Value */}
      <div className="mt-2">
        <span className="text-3xl md:text-4xl font-bold tracking-tight" style={{ color: BRAND.white }}>
          {value}
        </span>
        <p className="text-xs mt-1.5" style={{ color: BRAND.textMuted }}>{subtitle}</p>
      </div>

      {/* Background decoration */}
      <div className="absolute -right-4 -bottom-4 opacity-0 group-hover:opacity-[0.06] transition-opacity duration-500">
        <Icon className="w-28 h-28" style={{ color: accentColor }} />
      </div>
    </div>
  </motion.div>
);

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
      // Trigger chart re-animation
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

  /* ─── Chart Data ─── */
  const sourceData = stats ? [
    { name: 'Facebook', value: stats.bySource.facebook },
    { name: 'LinkedIn', value: stats.bySource.linkedin },
    { name: 'Form', value: stats.bySource.form },
    { name: 'SEO', value: stats.bySource.seo },
    { name: 'Website', value: stats.bySource.website },
  ] : [];

  const pipelineData = stats ? [
    {
      name: 'Pending',
      completed: stats.completed,
      pending: stats.pending,
      remainder: stats.remainder,
    },
    {
      name: 'In Progress',
      completed: Math.round(stats.completed * 0.7),
      pending: Math.round(stats.pending * 1.2),
      remainder: Math.round(stats.remainder * 0.5),
    },
    {
      name: 'Qualified',
      completed: Math.round(stats.completed * 0.4),
      pending: Math.round(stats.pending * 0.8),
      remainder: Math.round(stats.remainder * 1.3),
    },
  ] : [];

  /* ─── Loading State ─── */
  if (loading) {
    return (
      <div className="p-4 md:p-8 space-y-8 min-h-screen" style={{ background: BRAND.bg }}>
        <div className="flex items-center space-x-4">
          <Skeleton className="h-12 w-12 rounded-full" style={{ background: BRAND.cardBg }} />
          <div className="space-y-2">
            <Skeleton className="h-4 w-[250px]" style={{ background: BRAND.cardBg }} />
            <Skeleton className="h-4 w-[200px]" style={{ background: BRAND.cardBg }} />
          </div>
        </div>
        <div className="grid gap-4 md:gap-6 grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-40 w-full rounded-2xl" style={{ background: BRAND.cardBg }} />
          ))}
        </div>
        <div className="grid gap-4 md:gap-6 md:grid-cols-2">
          <Skeleton className="h-[380px] w-full rounded-2xl" style={{ background: BRAND.cardBg }} />
          <Skeleton className="h-[380px] w-full rounded-2xl" style={{ background: BRAND.cardBg }} />
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
      style={{ background: BRAND.bg }}
    >
      {/* ─── Header ─── */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight" style={{ color: BRAND.white }}>
            Dashboard
          </h1>
          <p className="mt-1 text-sm md:text-base" style={{ color: BRAND.textMuted }}>
            Real-time visibility into your marketing performance
          </p>
        </div>
        <button
          className="flex items-center gap-2 text-sm font-medium px-4 py-2.5 rounded-xl transition-all duration-300 hover:scale-105"
          style={{
            background: BRAND.cardBg,
            border: `1px solid ${BRAND.cardBorder}`,
            color: BRAND.textMuted,
          }}
        >
          <Settings className="w-4 h-4" />
          <span>Services</span>
        </button>
      </motion.div>

      {/* ─── Stats Cards ─── */}
      <div className="grid gap-4 md:gap-6 grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Leads Acquired"
          value={stats?.total || 0}
          icon={Users}
          accentColor={BRAND.accentCyan}
          subtitle="All time leads captured"
          trend="+12%"
          index={0}
        />
        <StatCard
          title="Deals Closed"
          value={stats?.completed || 0}
          icon={CheckCircle}
          accentColor={BRAND.primary}
          subtitle="Successfully converted"
          trend="+5%"
          index={1}
        />
        <StatCard
          title="Conversion Rate"
          value={stats?.total ? `${Math.round((stats.completed / stats.total) * 100)}%` : '0%'}
          icon={Activity}
          accentColor={BRAND.accentCyan}
          subtitle="Deals closed ratio"
          index={2}
        />
        <StatCard
          title="Pipeline Value"
          value={stats?.pending || 0}
          icon={Clock}
          accentColor={BRAND.primary}
          subtitle="Active opportunities"
          trend="+3%"
          index={3}
        />
      </div>

      {/* ─── Charts Row ─── */}
      <div className="grid gap-4 md:gap-6 md:grid-cols-2">

        {/* Lead Volume Trend - Area Chart */}
        <motion.div
          variants={itemVariants}
          className="rounded-2xl p-5 md:p-8 transition-all duration-300 hover:shadow-2xl"
          style={{
            background: BRAND.cardBg,
            border: `1px solid ${BRAND.cardBorder}`,
          }}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold" style={{ color: BRAND.white }}>Lead Volume Trend</h3>
              <p className="text-xs mt-1" style={{ color: BRAND.textMuted }}>Source distribution over time</p>
            </div>
            <div
              className="p-2.5 rounded-xl"
              style={{ background: `${BRAND.primary}20`, border: `1px solid ${BRAND.primary}30` }}
            >
              <TrendingUp className="w-5 h-5" style={{ color: BRAND.primary }} />
            </div>
          </div>

          <div className="h-[280px] md:h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart key={chartKey} data={sourceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={BRAND.accentCyan} stopOpacity={0.4} />
                    <stop offset="50%" stopColor={BRAND.primary} stopOpacity={0.15} />
                    <stop offset="100%" stopColor={BRAND.bg} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="strokeGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor={BRAND.accentCyan} />
                    <stop offset="100%" stopColor={BRAND.primary} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={BRAND.cardBorder} />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: BRAND.textMuted, fontSize: 11 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: BRAND.textMuted, fontSize: 11 }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="url(#strokeGradient)"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#areaGradient)"
                  isAnimationActive={true}
                  animationBegin={300}
                  animationDuration={2000}
                  animationEasing="ease-out"
                  dot={{ fill: BRAND.accentCyan, strokeWidth: 2, stroke: BRAND.cardBg, r: 4 }}
                  activeDot={{ fill: BRAND.accentCyan, strokeWidth: 3, stroke: BRAND.white, r: 6 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Pipeline Stages - Horizontal Bar Chart */}
        <motion.div
          variants={itemVariants}
          className="rounded-2xl p-5 md:p-8 transition-all duration-300 hover:shadow-2xl"
          style={{
            background: BRAND.cardBg,
            border: `1px solid ${BRAND.cardBorder}`,
          }}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold" style={{ color: BRAND.white }}>Pipeline Stages</h3>
              <p className="text-xs mt-1" style={{ color: BRAND.textMuted }}>Lead distribution by stage</p>
            </div>
            <div className="flex items-center gap-4 text-xs" style={{ color: BRAND.textMuted }}>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: BRAND.primary }} />
                Completed
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: BRAND.accentCyan }} />
                Pending
              </span>
              <span className="flex items-center gap-1.5 hidden sm:flex">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#0F4880' }} />
                Remainder
              </span>
            </div>
          </div>

          <div className="h-[280px] md:h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                key={chartKey + 1}
                data={pipelineData}
                layout="vertical"
                margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
                barGap={2}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={BRAND.cardBorder} />
                <XAxis
                  type="number"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: BRAND.textMuted, fontSize: 11 }}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: BRAND.textMuted, fontSize: 12 }}
                  width={80}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: `${BRAND.white}05` }} />
                <Bar
                  dataKey="completed"
                  name="Completed"
                  fill={BRAND.primary}
                  radius={[0, 6, 6, 0]}
                  isAnimationActive={true}
                  animationBegin={400}
                  animationDuration={1800}
                  animationEasing="ease-out"
                  barSize={20}
                />
                <Bar
                  dataKey="pending"
                  name="Pending"
                  fill={BRAND.accentCyan}
                  radius={[0, 6, 6, 0]}
                  isAnimationActive={true}
                  animationBegin={600}
                  animationDuration={1800}
                  animationEasing="ease-out"
                  barSize={20}
                />
                <Bar
                  dataKey="remainder"
                  name="Remainder"
                  fill="#0F4880"
                  radius={[0, 6, 6, 0]}
                  isAnimationActive={true}
                  animationBegin={800}
                  animationDuration={1800}
                  animationEasing="ease-out"
                  barSize={20}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Bottom legend for mobile */}
          <div className="flex flex-wrap items-center justify-center gap-4 mt-4 text-xs sm:hidden" style={{ color: BRAND.textMuted }}>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: BRAND.primary }} />
              Completed
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: BRAND.accentCyan }} />
              Pending
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#0F4880' }} />
              Remainder
            </span>
          </div>
        </motion.div>
      </div>

      {/* ─── CTA Banner ─── */}
      <motion.div
        variants={itemVariants}
        whileHover={{ scale: 1.01, transition: { duration: 0.2 } }}
        className="rounded-2xl p-6 md:p-10 text-white relative overflow-hidden cursor-pointer"
        style={{
          background: `linear-gradient(135deg, ${BRAND.primary} 0%, #2563EB 50%, #1E40AF 100%)`,
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
              background: BRAND.white,
              color: BRAND.primary,
              border: `2px solid transparent`,
            }}
          >
            Get Started
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
