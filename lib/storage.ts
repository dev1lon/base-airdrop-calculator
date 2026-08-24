import { upload } from "thirdweb/storage";
import { supabase } from "./supabase";
import { thirdwebClient } from "./mint";

// Card assets are pinned to IPFS through thirdweb. That account has a storage
// quota, and once it runs out every upload fails with "You have reached your
// storage limit…", which killed minting outright. Supabase Storage is the
// fallback so a quota problem degrades to a centralized URL instead of a dead
// mint button. See SUPABASE_BUCKET below for the one-time bucket setup.
export const SUPABASE_BUCKET = "cards";

export type UploadedCard = {
  metadataUri: string;
  imageUri: string;
  // Where the assets actually landed, for logging and for the UI copy.
  storage: "ipfs" | "supabase";
};

export type CardMetadata = {
  name: string;
  description: string;
  image: string;
  attributes: { trait_type: string; value: number }[];
};

// thirdweb surfaces the quota error as a plain string in a few shapes; match on
// the wording rather than a status code, which the SDK does not expose.
export function isStorageQuotaError(e: unknown): boolean {
  const msg =
    e instanceof Error
      ? e.message
      : typeof e === "string"
        ? e
        : JSON.stringify(e ?? "");
  return /storage limit|payment method|quota|402/i.test(msg);
}

async function uploadToIpfs(
  imageBlob: Blob,
  buildMetadata: (imageUri: string) => CardMetadata
): Promise<UploadedCard> {
  const imageUri = await upload({
    client: thirdwebClient,
    files: [
      new File([imageBlob], "base-airdrop-card.png", { type: "image/png" }),
    ],
  });
  const metadataUri = await upload({
    client: thirdwebClient,
    files: [
      new File([JSON.stringify(buildMetadata(imageUri))], "metadata.json", {
        type: "application/json",
      }),
    ],
  });
  return { metadataUri, imageUri, storage: "ipfs" };
}

async function uploadToSupabase(
  imageBlob: Blob,
  buildMetadata: (imageUri: string) => CardMetadata
): Promise<UploadedCard> {
  const id =
    globalThis.crypto?.randomUUID?.() ??
    `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  const image = await supabase.storage
    .from(SUPABASE_BUCKET)
    .upload(`${id}.png`, imageBlob, {
      contentType: "image/png",
      cacheControl: "31536000",
      upsert: false,
    });
  if (image.error) throw new Error(`storage: ${image.error.message}`);
  const imageUri = supabase.storage
    .from(SUPABASE_BUCKET)
    .getPublicUrl(`${id}.png`).data.publicUrl;

  const metadataBlob = new Blob([JSON.stringify(buildMetadata(imageUri))], {
    type: "application/json",
  });
  const meta = await supabase.storage
    .from(SUPABASE_BUCKET)
    .upload(`${id}.json`, metadataBlob, {
      contentType: "application/json",
      cacheControl: "31536000",
      upsert: false,
    });
  if (meta.error) throw new Error(`storage: ${meta.error.message}`);
  const metadataUri = supabase.storage
    .from(SUPABASE_BUCKET)
    .getPublicUrl(`${id}.json`).data.publicUrl;

  return { metadataUri, imageUri, storage: "supabase" };
}

// IPFS first (it is what an NFT should point at), Supabase only when IPFS is
// unavailable — quota exhausted, network error, anything.
export async function uploadCard(
  imageBlob: Blob,
  buildMetadata: (imageUri: string) => CardMetadata
): Promise<UploadedCard> {
  try {
    return await uploadToIpfs(imageBlob, buildMetadata);
  } catch (e) {
    console.warn("[storage] IPFS upload failed, falling back to Supabase:", e);
    try {
      return await uploadToSupabase(imageBlob, buildMetadata);
    } catch (fallbackError) {
      console.error("[storage] Supabase fallback failed:", fallbackError);
      // Report the original cause: it is the one that explains the outage.
      throw new Error(
        isStorageQuotaError(e)
          ? "Card storage is temporarily full. Please try again a bit later."
          : "Could not upload the card image. Please try again."
      );
    }
  }
}
