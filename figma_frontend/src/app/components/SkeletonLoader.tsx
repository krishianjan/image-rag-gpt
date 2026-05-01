export default function SkeletonLoader() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navbar Skeleton */}
      <div className="h-[72px] bg-white/95 backdrop-blur-md border-b border-slate-100 fixed top-0 left-0 right-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-200 rounded-lg animate-pulse" />
            <div className="w-24 h-5 bg-slate-200 rounded animate-pulse" />
          </div>
          <div className="hidden lg:flex gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="w-16 h-4 bg-slate-200 rounded animate-pulse" />
            ))}
          </div>
          <div className="flex gap-3">
            <div className="w-32 h-9 bg-slate-200 rounded-lg animate-pulse" />
            <div className="w-24 h-9 bg-slate-200 rounded-lg animate-pulse" />
          </div>
        </div>
      </div>

      {/* Hero Skeleton */}
      <div className="pt-24 min-h-screen flex items-center justify-center px-6">
        <div className="max-w-5xl mx-auto text-center w-full">
          <div className="mb-8 flex justify-center">
            <div className="w-64 h-8 bg-slate-200 rounded-full animate-pulse" />
          </div>
          <div className="space-y-4 mb-6">
            <div className="w-full max-w-2xl mx-auto h-16 bg-slate-200 rounded-xl animate-pulse" />
            <div className="w-full max-w-xl mx-auto h-16 bg-slate-200 rounded-xl animate-pulse" />
            <div className="w-full max-w-2xl mx-auto h-16 bg-slate-200 rounded-xl animate-pulse" />
          </div>
          <div className="w-full max-w-2xl mx-auto h-20 bg-slate-200 rounded-xl animate-pulse mb-8" />
          <div className="flex justify-center gap-4 mb-12">
            <div className="w-48 h-12 bg-slate-200 rounded-lg animate-pulse" />
            <div className="w-40 h-12 bg-slate-200 rounded-lg animate-pulse" />
          </div>
          <div className="w-full h-96 bg-slate-200 rounded-2xl animate-pulse" />
        </div>
      </div>
    </div>
  );
}
