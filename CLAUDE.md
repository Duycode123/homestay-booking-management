# CLAUDE.md

All project rules for agents live in `AGENTS.md` — it is the single source of truth. Follow everything in it:

@AGENTS.md

## Claude Code specific notes

- Backend + database work takes priority unless the user explicitly asks for frontend work (see AGENTS.md "Backend Priority").
- Backend build/test (run from `backend/`): `mvn test`, `mvn -DskipTests compile`
- Never edit anything under `backend/target/` or `frontend/node_modules/` / `frontend/.next/`.
- Sprint direction and issue priorities are described in `task.md`; use-case docs live under `docs/use-cases/`; database docs and SQL live under `database/`.
