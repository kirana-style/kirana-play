import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { PointerEvent } from "react"
import { css } from "@kirana-style/core"

import { Editor, languageOf } from "@/editor/editor.tsx"
import type { Diagnostic, Position } from "@/engine/protocol.ts"
import { DEFAULT_VERSION } from "@/engine/version.ts"
import { connectFrame, frameDocument } from "@/preview/frame.ts"
import type { Frame } from "@/preview/frame.ts"
import type { Scheme } from "@/preview/protocol.ts"
import { color } from "@/theme/tokens.ts"
import { ToggleGroup, ToggleGroupItem } from "@/ui/components/toggle-group.tsx"

import type { Example } from "./examples.ts"
import { FileTabs } from "./file-tabs.tsx"
import { Footer } from "./footer.tsx"
import { Header } from "./header.tsx"
import type { Layout } from "./header.tsx"
import { OutputPane } from "./output-pane.tsx"
import type { OutputTab } from "./output-pane.tsx"
import { Problems } from "./problems.tsx"
import {
  filesOf,
  freshName,
  fromShared,
  initialProject,
  ordered,
  saveProject,
} from "./project.ts"
import type { Project } from "./project.ts"
import { encodeShared } from "./share.ts"
import { useCompiler } from "./use-compiler.ts"

const SCHEME = "kirana-play:scheme"
const LAYOUT = "kirana-play:layout"

const styles = {
  app: css({
    display: "grid",
    gridTemplateRows: "auto minmax(0, 1fr) auto",
    height: "100dvh",
    overflow: "hidden",
  }),
  /** Below 64rem one pane at a time, chosen by the switch above them. */
  switcher: css({
    display: { base: "flex", "@media (min-width: 64rem)": "none" },
    gap: "0.25rem",
    padding: "0.375rem",
    borderBottomWidth: "1px",
    borderBottomStyle: "solid",
    borderBottomColor: color.border,
  }),
  switches: css({ flexGrow: 1 }),
  switch: css({ flexGrow: 1 }),
  // A column, not a grid: the pane switch is not displayed on wide screens,
  // and the panes must take the rest whether it is or not.
  main: css({ display: "flex", flexDirection: "column", minHeight: 0 }),
  panes: css({
    flexGrow: 1,
    display: "grid",
    gridTemplateRows: "minmax(0, 1fr)",
    gridTemplateColumns: "minmax(0, 1fr)",
    minHeight: 0,
    minWidth: 0,
  }),
  pane: css({
    display: "flex",
    flexDirection: "column",
    minHeight: 0,
    minWidth: 0,
  }),
  hiddenSmall: css({
    display: { base: "none", "@media (min-width: 64rem)": "flex" },
  }),
  hidden: css({ display: "none" }),
  editor: css({
    flexGrow: 1,
    flexBasis: 0,
    minHeight: 0,
    backgroundColor: color.card,
  }),
  divider: css({
    display: { base: "none", "@media (min-width: 64rem)": "block" },
    backgroundColor: { base: color.border, ":hover": color.accent },
    touchAction: "none",
  }),
  dividerSplit: css({
    width: "1px",
    cursor: "col-resize",
    boxShadow: "0 0 0 3px transparent",
  }),
  dividerStacked: css({ height: "1px", cursor: "row-resize" }),
}

function readStored<T extends string>(
  key: string,
  allowed: readonly T[],
  fallback: T
): T {
  try {
    const value = localStorage.getItem(key)
    return allowed.includes(value as T) ? (value as T) : fallback
  } catch {
    return fallback
  }
}

function store(key: string, value: string) {
  try {
    localStorage.setItem(key, value)
  } catch {
    // Blocked storage: the choice lasts for this visit only.
  }
}

