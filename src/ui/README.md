# src/ui

The interface's components: Button, DropdownMenu, Select, Tabs, Toggle, ToggleGroup and Tooltip, on
Base UI, with the recipes, tokens and theme they read. They are a copy of the Kirana site's own kit
(`packages/ui` in [kirana-style/kirana](https://github.com/kirana-style/kirana), at `8bca0d5`), taken
as code the way shadcn/ui is: only `@base-ui/react` and the icons come from npm.

What differs from the kit:

- imports point at `@/ui/` instead of `@workspace/ui/`;
- the relations whose other half is not copied are `optional`: the button group's (ButtonGroup), and
  the dropdown menu's and the tooltip's content (read by Item and Kbd);
- `reset.css` is the reset layer of the kit's `globals.css`, without its font imports and `base` rules.

To take a newer version, copy the file again from the kit and keep these changes.
