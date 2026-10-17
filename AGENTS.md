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

## FactoryGuard architecture
- Keep the TanStack React framework and file-based routes; the hosted environment requires it, with each workspace view in a modular feature.
- Keep sample records and service adapters separate from presentation; a backend team can replace the adapter without redesigning views.
- Keep status classification out of the frontend adapter; production health statuses and thresholds must come from confirmed requirements or backend results.
- Store display preferences only in browser storage, alert edits and the single demo conversation only in session state; no backend is required for the prototype.
- Use AI Elements for the technician transcript and composer; the technician adapter returns explicitly labelled fixed demo messages rather than making AI calls or using server streaming.
- Use Recharts for deterministic sample sensor histories with global semantic color tokens; no chart is simulated live telemetry.
- Treat proposed endpoint paths as disabled configuration; confirm schemas and configure the analysis endpoint before enabling network transport.
