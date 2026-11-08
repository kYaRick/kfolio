---
title: "Rebooting kfolio: From Blazor WASM to Terminal-Driven Astro"
description: "Why and how I migrated my personal portfolio to Astro, keeping the Hermes terminal aesthetic, multi-theme engine, and markdown agility."
pubDate: 2026-11-08
lang: "en"
tags: ["Architecture", "Astro", "DevOps", "Frontend"]
author: "Yaroslav Kyliushyk"
---

# Rebooting kfolio: The Journey to v2

When I initially built `kfolio`, my primary sandbox goal was exploring Blazor WebAssembly and .NET in the browser. It was a fascinating experiment in pushing C# into client-side web apps. 

However, as a personal portfolio and knowledge hub evolves, maintenance speed and frictionless blogging become top priorities.

## The Core Motives

1. **Markdown-First Workflow:** Maintaining CV updates and writing engineering notes directly in Markdown is unmatched for developer ergonomics.
2. **Speed & Static Portability:** Astro ships zero client JavaScript by default, producing lightning-fast static assets deployable on GitHub Pages.
3. **The Hermes Terminal Persona:** Moving from heavy UI abstractions to clean CSS custom properties makes it trivial to emulate terminal interfaces, neon palettes, and seasonal styles.

```bash
kfolio > astro build
[build] Complete in 1.37s!
[status] All systems operational.
```

## What's Next?

More articles on NixOS homelabs, Bambu Lab 3D printing discoveries, Home Assistant automations, and embedded GreenPAK IC experiments. Stay tuned!
