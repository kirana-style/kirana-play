import { describe, expect, it } from "vite-plus/test"

import { compareVersions } from "../src/engine/versions.ts"
import { createRegistry, resolvePath } from "../src/preview/modules.ts"
import { freshName, invalidName, ordered } from "../src/playground/project.ts"
import { decodeShared, encodeShared } from "../src/playground/share.ts"
import { formatBytes, layersOf } from "../src/playground/stylesheet.ts"

describe("share links", () => {
  it("round-trip a project through the fragment", () => {
    const project = {
      version: "0.3.5",
      files: [
        {
          name: "App.tsx",
          code: 'export default () => <p>é 😀 "quoted"</p>\n',
        },
        { name: "kirana.config.ts", code: "export default {}\n" },
      ],
      active: "App.tsx",
    }
    const fragment = encodeShared(project)
    expect(fragment).toMatch(/^code=[\w-]+$/)
    expect(decodeShared(`#${fragment}`)).toEqual(project)
  })

  it("ignore a fragment that is not one", () => {
    expect(decodeShared("")).toBeUndefined()
    expect(decodeShared("#section")).toBeUndefined()
    expect(decodeShared("#code=not-deflate")).toBeUndefined()
    expect(decodeShared(`#${encodeShared({ files: [] })}`)).toBeUndefined()
  })
})

describe("layersOf", () => {
  it("splits the stylesheet into its layers, past strings and nested blocks", () => {
    const css = `@layer reset, kirana;
@layer kirana.tokens {
  :root { --a: red; }
}
@layer kirana.atoms {
  .a { content: "}"; }
  @media (min-width: 40rem) { .b { padding: 1rem; } }
}
@layer kirana.atoms { .c { color: red; } }`
    const layers = layersOf(css)
    expect(layers.map((layer) => layer.name)).toEqual([
      "kirana.tokens",
      "kirana.atoms",
    ])
    expect(layers[1]!.css).toContain('content: "}"')
    expect(layers[1]!.css).toContain(".b { padding: 1rem; }")
    expect(layers[1]!.css).toContain(".c { color: red; }")
  })

  it("formats sizes", () => {
    expect(formatBytes(843)).toBe("843 B")
    expect(formatBytes(2130)).toBe("2.13 kB")
  })
})

describe("the preview's modules", () => {
  it("resolves relative imports as a bundler does", () => {
    expect(resolvePath("App.tsx", "./Card")).toBe("Card")
    expect(resolvePath("src/ui/Button.tsx", "../tokens")).toBe("src/tokens")
  })

  it("runs each module once, with the packages it is given", () => {
    const registry = createRegistry(
      {
        "App.tsx":
          'const card = require("./ui/Card"); const again = require("./ui/Card.tsx"); exports.same = card === again; exports.text = card.text + require("pkg").suffix',
        "ui/Card.tsx": 'exports.text = "card"',
      },
      { pkg: { suffix: "!" } }
    )
    expect(registry.require("App.tsx")).toEqual({ same: true, text: "card!" })
  })

  it("names what it cannot find", () => {
    const registry = createRegistry(
      { "App.tsx": 'require("./Missing")', "B.tsx": 'require("lodash")' },
      {}
    )
    expect(() => registry.require("App.tsx")).toThrow('cannot find "./Missing"')
    expect(() => registry.require("B.tsx")).toThrow('no package "lodash"')
  })
})

describe("project files", () => {
  const files = [
    { name: "kirana.config.ts", code: "" },
    { name: "App.tsx", code: "" },
    { name: "Component.tsx", code: "" },
  ]

  it("keeps the configuration last", () => {
    expect(ordered(files).map((file) => file.name)).toEqual([
      "App.tsx",
      "Component.tsx",
      "kirana.config.ts",
    ])
  })

  it("names new files and refuses bad names", () => {
    expect(freshName(files)).toBe("Component2.tsx")
    expect(invalidName("Card.tsx", files)).toBeUndefined()
    expect(invalidName("src/tokens.ts", files)).toBeUndefined()
    expect(invalidName("App.tsx", files)).toBe("App.tsx already exists")
    expect(invalidName("App.tsx", files, "App.tsx")).toBeUndefined()
    expect(invalidName("notes.md", files)).toMatch(/ending in/)
    expect(invalidName("../x.ts", files)).toMatch(/ending in/)
  })
})

describe("compareVersions", () => {
  it("orders releases, a prerelease before its release", () => {
    expect(
      ["0.3.10", "0.3.5", "0.4.0-next.1", "0.4.0", "0.3.4"].sort(
        compareVersions
      )
    ).toEqual(["0.3.4", "0.3.5", "0.3.10", "0.4.0-next.1", "0.4.0"])
  })
})
