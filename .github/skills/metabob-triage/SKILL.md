---
name: metabob-triage
description: Triage and fix workflow for Metabob-reported code issues. Use when asked to investigate, filter, prioritize, or fix problems discovered by Metabob.
allowed-tools: [shell]
---

This skill helps Copilot use Metabob outputs to determine whether reported problems need fixes, to gather all relevant Metabob metadata, to filter by categories (e.g., runtime, security, tests, performance), and to avoid re-addressing fixed or stale problems.

When to use
- When the user asks to triage Metabob-reported issues
- When the user requests scanning for specific categories (runtime, security, tests, performance)
- When the user asks to prioritize actionable problems

Inputs
- problem_id(s): string or list of strings
- filters: YAML/JSON object with keys: category (string or list), severity_min, severity_max, age_days, unresolved_only (bool), repo_path
- thresholds: staleness_days (default 90), occurrence_min (default 1)

Metabob fields to use
- problem_id, title, description
- file_path(s), line_range(s)
- severity (low/med/high/critical or numeric)
- created_at, updated_at, last_seen
- resolved (boolean), annotations
- occurrences_count, failing_tests, stack_traces, reproduce_steps
- suggested_fixes, related_files, impact_paths

Primary workflow
1. Validate input: require problem_id(s) or filters.
2. Query Metabob: use `metabob.search_codebase_issues` or equivalent API with requested filters.
3. Exclude stale/fixed problems:
   - resolved == true → exclude
   - last_seen/updated_at older than staleness_days → exclude unless user overrides
   - occurrences_count < occurrence_min → exclude
   - Search git history (commit messages/annotations) for evidence of a fix; if found, exclude and report evidence.
4. For remaining problems: gather context (list_file_components, analyze_change_impact, assess_deletion_safety, suggest_related_changes).
5. Prioritize: score by severity, reproducibility (failing tests/stack traces), impact (blast radius), and occurrences.
6. Present summary and recommended action: Fix now / Defer / Ignore.
7. If user approves fix: create SQL todo (INSERT into todos), mark in_progress, implement changes, run tests, call `metabob.mark_problem_complete` and `metabob.annotate_component`, update todo to done.

Filtering by category
- Accepts `filters.category` (string or list). Examples: "runtime", "security", "tests", "performance".
- If Metabob has category labels/tags, use them directly. Otherwise map keywords from title/description to categories.
- Support combined filters: category + severity_min + age_days + unresolved_only.
- If category not provided, prompt user with choices using the agent's interactive flow.

Avoiding already-fixed or old problems
- Primary checks: `resolved == false` and `last_seen` within `staleness_days` (default 90)
- Secondary checks: search git commits for problem_id or standard annotation patterns (e.g., "mark_problem_complete: <problem_id>") and inspect Metabob annotations
- If evidence of fix exists, skip the problem and include the evidence in the report

Outputs
- Summary list: problem_id, title, severity, file_path, last_seen, occurrences, recommended_action
- Detailed view per problem: context, stack traces, failing tests, impact graph, suggested fixes
- Action plan for approved fixes: files to edit, tests to run, and todo id

Post-fix
- Call Metabob APIs to mark problem complete and annotate changed components
- Update SQL todos to 'done'
- Run suggest_related_changes for batching further fixes

Safety
- Do not exfiltrate secrets or sensitive data
- Avoid printing full commit contents when scanning git history

Examples
- "Triage runtime issues unresolved in last 30 days with severity >= high"
- "Investigate problem abc-123: is it still relevant and what's the blast radius?"

Notes for implementers
- Prefer Metabob semantic queries first; then use list_file_components for exact component names before analyze_change_impact
- Always compute blast radius and deletion safety before risky changes
- Track work with SQL todos and update statuses
