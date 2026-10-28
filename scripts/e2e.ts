/**
 * The playground in a browser, end to end: the built Worker (`wrangler dev`)
 * serves the page, the engine of the version it opens with compiles the
 * starter, the CSS pane shows its layers, the sandboxed frame renders it, a
 * typo shows as a problem, and a shared link opens the same project.
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

const compiled = (page: Page) =>
  page.waitForFunction(
    () =>
      /Compiled in|did not start/.test(
        document.querySelector('[role="status"]')?.textContent ?? ""
      ),
    undefined,
    { timeout: 90_000 }
  )

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
  await compiled(page)
  const status = (await page.textContent('[role="status"]')) ?? ""
  check(
    "the engine compiles the starter",
    status.startsWith("Compiled in"),
    status
  )

  const frame = page
    .frames()
    .find((candidate) => candidate !== page.mainFrame())
  await page.waitForTimeout(1000)
  const text = (await frame?.evaluate(() => document.body.innerText)) ?? ""
  check(
    "the frame renders it",
    text.includes("Kirana playground"),
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

  await page.getByRole("tab", { name: "CSS" }).click()
  const css = await page.locator('[aria-label="Compiled CSS"]').innerText()
  check(
    "the CSS pane shows the layers",
    css.includes("@layer kirana.atoms"),
    css.slice(0, 120)
  )

  await page.getByRole("tab", { name: "Preview" }).click()
  await page.getByRole("tab", { name: /Card\.tsx/ }).click()
  await page.locator('[aria-label="Card.tsx source"]').click()
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
  await compiled(second)
  const restored = await second
    .locator('[aria-label="Card.tsx source"]')
    .innerText()
  check("a shared link opens the same project", restored.includes("broken"))

  check("no page errors", errors.length === 0, errors.join("; "))
} finally {
  await browser.close()
}
if (failures.length) {
  console.error(`${failures.length} check(s) failed`)
  process.exit(1)
}
