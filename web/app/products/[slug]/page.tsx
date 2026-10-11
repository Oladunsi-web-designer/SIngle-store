import { Suspense } from "react";

import ProductDetail from "@/components/product-detail";

async function ProductPageContent({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <ProductDetail slug={slug} />;
}

export default function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div aria-busy="true" className="mx-auto min-h-[60vh] w-full max-w-7xl px-5 py-16 sm:px-7" />
      }
    >
      <ProductPageContent params={params} />
    </Suspense>
  );
}
