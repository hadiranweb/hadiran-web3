export function ListingGallery({ urls, title }: { urls: string[]; title: string }) {
  if (!urls.length) return null;
  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
      <div className="flex snap-x snap-mandatory gap-2 overflow-x-auto p-2">
        {urls.map((url) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={url}
            src={url}
            alt={title}
            className="h-64 w-full max-w-xl shrink-0 snap-center rounded-2xl object-cover"
          />
        ))}
      </div>
      {urls.length > 1 ? (
        <p className="px-4 pb-3 text-xs text-slate-500">{urls.length} تصویر — بکشید</p>
      ) : null}
    </div>
  );
}
