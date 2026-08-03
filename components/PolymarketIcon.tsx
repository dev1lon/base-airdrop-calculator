// Polymarket brand mark. Source asset is cropped tight to the glyph so `h-*`
// sizes the mark itself — the original had ~20% transparent padding that made
// it render as a speck next to label text.
export function PolymarketIcon({ className = "" }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/polymarket.png"
      alt=""
      width={266}
      height={320}
      className={className}
    />
  );
}
