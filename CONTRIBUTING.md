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

### Opening the site on another device

If you want to test features on a computer that isn't the one running the development server, you can connect using a network-local IP address (usually starts with `192.168.1.`). When you run `bun run dev`, these IP addresses will be shown.

This only works if the two devices are on the same network.

For convenience, you can attribute a fixed IP address to the computer running the development server: this is usually doable via your box's configuration panel, usually available on http://192.168.1.1

However, just accessing the site won't work: the app depends on Web APIs that only run in [Secure Contexts](https://developer.mozilla.org/en-US/docs/Glossary/Secure_Context).

You can either:

- Set the environment variable `HTTPS_DEV` to "true" and re-launch the dev server, but HMR (hot module replacement, the fact that the page changes when the code changes without reloading it) will not work
- Tell your browser to make an exception and treat the `http://192.168.1.N:5173` origin as a Secure Origin. In Chrome, you can use [the `unsafely-treat-insecure-origin-as-secure`](chrome://flags/#unsafely-treat-insecure-origin-as-secure). Don't forge the port (5173) when entering the origin.

The mobile app can be tested without having to go through all of this: Capacitor handles the fact that the network-local IP address is HTTP. Just grab the preview APK from your PR that is a draft or has the `capacitor-live-reload` label set.

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
