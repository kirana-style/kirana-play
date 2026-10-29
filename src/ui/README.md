# src/ui

The interface's components: Button, DropdownMenu, Select, Tabs, Toggle, ToggleGroup and Tooltip, on
Base UI, with the recipes, tokens and theme they read. They are a copy of the Kirana site's own kit
(`packages/ui` in [kirana-style/kirana](https://github.com/kirana-style/kirana), at `8bca0d5`), taken
as code the way shadcn/ui is: only `@base-ui/react` and the icons come from npm.

What differs from the kit:

- imports point at `@/ui/` instead of `@workspace/ui/`;
- the button group's relation is `optional`, since ButtonGroup is not copied;
- `reset.css` is the reset layer of the kit's `globals.css`, without its font imports and `base` rules;
- Tooltip and DropdownMenu apply no anchor for Kbd and Item, which are not copied either: an anchor
  nothing reads fails `relation-unused` even when optional (KF-067).

To take a newer version, copy the file again from the kit and keep these changes.
