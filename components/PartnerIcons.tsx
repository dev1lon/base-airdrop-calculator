// Artwork for the two game pills (header + footer). Both sources are square
// renders, so they get the same circular crop as the Base coin mark — a raw
// square render reads as a sticker glued next to the label text.
const ICON = "shrink-0 rounded-full object-cover";

export function SnakeGameIcon({ className = "" }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/snake.png"
      alt=""
      width={96}
      height={96}
      className={`${ICON} ${className}`}
    />
  );
}

export function RugPullRunIcon({ className = "" }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/rugpullrun.png"
      alt=""
      width={96}
      height={96}
      className={`${ICON} ${className}`}
    />
  );
}
