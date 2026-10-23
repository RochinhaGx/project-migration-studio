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
- Keep imported TanStack content routes and the shared StoreShell/StoreProvider at the root so navigation preserves transient bag state.
- Store custom quotes through validated, rate-limited server functions in Cloud; uploaded customer files remain private.
- Keep upload, order-success animation and cookie preferences in focused shared store components so their presentation stays consistent.
- Cookie preferences are browser-local consent settings; do not initialize optional analytics without stored consent.
- Preserve generated Cloud clients and middleware; never import credentials or integration configuration from an uploaded archive.
- Export customizer STL from the displayed Three.js meshes in millimetres, and share prepared browser files through native sharing with explicit download fallback; WhatsApp links cannot attach files.
- Pix payments go through Mercado Pago server-side only; the server recomputes product prices and freight (shared rules in src/lib/payment-rules.ts) and order status is always re-read from Mercado Pago, never trusted from webhook payloads or the browser.
