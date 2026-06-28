"use client";

import { ThirdwebProvider, AutoConnect } from "thirdweb/react";
import { thirdwebClient, wallets } from "@/lib/mint";

// Wraps the app so any component can use thirdweb wallet/transaction hooks.
// AutoConnect silently reconnects a previously-used wallet and connects the
// injected provider when the site runs inside the Base app.
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThirdwebProvider>
      <AutoConnect client={thirdwebClient} wallets={wallets} />
      {children}
    </ThirdwebProvider>
  );
}
