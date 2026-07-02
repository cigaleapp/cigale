> [!WARNING]
> **Don't** use `$`-prefixed import aliases here, as those files are also imported by scripts, that run via Bun directly (and not through Vite, that implements these import aliases)
