export function getPublicShareUrl(leadId: string): string {
  if (typeof window === "undefined") return `/share/${leadId}`;
  const envUrl = (import.meta as any).env?.VITE_PUBLIC_URL;
  const base = envUrl ? envUrl.replace(/\/$/, "") : window.location.origin;
  return `${base}/share/${leadId}`;
}
