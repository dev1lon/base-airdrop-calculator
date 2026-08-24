// Thin status strip above the header. Deliberately one line tall: it is a
// status announcement, not a call to action — the mint button already sits in
// the share section.
export function TopNotice() {
  return (
    <div className="w-full bg-base-blue px-4 py-1.5 text-center text-[12px] font-medium leading-snug text-white sm:text-[13px]">
      <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-base-green align-middle" />
      Minting is live again — you can mint your card
    </div>
  );
}
