/** Semver order, a prerelease before its release. */
export function compareVersions(a: string, b: string): number {
  const parse = (version: string) => {
    const [core = "", pre] = version.split("-", 2)
    return { parts: core.split(".").map(Number), pre }
  }
  const left = parse(a)
  const right = parse(b)
  for (let index = 0; index < 3; index++) {
    const difference = left.parts[index]! - right.parts[index]!
    if (difference !== 0) return difference
  }
  if (left.pre === right.pre) return 0
  if (left.pre === undefined) return 1
  if (right.pre === undefined) return -1
  return left.pre < right.pre ? -1 : 1
}
