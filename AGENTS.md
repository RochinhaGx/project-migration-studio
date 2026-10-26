<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Application architecture
- Outside Lovable, deploy Nitro with the node-server preset and .output/server/index.mjs; keep active photo bytes under public at their existing pointer paths so Hostinger needs no Lovable asset proxy. The hostinger build script checks both source photos and emitted photos before accepting deployment.
- Resolve optional customizer asset pointers through an eager glob and an unknown-value URL guard with the existing placeholder fallback, so absent files or empty metadata cannot break the gallery or inferred types.
- Keep imported TanStack content routes and the shared StoreShell/StoreProvider at the root so navigation preserves transient bag state.
- Store custom quotes through validated, rate-limited server functions in Cloud; uploaded customer files remain private.
- Keep upload, order-success animation and cookie preferences in focused shared store components so their presentation stays consistent.
- Cookie preferences are browser-local consent settings; do not initialize optional analytics without stored consent.
- Preserve generated Cloud clients and middleware; never import credentials or integration configuration from an uploaded archive.
- Export customizer STL from the displayed Three.js meshes in millimetres, and share prepared browser files through native sharing with explicit download fallback; WhatsApp links cannot attach files.
- Pix payments go through Mercado Pago server-side only; the server recomputes product prices and freight (shared rules in src/lib/payment-rules.ts) and order status is always re-read from Mercado Pago, never trusted from webhook payloads or the browser.
