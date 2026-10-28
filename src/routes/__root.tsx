import type { ReactNode } from "react"
import { HeadContent, Scripts, createRootRoute } from "@tanstack/react-router"
import { css } from "@kirana-style/core"

import kiranaCss from "@kirana-style/core/stylesheet.css?url"

const styles = {
  body: css({
    margin: 0,
    backgroundColor: "light-dark(#faf8f3, #14110f)",
    color: "light-dark(#1d1a16, #ece6dc)",
    fontFamily: "ui-sans-serif, system-ui, sans-serif",
    colorScheme: "light dark",
  }),
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Kirana Play" },
      {
        name: "description",
        content:
          "Type a component and see the CSS Kirana compiles it to, in your browser.",
      },
    ],
    links: [{ rel: "stylesheet", href: kiranaCss }],
  }),
  shellComponent: Document,
})

function Document({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body sx={styles.body}>
        {children}
        <Scripts />
      </body>
    </html>
  )
}
