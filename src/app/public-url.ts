import type { Location } from "@angular/common";

export function publicUrl(
  path: string | null,
  location: Pick<Location, "prepareExternalUrl">,
  baseUri: string,
): string | null {
  return path ? new URL(location.prepareExternalUrl(path), baseUri).href : null;
}
