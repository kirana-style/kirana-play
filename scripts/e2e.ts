/**
 * The playground in a browser, end to end: the built Worker (`wrangler dev`)
 * serves the page, the engine of the version it opens with compiles the
 * starter, the CSS pane shows its layers, the sandboxed frame renders it, a
 * typo shows as a problem, a shared link opens the same project, and the
 * editor shows Kirana's summary after `sx` and TypeScript's completions.
 *
 *   vp run build && bunx wrangler dev --port 8787 &
 *   bun scripts/e2e.ts                     # http://localhost:8787/
 *   bun scripts/e2e.ts --url <base>
 */
import { chromium } from "playwright"
import type { Page } from "playwright"

const args = process.argv.slice(2)
const at = args.indexOf("--url")
const base = at < 0 ? "http://localhost:8787/" : args[at + 1]!

const failures: string[] = []
function check(what: string, ok: boolean, detail = "") {
  console.log(
    `${ok ? "ok  " : "FAIL"} ${what}${ok || !detail ? "" : `: ${detail}`}`
  )
  if (!ok) failures.push(what)
}

/** Waits until the engine has compiled or failed, and returns what the status says. */
async function settled(page: Page): Promise<{ state: string; text: string }> {
  const status = page.locator(
    '[role="status"][data-state="done"], [role="status"][data-state="failed"]'
  )
  await status.waitFor({ timeout: 90_000 })
  return {
    state: (await status.getAttribute("data-state")) ?? "",
    text: (await status.textContent()) ?? "",
  }
}

const browser = await chromium.launch({
  args: process.env.CI ? ["--no-sandbox"] : [],
})
try {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  })
  await context.grantPermissions(["clipboard-read", "clipboard-write"], {
    origin: base,
  })
  const page = await context.newPage()
  const errors: string[] = []
  page.on("pageerror", (error) => errors.push(error.message))

  const response = await page.goto(base)
  check(
    "the page is cross-origin isolated",
    response?.headers()["cross-origin-embedder-policy"] === "require-corp" &&
      (await page.evaluate(() => crossOriginIsolated))
  )
  const status = await settled(page)
  check("the engine compiles the starter", status.state === "done", status.text)
  // Nothing after this can pass without an engine: stop with the reason.
  if (status.state !== "done")
    throw new Error(`the engine did not compile: ${status.text}`)

  const frame = page
    .frames()
    .find((candidate) => candidate !== page.mainFrame())
  await page.waitForTimeout(1000)
  const text = (await frame?.evaluate(() => document.body.innerText)) ?? ""
  check(
    "the frame renders it",
    text.includes("Write a style, read its CSS"),
    text.slice(0, 120)
  )
  const tokenized = await frame?.evaluate(
    () => getComputedStyle(document.querySelector("article")!).borderRadius
  )
  check(
    "the stylesheet reaches the frame",
    tokenized === "14px",
    String(tokenized)
  )

  // Kirana's language server: the summary after `sx={…}` in the editor.
  const hints = await page.locator(".cm-kirana-hint").allInnerTexts()
  check(
    "Kirana's summary follows sx",
    hints.some((hint) => hint.includes("grid")),
    hints.slice(0, 3).join(" / ")
  )

  await page.getByRole("tab", { name: "CSS" }).click()
  const css = await page.locator('[aria-label="Compiled CSS"]').innerText()
  check(
    "the CSS pane shows the layers",
    css.includes("@layer kirana.atoms"),
    css.slice(0, 120)
  )

  await page.getByRole("tab", { name: "Preview" }).click()
  await page.getByRole("tab", { name: /card\.tsx/ }).click()
  await page.locator('[aria-label="card.tsx source"]').click()
  await page.keyboard.press("Control+End")
  await page.keyboard.type('\nexport const broken = css({ padding: "red" })\n')
  await page
    .waitForFunction(
      () =>
        /1 error/.test(
          document.querySelector('section[aria-label="Problems"]')
            ?.textContent ?? ""
        ),
      undefined,
      { timeout: 10_000 }
    )
    .catch(() => undefined)
  const problems =
    (await page.locator('section[aria-label="Problems"]').innerText()) ?? ""
  check(
    "a typo is a problem",
    problems.includes("KRN1202"),
    problems.slice(0, 160)
  )

  await page.getByRole("button", { name: "Share" }).click()
  await page.waitForTimeout(300)
  const link = page.url()
  const second = await context.newPage()
  await second.goto(link)
  await settled(second)
  // CodeMirror draws only the lines in view: go to the end, where the typo is.
  const source = second.locator('[aria-label="card.tsx source"]')
  await source.click()
  await second.keyboard.press("Control+End")
  const restored = await source.innerText()
  check("a shared link opens the same project", restored.includes("broken"))

  // The browser caches the engine's files for good, so ask the Worker directly,
  // twice: the second answer comes from its cache.
  const version = (
    await page.getByRole("combobox", { name: "Kirana version" }).innerText()
  ).replace(/^v/, "")
  const answers: string[] = []
  for (const path of [`engine/${version}/runtime.js`, "engine/versions"])
    for (let time = 0; time < 2; time++) {
      const answer = await context.request.get(new URL(path, base).href)
      answers.push(`${path} ${answer.status()}`)
    }
  check(
    "the engine route answers from its cache",
    answers.every((answer) => answer.endsWith(" 200")),
    answers.join(", ")
  )
  const listed = (await (
    await context.request.get(new URL("engine/versions", base).href)
  ).json()) as { versions: string[] }
  check(
    "the version list holds only engines",
    listed.versions.includes(version) && !listed.versions.includes("0.0.0"),
    listed.versions.join(", ")
  )

  // TypeScript in the editor: the starter's tokens complete after a dot.
  await page.getByRole("tab", { name: /app\.tsx/ }).click()
  await page.locator('[aria-label="app.tsx source"]').click()
  await page.keyboard.press("Control+End")
  await page.keyboard.type("\nconst probe = color.")
  const completions = page.locator(".cm-tooltip-autocomplete li")
  await completions
    .first()
    .waitFor({ timeout: 60_000 })
    .catch(() => undefined)
  const offered = await completions.allInnerTexts()
  check(
    "TypeScript completes a token",
    offered.some((label) => label.includes("hue")),
    offered.slice(0, 8).join(", ")
  )
  await page.keyboard.press("Escape")

  check("no page errors", errors.length === 0, errors.join("; "))
} finally {
  await browser.close()
}
if (failures.length) {
  console.error(`${failures.length} check(s) failed`)
  process.exit(1)
}
