import { redirect } from "next/navigation";

// J2: the free pre-signup check lives at /scan; this is the address people are sent to.
export default async function FreeReportPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const url = typeof params.url === "string" ? params.url : "";
  redirect(url ? `/scan?url=${encodeURIComponent(url)}` : "/scan");
}
