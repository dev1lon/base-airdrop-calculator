export function Header() {
  return (
    <header className="border-b border-base-border/60">
      <div className="mx-auto max-w-6xl px-6 py-5 flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/coin.png"
          alt="Base"
          width={28}
          height={28}
          className="rounded-full"
        />
        <span className="font-semibold tracking-wide">BASE AIRDROP CALCULATOR</span>
      </div>
    </header>
  );
}
