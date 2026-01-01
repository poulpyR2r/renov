import { Metadata } from "next";
import { getSearchMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  return getSearchMetadata({});
}

export default function SearchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
