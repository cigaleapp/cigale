# Contributing to Cigale

## Pre-requisites

- A [Github account](https://github.com/signup)
- [Git](https://git-scm.com)
- [Bun](https://bun.com)

## Setup

```
git clone https://github.com/cigaleapp/cigale --single-branch
cd cigale
bun i
bun run dev
```

The `--single-branch` option reduces the amount of data downloaded, as it only fetches the `main` branch (the `gh-pages` branch is used for deployment, and is quite large)

## Conventions

- Use [Gitmoji](https://gitmoji.dev/) for commit messages (you can use `npm commit` to commit using Gitmoji conventions, or use [gitmoji-rs](https://github.com/gwennlbh/gitmoji-rs) for a faster alternative written in Rust).

## Scripts

- `bun run dev`: Start the development server
- `bun run build`: Build the application for production
- `bun run preview`: Preview the production build
- `bun run format`: Format code (pre-commit hooks should ensure you only commit formatted code, but you can run this manually)
- `bun run commit`: Commit using Gitmoji conventions (you can also use [gitmoji-rs](https://github.com/gwennlbh/gitmoji-rs), which is the same but way faster (written in Rust). You'll have to install it separately, though, as it's not available on NPM).

## Codebase

Get familiar with the code base by reading [CODEBASE.md](./CODEBASE.md)
