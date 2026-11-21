"use client";

import { ArcElement, BarElement, CategoryScale, Chart as ChartJS, Legend, LinearScale, Tooltip } from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";
import { compactNumber, currencyWholePesos, dateOnly } from "@/lib/utils";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

export function DashboardCharts({ sales, paymentForms }: { sales: { fecha: string; importe: number }[]; paymentForms: { forma: string; importe: number }[] }) {
  const colors = ["#76b900", "#a8e344", "#65705c"];
  return <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]"><section className="rounded-2xl border border-[var(--border)] bg-white p-5"><div className="mb-5"><h2 className="font-semibold">Ventas diarias</h2><p className="mt-1 text-xs text-[var(--muted)]">Últimos 30 días</p></div><div className="h-64"><Bar data={{ labels: sales.map((row) => dateOnly(new Date(`${row.fecha}T12:00:00-03:00`)).slice(0, 5)), datasets: [{ data: sales.map((row) => row.importe / 100), backgroundColor: "#76b900", borderRadius: 5, maxBarThickness: 20 }] }} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { callbacks: { label: (context) => currencyWholePesos(Number(context.raw) * 100) } } }, scales: { x: { grid: { display: false }, ticks: { maxTicksLimit: 10 } }, y: { grid: { color: "#edf1f2" }, ticks: { callback: (value) => compactNumber(Number(value)) } } } }}/></div></section><section className="rounded-2xl border border-[var(--border)] bg-white p-5"><div className="mb-5"><h2 className="font-semibold">Ventas por forma de pago</h2><p className="mt-1 text-xs text-[var(--muted)]">Mes actual</p></div><div className="mx-auto h-64 max-w-xs"><Doughnut data={{ labels: paymentForms.map((row) => row.forma.replaceAll("_", " ")), datasets: [{ data: paymentForms.map((row) => row.importe / 100), backgroundColor: colors, borderWidth: 0, hoverOffset: 4 }] }} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: "bottom", labels: { usePointStyle: true, padding: 18 } }, tooltip: { callbacks: { label: (context) => `${context.label}: ${currencyWholePesos(Number(context.raw) * 100)}` } } }, cutout: "68%" }}/></div></section></div>;
}
