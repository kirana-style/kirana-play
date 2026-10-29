/**
 * A project in a link: the files, compressed into the URL's fragment, so the
 * server never sees or stores them. `#code=` followed by base64url of the
 * deflated JSON.
 */
import { deflateSync, inflateSync, strFromU8, strToU8 } from "fflate"

export type Shared = {
  /** The Kirana version the project was written for. */
  version?: string
  /** Files in tab order. */
  files: { name: string; code: string }[]
  active?: string
}

const PREFIX = "code="

function toBase64Url(bytes: Uint8Array): string {
  let binary = ""
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/, "")
}

function fromBase64Url(text: string): Uint8Array {
  const binary = atob(text.replaceAll("-", "+").replaceAll("_", "/"))
  return Uint8Array.from(binary, (char) => char.charCodeAt(0))
}

/** The fragment for a project, without the leading `#`. */
export function encodeShared(project: Shared): string {
  const json = JSON.stringify({ v: 1, ...project })
  return PREFIX + toBase64Url(deflateSync(strToU8(json), { level: 9 }))
}

/** The project in a fragment (with or without `#`), or undefined when there is none or it is broken. */
export function decodeShared(fragment: string): Shared | undefined {
  const text = fragment.replace(/^#/, "")
  if (!text.startsWith(PREFIX)) return undefined
  try {
    const value = JSON.parse(
      strFromU8(inflateSync(fromBase64Url(text.slice(PREFIX.length))))
    ) as { v?: number } & Partial<Shared>
    if (value.v !== 1 || !Array.isArray(value.files)) return undefined
    const files = value.files.filter(
      (file): file is Shared["files"][number] =>
        typeof file?.name === "string" && typeof file?.code === "string"
    )
    if (files.length === 0) return undefined
    return {
      version: typeof value.version === "string" ? value.version : undefined,
      files,
      active: typeof value.active === "string" ? value.active : undefined,
    }
  } catch {
    return undefined
  }
}
