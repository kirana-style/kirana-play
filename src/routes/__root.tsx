import type { ReactNode } from "react"
import { HeadContent, Scripts, createRootRoute } from "@tanstack/react-router"
import { css } from "@kirana-style/core"

import kiranaCss from "@kirana-style/core/stylesheet.css?url"
import fontsCss from "@/theme/fonts.css?url"
import { color, font } from "@/theme/tokens.ts"

const styles = {
  // The scheme follows the system unless the footer's toggle picked one,
  // which it writes to `<html data-scheme>`.
  html: css({
    colorScheme: {
      base: "light dark",
      '[data-scheme="light"]': "light",
      '[data-scheme="dark"]': "dark",
    },
  }),
  body: css({
    margin: 0,
    backgroundColor: color.background,
    color: color.foreground,
    fontFamily: font.sans,
    WebkitFontSmoothing: "antialiased",
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
    links: [
      // The brand's petal K, as kirana.style and kirana-ui serve it.
      { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
      { rel: "icon", href: "/favicon.ico", sizes: "48x48" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
      { rel: "stylesheet", href: fontsCss },
      { rel: "stylesheet", href: kiranaCss },
    ],
  }),
  shellComponent: Document,
})

function Document({ children }: { children: ReactNode }) {
  return (
    <html lang="en" sx={styles.html} suppressHydrationWarning>
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
