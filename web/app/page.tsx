import { Suspense } from "react";

import Storefront from "@/components/storefront";

async function HomeContent({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string }>;
}) {
  const params = await searchParams;
  return (
    <Storefront
      initialCategory={params.category ?? ""}
      initialQuery={params.q ?? ""}
      key={`${params.category ?? ""}:${params.q ?? ""}`}
    />
  );
}

export default function Home({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto min-h-[60vh] w-full max-w-7xl px-5 py-16 sm:px-7">
          <p className="text-sm font-medium text-[#64766a]">Loading Dunfeto collection...</p>
        </div>
      }
    >
      <HomeContent searchParams={searchParams} />
    </Suspense>
  );
}
