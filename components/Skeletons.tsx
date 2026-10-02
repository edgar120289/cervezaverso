/**
 * Skeletons con la misma silueta que los componentes reales (tarjetas de 28px,
 * medios de 20px, píldoras) para que la página no brinque al llegar los datos.
 */

function Bone({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-black/[0.06] motion-reduce:animate-none ${className}`} />;
}

function ProductCardSkeleton() {
  return (
    <div className="flex flex-col rounded-[28px] bg-white p-4 shadow-card" aria-hidden="true">
      <Bone className="aspect-square w-full rounded-[20px]" />
      <div className="flex flex-1 flex-col gap-2 px-1 pt-4">
        <Bone className="h-3 w-2/3 rounded-full" />
        <Bone className="h-4 w-4/5 rounded-full" />
        <Bone className="h-3 w-1/2 rounded-full" />
        <div className="mt-2 flex items-center justify-between">
          <Bone className="h-5 w-16 rounded-full" />
          <Bone className="h-10 w-10 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div role="status" aria-label="Cargando cervezas…">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: count }, (_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

export function ProductDetailSkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-4 pt-6" role="status" aria-label="Cargando cerveza…">
      <Bone className="h-9 w-28 rounded-full" />
      <div className="mt-3 grid gap-6 md:grid-cols-2">
        <div className="rounded-[28px] bg-white p-4 shadow-card">
          <Bone className="aspect-square w-full rounded-[20px]" />
        </div>
        <div className="flex flex-col justify-center gap-5 rounded-[28px] bg-white p-6 shadow-card sm:p-8">
          <div className="space-y-3">
            <Bone className="h-4 w-1/3 rounded-full" />
            <Bone className="h-10 w-4/5 rounded-full" />
            <Bone className="h-4 w-1/4 rounded-full" />
          </div>
          <div className="flex gap-2">
            <Bone className="h-9 w-24 rounded-full" />
            <Bone className="h-9 w-28 rounded-full" />
          </div>
          <div className="flex items-center gap-4">
            <Bone className="h-9 w-24 rounded-full" />
            <Bone className="h-12 w-48 rounded-full" />
          </div>
        </div>
      </div>
      <Bone className="mt-10 h-7 w-48 rounded-full" />
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="space-y-3 rounded-[28px] bg-white p-6 shadow-card">
            <Bone className="h-10 w-10 rounded-full" />
            <Bone className="h-4 w-1/2 rounded-full" />
            <Bone className="h-3 w-full rounded-full" />
            <Bone className="h-3 w-5/6 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
