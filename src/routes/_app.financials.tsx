import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { TopBar } from "../components/TopBar";
import { api, FinancialDashboardApi } from "../lib/api";
import { useAppSelector } from "../store/hooks";

export const Route = createFileRoute("/_app/financials")({
  head: () => ({
    meta: [
      { title: "Financials · SaleSync AI" },
      { name: "description", content: "Track won-deal revenue and sales performance." },
    ],
  }),
  component: FinancialDashboard,
});

type Period = "30d" | "90d" | "ytd" | "all" | "custom";

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function periodDates(period: Period) {
  const today = new Date();
  if (period === "all" || period === "custom") return { from: "", to: "" };
  const from = new Date(today);
  if (period === "30d") from.setDate(today.getDate() - 29);
  if (period === "90d") from.setDate(today.getDate() - 89);
  if (period === "ytd") from.setMonth(0, 1);
  return { from: isoDate(from), to: isoDate(today) };
}

function formatMoney(value: string | number, currency: string) {
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

function FinancialDashboard() {
  const token = useAppSelector((state) => state.app.auth.accessToken);
  const team = useAppSelector((state) => state.app.team);
  const [data, setData] = useState<FinancialDashboardApi | null>(null);
  const [period, setPeriod] = useState<Period>("ytd");
  const initial = periodDates("ytd");
  const [fromDate, setFromDate] = useState(initial.from);
  const [toDate, setToDate] = useState(initial.to);
  const [currency, setCurrency] = useState("PKR");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!token || !team.id) return;
    setLoading(true);
    setError("");
    try {
      const result = await api.getFinancialDashboard(
        token,
        team.id,
        fromDate || undefined,
        toDate || undefined,
      );
      setData(result.data);
      const currencies = Object.keys(result.data.summary.revenue);
      if (currencies.length) {
        setCurrency((current) => (currencies.includes(current) ? current : currencies[0]));
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not load financial data");
    } finally {
      setLoading(false);
    }
  }, [token, team.id, fromDate, toDate]);

  useEffect(() => {
    void load();
  }, [load]);

  function choosePeriod(next: Period) {
    setPeriod(next);
    if (next !== "custom") {
      const dates = periodDates(next);
      setFromDate(dates.from);
      setToDate(dates.to);
    }
  }

  const currencies = useMemo(() => {
    const values = new Set(Object.keys(data?.summary.revenue || {}));
    data?.won_deals.forEach((deal) => values.add(deal.currency));
    return [...values];
  }, [data]);
  const visibleDeals = data?.won_deals.filter((deal) => deal.currency === currency) || [];
  const chartData =
    data?.monthly_revenue.map((row) => ({
      month: new Date(`${row.month}-01T00:00:00`).toLocaleDateString("en-PK", {
        month: "short",
        year: "2-digit",
      }),
      revenue: Number(row.revenue[currency] || 0),
    })) || [];
  const ownerRows =
    data?.owner_performance
      .filter((owner) => Number(owner.revenue[currency] || 0) > 0)
      .map((owner) => ({
        ...owner,
        selectedCurrencyDeals: visibleDeals.filter((deal) => deal.owner_name === owner.owner_name)
          .length,
      })) || [];

  function exportCsv() {
    const rows = [
      ["Deal", "Company", "Owner", "Revenue", "Currency", "Closed date", "Sales cycle days"],
      ...visibleDeals.map((deal) => [
        deal.name,
        deal.company_name,
        deal.owner_name,
        deal.amount,
        deal.currency,
        deal.closed_at.slice(0, 10),
        String(deal.sales_cycle_days),
      ]),
    ];
    const csv = rows
      .map((row) =>
        row
          .map((cell) => {
            const safe = /^[=+\-@]/.test(cell) ? `'${cell}` : cell;
            return `"${safe.replaceAll('"', '""')}"`;
          })
          .join(","),
      )
      .join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `salesync-won-deals-${currency.toLowerCase()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <TopBar title="Financials" />
      <div className="page-shell space-y-4">
        <section className="crm-page-header">
          <div>
            <p className="crm-eyebrow">Revenue performance</p>
            <h1 className="crm-title">Financial dashboard</h1>
            <p className="crm-subtitle">Realized revenue from successfully closed deals.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {currencies.length > 1 && (
              <select
                className="field-control h-9 w-auto"
                value={currency}
                onChange={(event) => setCurrency(event.target.value)}
              >
                {currencies.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            )}
            <button
              type="button"
              className="secondary-action"
              onClick={exportCsv}
              disabled={!visibleDeals.length}
            >
              Export CSV
            </button>
            <Link to="/deals" className="primary-action">
              Manage deals
            </Link>
          </div>
        </section>

        <section className="section-panel flex flex-wrap items-center gap-2 px-4 py-3">
          {(["30d", "90d", "ytd", "all"] as Period[]).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => choosePeriod(item)}
              className={`rounded px-3 py-1.5 text-xs font-semibold ${period === item ? "bg-primary text-white" : "text-on-surface-variant hover:bg-surface-container"}`}
            >
              {item === "ytd" ? "Year to date" : item === "all" ? "All time" : item.toUpperCase()}
            </button>
          ))}
          <span className="mx-1 h-5 w-px bg-outline-variant" />
          <input
            aria-label="From date"
            type="date"
            className="field-control h-8 w-auto text-xs"
            value={fromDate}
            onChange={(event) => {
              setPeriod("custom");
              setFromDate(event.target.value);
            }}
          />
          <span className="text-xs text-on-surface-variant">to</span>
          <input
            aria-label="To date"
            type="date"
            className="field-control h-8 w-auto text-xs"
            value={toDate}
            onChange={(event) => {
              setPeriod("custom");
              setToDate(event.target.value);
            }}
          />
        </section>

        {error && (
          <div className="rounded border border-error/30 bg-error/5 px-4 py-3 text-sm text-error">
            {error}
          </div>
        )}
        {loading && !data ? (
          <div className="section-panel p-8 text-center text-sm text-on-surface-variant">
            Loading financial data…
          </div>
        ) : (
          data && (
            <>
              <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                <Metric
                  label="Won revenue"
                  value={formatMoney(data.summary.revenue[currency] || 0, currency)}
                  trend={data.summary.revenue_growth[currency]}
                />
                <Metric label="Won deals" value={visibleDeals.length} />
                <Metric
                  label="Average deal"
                  value={formatMoney(data.summary.average_deal_size[currency] || 0, currency)}
                />
                <Metric label="Win rate" value={`${data.summary.win_rate}%`} />
                <Metric
                  label="Average sales cycle"
                  value={`${data.summary.average_sales_cycle_days} days`}
                />
              </section>

              <section className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
                <div className="section-panel p-4">
                  <div className="mb-4">
                    <h2 className="text-sm font-bold">Revenue trend</h2>
                    <p className="text-xs text-on-surface-variant">
                      Won revenue by close month in {currency}
                    </p>
                  </div>
                  <div className="h-64">
                    {chartData.length ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ left: 8, right: 8 }}>
                          <defs>
                            <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#2563eb" stopOpacity={0.28} />
                              <stop offset="100%" stopColor="#2563eb" stopOpacity={0.02} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid stroke="#e2e8f0" vertical={false} />
                          <XAxis
                            dataKey="month"
                            tick={{ fontSize: 11 }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <YAxis
                            tick={{ fontSize: 11 }}
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={(value) =>
                              Intl.NumberFormat("en-PK", { notation: "compact" }).format(value)
                            }
                          />
                          <Tooltip formatter={(value) => formatMoney(Number(value), currency)} />
                          <Area
                            type="monotone"
                            dataKey="revenue"
                            stroke="#2563eb"
                            strokeWidth={2}
                            fill="url(#revenueFill)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <Empty text="No won revenue in this period." />
                    )}
                  </div>
                </div>

                <div className="section-panel overflow-hidden">
                  <div className="border-b border-outline-variant px-4 py-3">
                    <h2 className="text-sm font-bold">Revenue by owner</h2>
                    <p className="text-xs text-on-surface-variant">
                      Closed-won contribution in {currency}
                    </p>
                  </div>
                  <div className="divide-y divide-outline-variant">
                    {ownerRows.slice(0, 8).map((owner) => (
                      <div
                        key={owner.owner_id || "unassigned"}
                        className="flex items-center justify-between px-4 py-3"
                      >
                        <div>
                          <p className="text-sm font-semibold">{owner.owner_name}</p>
                          <p className="text-xs text-on-surface-variant">
                            {owner.selectedCurrencyDeals} won deals
                          </p>
                        </div>
                        <p className="text-sm font-bold tabular-nums">
                          {formatMoney(owner.revenue[currency] || 0, currency)}
                        </p>
                      </div>
                    ))}
                    {!ownerRows.length && <Empty text="No owner revenue yet." />}
                  </div>
                </div>
              </section>

              <section className="section-panel overflow-hidden">
                <div className="flex items-center justify-between border-b border-outline-variant px-4 py-3">
                  <div>
                    <h2 className="text-sm font-bold">Successful deals</h2>
                    <p className="text-xs text-on-surface-variant">
                      Auditable ledger of closed-won revenue in {currency}
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-on-surface-variant">
                    {visibleDeals.length} records
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px] text-left text-xs">
                    <thead className="bg-surface-container text-[10px] uppercase tracking-wider text-on-surface-variant">
                      <tr>
                        <th className="px-4 py-2.5">Deal</th>
                        <th className="px-4 py-2.5">Company</th>
                        <th className="px-4 py-2.5">Owner</th>
                        <th className="px-4 py-2.5">Closed</th>
                        <th className="px-4 py-2.5">Cycle</th>
                        <th className="px-4 py-2.5 text-right">Revenue</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant">
                      {visibleDeals.map((deal) => (
                        <tr key={deal.id} className="hover:bg-surface-container/50">
                          <td className="px-4 py-3 font-semibold">{deal.name}</td>
                          <td className="px-4 py-3">{deal.company_name}</td>
                          <td className="px-4 py-3 text-on-surface-variant">{deal.owner_name}</td>
                          <td className="px-4 py-3 tabular-nums">
                            {new Date(deal.closed_at).toLocaleDateString("en-PK")}
                          </td>
                          <td className="px-4 py-3 tabular-nums">{deal.sales_cycle_days} days</td>
                          <td className="px-4 py-3 text-right font-bold tabular-nums">
                            {formatMoney(deal.amount, deal.currency)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {!visibleDeals.length && (
                    <Empty text="No successful deals match this period and currency." />
                  )}
                </div>
              </section>
            </>
          )
        )}
      </div>
    </>
  );
}

function Metric({
  label,
  value,
  trend,
}: {
  label: string;
  value: string | number;
  trend?: number | null;
}) {
  return (
    <div className="section-panel px-4 py-3">
      <p className="text-xs font-medium text-on-surface-variant">{label}</p>
      <div className="mt-1 flex items-end justify-between gap-2">
        <p className="text-xl font-bold tabular-nums">{value}</p>
        {trend !== undefined && trend !== null && (
          <span
            className={`text-xs font-semibold ${trend >= 0 ? "text-emerald-700" : "text-error"}`}
          >
            {trend >= 0 ? "+" : ""}
            {trend}%
          </span>
        )}
      </div>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="flex h-full min-h-24 items-center justify-center p-5 text-center text-xs text-on-surface-variant">
      {text}
    </div>
  );
}
