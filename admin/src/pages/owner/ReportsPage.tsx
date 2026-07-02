import { useMemo } from 'react';
import { useParams } from 'react-router';
import { TrendingUp, DollarSign, CalendarCheck, BarChart3 } from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useApiQuery } from '../../hooks/useApi';
import { QUERY_KEYS } from '../../config/queryKeys';
import { API_ENDPOINTS } from '../../constants';

// Types 
interface MonthData {
  year: string;
  month: string;
  revenue: number;
  count: number;
}

interface AnalyticsResponse {
  months: MonthData[];
}

const MONTH_NAMES: Record<string, string> = {
  '01': 'Jan', '02': 'Feb', '03': 'Mar', '04': 'Apr',
  '05': 'May', '06': 'Jun', '07': 'Jul', '08': 'Aug',
  '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Dec',
};

// Custom Tooltip
interface TooltipProps {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}

function CustomTooltip({ active, payload, label }: TooltipProps) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-md border bg-card px-4 py-3 shadow-lg">
        <p className="text-sm font-semibold text-zinc-800">{label}</p>
        <p className="text-sm text-emerald-600">
          ₹{(payload[0].value).toLocaleString('en-IN')}
        </p>
      </div>
    );
  }
  return null;
}

function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  accent,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ElementType;
  accent: string;
}) {
  return (
    <div className="rounded-md border p-6">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-zinc-500">{title}</p>
          <p className="text-3xl font-bold tracking-tight text-zinc-900">{value}</p>
          <p className="text-xs text-zinc-400">{subtitle}</p>
        </div>
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${accent}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  );
}

export default function ReportsPage() {
  const { venueId } = useParams<{ venueId: string }>();

  const { data, isLoading } = useApiQuery<AnalyticsResponse>(
    QUERY_KEYS.OWNER_ANALYTICS(venueId!),
    { method: 'GET', url: `${API_ENDPOINTS.OWNER_ANALYTICS}/${venueId!}` },
    { staleTime: 5 * 60 * 1000, enabled: !!venueId }
  );

  const months = useMemo(() => data?.months ?? [], [data]);

  const chartData = useMemo(
    () =>
      months.map((m) => ({
        label: `${MONTH_NAMES[m.month] ?? m.month} '${m.year.slice(2)}`,
        revenue: m.revenue,
        bookings: m.count,
      })),
    [months]
  );

  const totalRevenue = useMemo(() => months.reduce((acc, m) => acc + m.revenue, 0), [months]);
  const totalBookings = useMemo(() => months.reduce((acc, m) => acc + m.count, 0), [months]);
  const avgMonthlyRevenue = useMemo(
    () => (months.length > 0 ? Math.round(totalRevenue / months.length) : 0),
    [totalRevenue, months]
  );

  return (
    <div className="space-y-8 p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Financial Reports</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Revenue and booking performance — completed bookings only
          </p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900">
          <BarChart3 className="h-5 w-5 text-white" />
        </div>
      </div>

      {/* Metric Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-2xl bg-zinc-100" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <MetricCard
            title="Total Revenue"
            value={`₹${totalRevenue.toLocaleString('en-IN')}`}
            subtitle="All completed bookings"
            icon={DollarSign}
            accent="bg-emerald-500"
          />
          <MetricCard
            title="Total Bookings"
            value={totalBookings.toLocaleString()}
            subtitle="Completed transactions"
            icon={CalendarCheck}
            accent="bg-blue-500"
          />
          <MetricCard
            title="Avg Monthly Revenue"
            value={`₹${avgMonthlyRevenue.toLocaleString('en-IN')}`}
            subtitle={`Over ${months.length} active months`}
            icon={TrendingUp}
            accent="bg-violet-500"
          />
        </div>
      )}

      {/* Chart */}
      <div className="rounded-md border p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900">Monthly Revenue</h2>
            <p className="text-sm text-zinc-400">Revenue trend from completed bookings</p>
          </div>
        </div>

        {isLoading ? (
          <div className="h-72 animate-pulse rounded-xl bg-zinc-100" />
        ) : chartData.length === 0 ? (
          <div className="flex h-72 flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-zinc-200">
            <BarChart3 className="h-10 w-10 text-zinc-300" />
            <p className="text-sm text-zinc-400">No completed bookings yet</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={288}>
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f4f5f7" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 12, fill: '#9ca3af' }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tickFormatter={(v: number) => `₹${(v / 1000).toFixed(0)}k`}
                tick={{ fontSize: 12, fill: '#9ca3af' }}
                tickLine={false}
                axisLine={false}
                width={52}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#10b981"
                strokeWidth={2.5}
                fill="url(#revenueGrad)"
                dot={{ r: 4, fill: '#10b981', strokeWidth: 0 }}
                activeDot={{ r: 6, fill: '#10b981', strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Monthly Breakdown Table */}
      {!isLoading && chartData.length > 0 && (
        <div className="rounded-md border overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-100">
            <h2 className="text-sm font-semibold text-zinc-700">Monthly Breakdown</h2>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3">Period</th>
                <th className="px-6 py-3 text-right">Bookings</th>
                <th className="px-6 py-3 text-right">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {[...chartData].reverse().map((row) => (
                <tr key={row.label} className="hover:bg-zinc-50 transition-colors">
                  <td className="px-6 py-3 font-medium text-zinc-900">{row.label}</td>
                  <td className="px-6 py-3 text-right text-zinc-600">{row.bookings}</td>
                  <td className="px-6 py-3 text-right font-semibold text-emerald-600">
                    ₹{row.revenue.toLocaleString('en-IN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
