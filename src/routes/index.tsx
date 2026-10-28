import { createFileRoute } from "@tanstack/react-router"
import { css } from "@kirana-style/core"

export const Route = createFileRoute("/")({ component: Home })

const styles = {
  main: css({
    display: "grid",
    alignContent: "center",
    gap: "1rem",
    minHeight: "100dvh",
    maxWidth: "40rem",
    marginInline: "auto",
    paddingInline: "1rem",
  }),
  label: css({
    fontFamily: "ui-monospace, monospace",
    fontSize: "0.75rem",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "light-dark(#6b645a, #a39b8f)",
  }),
  title: css({
    margin: 0,
    fontSize: "clamp(2rem, 6vw, 3rem)",
    lineHeight: 1.1,
    fontWeight: 500,
  }),
  lede: css({
    margin: 0,
    fontSize: "1.125rem",
    lineHeight: 1.6,
    color: "light-dark(#4a443c, #c9c1b5)",
  }),
  link: css({
    color: "inherit",
    textUnderlineOffset: "0.2em",
  }),
}

function Home() {
  return (
    <main sx={styles.main}>
      <span sx={styles.label}>Kirana Play</span>
      <h1 sx={styles.title}>Type a component, read its CSS</h1>
      <p sx={styles.lede}>
        The playground compiles in your browser with the released engine. It is
        being built; until then,{" "}
        <a href="https://kirana.style/play" sx={styles.link}>
          the examples on kirana.style
        </a>{" "}
        show what the compiler writes.
      </p>
    </main>
  )
}
