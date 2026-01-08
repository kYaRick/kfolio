# AGENT MANIFEST & OPERATIONAL GUIDELINES (SDD-DRIVEN)

## 1. PROJECT VISION & TECHNICAL ECOSYSTEM
* **Runtime:** .NET 10 (Blazor WebAssembly Standalone).
* **Language:** C# 14 (Strict Nullable Reference Types, Zero-Warning Policy).
* **UI Framework:** **MudBlazor (Latest)**. Prioritize native components and the built-in theming engine.
* **Styling:** **Modern Vanilla CSS**. Use Native Nesting, Custom Properties (Variables), and Container Queries. **SCSS/Sass is prohibited**. Mandate **CSS Isolation** (`.razor.css`) for all components.
* **Testing Suite:** xUnit, bUnit (UI), NSubstitute (Mocking), and Shouldly (Assertions).
* **Automation:** **C# for DevOps**. All CI/CD, GitHub Actions, and utility scripts must be implemented in C# and executed via `dotnet run`.
* **Performance:** Optimized for **AOT** and **Aggressive Trimming**. Use Source Generators for JSON and Logging; avoid Reflection.

---

## 2. REPOSITORY HIERARCHY & AUTHORITY
| Path | Governance | Agent Permissions |
| :--- | :--- | :--- |
| `README.md` | General Identity | **Read-Only**. |
| `specs/` | **Technical Source of Truth** | **Read-Only**. Absolute authority for logic and architecture. |
| `docs/` | Human Strategic Logic | **Read-Only**. Strategic business rules. |
| `docs/.agents/` | AI Sandbox | **Full Access**. Storage for logs, tech-docs, and proposals. |

---

## 3. SDD OPERATIONAL PROTOCOL (METHODOLOGY)
1.  **Synchronization:** Re-analyze `specs/` and the current codebase before initiating any task.
2.  **Constraint Enforcement:** Code changes must strictly align with the specifications in `specs/`. If a task conflicts with a spec, stop and report.
3.  **Gap Analysis:** If logic is missing from `specs/`, do not assume. Flag as `[UNKNOWN]` and request human clarification.
4.  **Self-Evolution:** Proactively propose updates to this manifest and project dependencies to maintain 2026 industry benchmarks.
5.  **Verification Gate:** Tasks are "Done" only if they pass all tests, contain no compiler warnings, and satisfy WCAG 2.2 accessibility standards.

---

## 4. CODE CRAFTSMANSHIP & DOCUMENTATION
* **Documentation Standards:**
    * **English language only.**
    * **Public Members:** XML `<summary>` tags mandatory.
    * **Internal Logic:** Minimize comments. Use only to explain "Why" (intent), not "What" (action).
    * **Clean Code:** Prioritize self-documenting identifiers and `GlobalUsings.cs` for noise reduction.
* **C# 14 Usage:** Actively utilize Primary Constructors, Interceptors, and Collection Expressions.
* **Architecture:** Maintain **Static Web Asset (SWA)** compatibility.

---

## 5. AUTOMATION & DEVOPS
* **Scripting:** All development and deployment automation must be C#-based.
* **Execution:** Scripts must be executable via `dotnet run` (e.g., `dotnet run scripts/BuildUtility.cs`).
* **Integrity:** Automation logic must be as modular and well-tested as the primary application.

---

## 6. AGENT OUTPUTS (`docs/.agents/`)
* **`/logs/`**: SDD validation reports (checklist of implemented spec requirements) and test results.
* **`/tech/`**: Auto-generated technical deep-dives and architectural diagrams (Mermaid.js).
* **`/refactoring/`**: Proactive proposals for modernization and dependency updates.