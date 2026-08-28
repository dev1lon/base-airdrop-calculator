// Ankr credentials, shared by the bridge lookup and the RPC transport.
//
// The key is domain-restricted in the Ankr dashboard, so it is safe in the
// browser bundle: a request from any other origin comes back with
// "Origin not allowed" (verified from a server-side curl).
export const ANKR_KEY =
  "aa28857240e2e0c174f41020168f4574e42437b8f1157d709ea18dd430b6ade1";

// Advanced API — `ankr_getLogs` scans full history in one paginated call.
export const ANKR_MULTICHAIN_URL = `https://rpc.ankr.com/multichain/${ANKR_KEY}`;

// Plain Base JSON-RPC on the same paid key: higher limits than the public
// endpoints, so it goes first in the transport list.
export const ANKR_BASE_RPC = `https://rpc.ankr.com/base/${ANKR_KEY}`;