export function Playground() {
  const initial = useMemo(() => initialProject(), [])
  const [project, setProject] = useState<Project>(initial.project)
  const [example, setExample] = useState<string | undefined>(initial.example)
  const [version, setVersion] = useState(initial.version ?? DEFAULT_VERSION)
  const [versions, setVersions] = useState<string[]>([DEFAULT_VERSION])
  const [scheme, setScheme] = useState<Scheme>(() =>
    readStored(SCHEME, ["light", "dark", "system"], "system")
  )
  const [layout, setLayout] = useState<Layout>(() =>
    readStored(LAYOUT, ["split", "stacked", "editor", "preview"], "split")
  )
  const [pane, setPane] = useState<"code" | "output">("code")
  const [tab, setTab] = useState<OutputTab>("preview")
  const [ratio, setRatio] = useState(0.5)
  const [shared, setShared] = useState(false)
  const [runtimeError, setRuntimeError] = useState<string>()
  const [reveal, setReveal] = useState<Position & { at: number }>()
  const [frame, setFrame] = useState<Frame>()
  // The frame is connected when it mounts; it stays mounted for the page's life.
  const frameRef = useCallback((iframe: HTMLIFrameElement | null) => {
    if (!iframe) return
    const connected = connectFrame(iframe, {
      onRendered: () => setRuntimeError(undefined),
      onError: setRuntimeError,
    })
    setFrame(connected)
    return () => connected.dispose()
  }, [])
  const panes = useRef<HTMLDivElement>(null)
  const document_ = useMemo(() => frameDocument(), [])

  const files = useMemo(() => filesOf(project), [project])
  const { status, output } = useCompiler(version, files, frame)

  useEffect(() => {
    fetch("/engine/versions")
      .then((response) => response.json() as Promise<{ versions: string[] }>)
      .then(({ versions: found }) => found.length && setVersions(found))
      .catch(() => undefined)
  }, [])

  useEffect(() => {
    document.documentElement.dataset.scheme = scheme
    frame?.scheme(scheme)
  }, [scheme, frame])

  useEffect(() => {
    const timer = setTimeout(() => saveProject(project), 300)
    return () => clearTimeout(timer)
  }, [project])

  // Editing after opening a shared link: the link no longer describes the page.
  const edited = useRef(false)
  useEffect(() => {
    if (!edited.current) return
    if (location.hash) history.replaceState(null, "", location.pathname)
  }, [project])

  const diagnostics: Diagnostic[] = useMemo(
    () => [
      ...(output?.config ? [output.config] : []),
      ...(output?.diagnostics ?? []),
    ],
    [output]
  )
  const problems = useMemo(() => {
    const map = new Map<string, "error" | "warning">()
    for (const diagnostic of diagnostics) {
      if (diagnostic.severity === "error") map.set(diagnostic.file, "error")
      else if (diagnostic.severity === "warning" && !map.has(diagnostic.file))
        map.set(diagnostic.file, "warning")
    }
    return map
  }, [diagnostics])

  const active =
    project.files.find((file) => file.name === project.active) ??
    project.files[0]!

  const update = (next: Project, fromExample?: string) => {
    edited.current = fromExample === undefined
    setExample(fromExample)
    setProject(next)
  }

  const share = () => {
    const fragment = encodeShared({
      version,
      files: project.files,
      active: project.active,
    })
    history.replaceState(null, "", `#${fragment}`)
    edited.current = false
    void navigator.clipboard
      .writeText(location.href)
      .then(() => {
        setShared(true)
        setTimeout(() => setShared(false), 2000)
      })
      .catch(() => undefined)
  }

  const drag = (event: PointerEvent<HTMLDivElement>) => {
    const box = panes.current!.getBoundingClientRect()
    const stacked = layout === "stacked"
    const move = (moved: globalThis.PointerEvent) => {
      const value = stacked
        ? (moved.clientY - box.top) / box.height
        : (moved.clientX - box.left) / box.width
      setRatio(Math.min(0.8, Math.max(0.2, value)))
    }
    const up = () => {
      window.removeEventListener("pointermove", move)
      window.removeEventListener("pointerup", up)
    }
    window.addEventListener("pointermove", move)
    window.addEventListener("pointerup", up)
    event.preventDefault()
  }

  const showCode = layout !== "preview"
  const showOutput = layout !== "editor"
  const split = showCode && showOutput
  const template = split
    ? `minmax(0, ${ratio}fr) auto minmax(0, ${1 - ratio}fr)`
    : "minmax(0, 1fr)"

  return (
    <div sx={styles.app}>
      <Header
        scheme={scheme}
        onScheme={(next) => {
          setScheme(next)
          store(SCHEME, next)
        }}
        onShare={share}
        shared={shared}
        layout={layout}
        onLayout={(next) => {
          setLayout(next)
          store(LAYOUT, next)
        }}
      />
      <div sx={styles.main}>
        <div sx={styles.switcher}>
          <ToggleGroup
            aria-label="Pane"
            variant="outline"
            spacing={0}
            value={[pane]}
            onValueChange={(next: string[]) => {
              if (next[0]) setPane(next[0] as typeof pane)
            }}
            sx={styles.switches}
          >
            {(["code", "output"] as const).map((id) => (
              <ToggleGroupItem key={id} value={id} sx={styles.switch}>
                {id === "code" ? "Code" : "Output"}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
        <div
          ref={panes}
          sx={[
            styles.panes,
            // Below 64rem one pane shows at a time and takes the whole width.
            layout === "stacked"
              ? css({
                  gridTemplateRows: {
                    base: "minmax(0, 1fr)",
                    "@media (min-width: 64rem)": template,
                  },
                })
              : css({
                  gridTemplateColumns: {
                    base: "minmax(0, 1fr)",
                    "@media (min-width: 64rem)": template,
                  },
                }),
          ]}
        >
          <section
            aria-label="Code"
            sx={[
              styles.pane,
              !showCode && styles.hidden,
              pane !== "code" && styles.hiddenSmall,
            ]}
          >
            <FileTabs
              files={project.files}
              active={active.name}
              problems={problems}
              onSelect={(name) => setProject({ ...project, active: name })}
              onAdd={() => {
                const name = freshName(project.files)
                const component = name.replace(/\.tsx$/, "").replace(/\W/g, "")
                const code = `import { css } from "@kirana-style/core"\n\nexport function ${component}() {\n  return <div sx={root}>${component}</div>\n}\n\nconst root = css({ padding: "1rem" })\n`
                update({
                  files: ordered([...project.files, { name, code }]),
                  active: name,
                })
              }}
              onRename={(from, to) =>
                update({
                  files: project.files.map((file) =>
                    file.name === from ? { ...file, name: to } : file
                  ),
                  active: project.active === from ? to : project.active,
                })
              }
              onRemove={(name) => {
                const rest = project.files.filter((file) => file.name !== name)
                update({
                  files: rest,
                  active:
                    project.active === name ? rest[0]!.name : project.active,
                })
              }}
            />
            <div sx={styles.editor}>
              <Editor
                file={active.name}
                value={active.code}
                language={languageOf(active.name)}
                label={`${active.name} source`}
                diagnostics={diagnostics.filter((d) => d.file === active.name)}
                reveal={reveal}
                onChange={(code) =>
                  update({
                    ...project,
                    files: project.files.map((file) =>
                      file.name === active.name ? { ...file, code } : file
                    ),
                  })
                }
              />
            </div>
            <Problems
              diagnostics={diagnostics}
              onOpen={(diagnostic) => {
                if (
                  !diagnostic.file ||
                  !project.files.some((f) => f.name === diagnostic.file)
                )
                  return
                setProject({ ...project, active: diagnostic.file })
                if (diagnostic.start)
                  setReveal({ ...diagnostic.start, at: Date.now() })
              }}
            />
          </section>
          {split && (
            <div
              role="separator"
              aria-orientation={
                layout === "stacked" ? "horizontal" : "vertical"
              }
              onPointerDown={drag}
              sx={[
                styles.divider,
                layout === "stacked"
                  ? styles.dividerStacked
                  : styles.dividerSplit,
              ]}
            />
          )}
          <div
            sx={[
              styles.pane,
              !showOutput && styles.hidden,
              pane !== "output" && styles.hiddenSmall,
            ]}
          >
            <OutputPane
              tab={tab}
              onTab={setTab}
              output={output}
              frameRef={frameRef}
              frameDocument={document_}
              runtimeError={runtimeError}
            />
          </div>
        </div>
      </div>
      <Footer
        example={example}
        onExample={(chosen: Example) => {
          update(fromShared({ files: chosen.files }), chosen.id)
          if (location.hash) history.replaceState(null, "", location.pathname)
        }}
        status={status}
        version={version}
        versions={versions}
        onVersion={setVersion}
      />
    </div>
  )
}
