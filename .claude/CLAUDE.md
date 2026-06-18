# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**absesnsi-rbia** — An attendance (absensi) system for RBIA.

## Tech Stack

- **Runtime:** Node.js (local dev), Cloudflare Workers (deploy)
- **Framework:** Hono (lightweight web framework, Cloudflare Workers compatible)
- **Deployment:** Cloudflare Workers via Wrangler

## Commands

```
npm run dev          # Start local dev server (wrangler dev)
npm run deploy       # Deploy to Cloudflare Workers
npm run test         # Run tests
```

## Architecture

Hono app entry point lives in `src/index.ts`. Routes are organized by domain. Cloudflare Worker bindings (KV, D1, etc.) are configured in `wrangler.toml`.
