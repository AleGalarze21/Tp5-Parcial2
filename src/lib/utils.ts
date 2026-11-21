import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const currency = (amount: number) => new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(amount / 100);
export const currencyWholePesos = (amount: number) => new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(amount / 100);
export const compactNumber = (amount: number) => new Intl.NumberFormat("es-AR", { notation: "compact" }).format(amount);
export const dateOnly = (date: Date | number) => new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "America/Argentina/Buenos_Aires",
}).format(date instanceof Date ? date : new Date(date));
export const dateLong = (date: Date | number) => new Intl.DateTimeFormat("es-AR", {
  dateStyle: "full",
  timeZone: "America/Argentina/Buenos_Aires",
}).format(date instanceof Date ? date : new Date(date));
export const argentinaDateKey = (date: Date) => new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Argentina/Buenos_Aires",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
}).format(date);
export const formatInvoiceNumber = (pointOfSale: number, number: number) => `${String(pointOfSale).padStart(4, "0")}-${String(number).padStart(8, "0")}`;
export const formatReceiptNumber = (number: number) => `R 0001-${String(number).padStart(8, "0")}`;
export const dateTime = (date: Date | number) => new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  timeZone: "America/Argentina/Buenos_Aires",
}).format(date instanceof Date ? date : new Date(date));
