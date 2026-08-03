// Polymarket brand mark: white pennant on the brand-blue tile. Hardcoded blue
// rather than currentColor so it reads the same in the header pill (blue text)
// and the footer link (dark text).
export function PolymarketIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 30 40"
      role="img"
      aria-label="Polymarket"
      className={className}
    >
      <rect width="30" height="40" rx="3" fill="#2D4EFF" />
      <path
        d="M26 2.5 L26 37.5 L3.5 34.5 L21 20.5 L3.5 5.5 Z"
        fill="#fff"
        strokeLinejoin="round"
        stroke="#fff"
        strokeWidth="1.2"
      />
    </svg>
  );
}
