/**
 * The project being edited, and where it is kept between visits: the link's
 * fragment when it holds one, else this browser's last session, else the
 * starter.
 */
import { CONFIG_FILE } from "@/engine/protocol.ts"

import { STARTER } from "./examples.ts"
import { decodeShared } from "./share.ts"
import type { Shared } from "./share.ts"

export type ProjectFile = { name: string; code: string }

export type Project = {
  files: ProjectFile[]
  active: string
}

const STORAGE = "kirana-play:project"

/** The files as the engine takes them, by name. */
export function filesOf(project: Project): Record<string, string> {
  return Object.fromEntries(project.files.map((file) => [file.name, file.code]))
}

/** Tab order: the configuration last, where it is out of the way. */
export function ordered(files: ProjectFile[]): ProjectFile[] {
  return [
    ...files.filter((file) => file.name !== CONFIG_FILE),
    ...files.filter((file) => file.name === CONFIG_FILE),
  ]
}

export function fromShared(shared: Shared): Project {
  const files = ordered(shared.files)
  const active = files.some((file) => file.name === shared.active)
    ? shared.active!
    : files[0]!.name
  return { files, active }
}

export function starter(): Project {
  return fromShared({ files: STARTER.files })
}

/**
 * The project to open with, the version a shared link asked for, and the
 * example it is when it is one untouched.
 */
export function initialProject(): {
  project: Project
  version?: string
  example?: string
} {
  const shared = decodeShared(location.hash)
  if (shared) return { project: fromShared(shared), version: shared.version }
  try {
    const saved = localStorage.getItem(STORAGE)
    const parsed = saved ? (JSON.parse(saved) as Shared) : undefined
    if (parsed?.files?.length) return { project: fromShared(parsed) }
  } catch {
    // Storage blocked or the saved project unreadable: start fresh.
  }
  return { project: starter(), example: STARTER.id }
}

export function saveProject(project: Project): void {
  try {
    localStorage.setItem(STORAGE, JSON.stringify(project))
  } catch {
    // A private window or blocked storage: the link still holds the project.
  }
}

/** A name for a new file that no file has yet. */
export function freshName(
  files: ProjectFile[],
  base = "component",
  extension = ".tsx"
): string {
  const taken = new Set(files.map((file) => file.name))
  for (let index = 1; ; index++) {
    const name = `${base}${index === 1 ? "" : `-${index}`}${extension}`
    if (!taken.has(name)) return name
  }
}

/** Why a name cannot be a file of this project, or undefined when it can. */
export function invalidName(
  name: string,
  files: ProjectFile[],
  current?: string
): string | undefined {
  if (
    !/^[\w.-]+(?:\/[\w.-]+)*\.(?:tsx|ts|jsx|js)$/.test(name) ||
    name.split("/").some((segment) => segment === "." || segment === "..")
  )
    return "A file is a path ending in .tsx, .ts, .jsx or .js"
  if (name !== current && files.some((file) => file.name === name))
    return `${name} already exists`
  return undefined
}
