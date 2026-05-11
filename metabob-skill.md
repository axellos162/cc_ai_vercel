# Metabob Skill for Copilot (metabob-skill.md)



## Purpose
This skill guides the assistant to use Metabob outputs to decide whether reported problems need fixing, to gather all relevant Metabob data, to filter by categories (e.g., runtime issues), and to avoid re-addressing problems that are already fixed or stale.

## When to use
- User asks to investigate or fix Metabob-reported problems
- User requests scanning or triage for specific categories (runtime, security, tests, performance)
- User asks to prioritize actionable problems

## Inputs accepted
- problem_id (single or list)
- filters: {category, severity_min, severity_max, age_days, unresolved_only, repo_path}
- thresholds: {staleness_days (default 90), occurrence_min (default 1)}

## Data fields to consume from Metabob (use if present)
- problem_id, title, description
- file_path(s), line_range(s)
- severity (low/med/high/critical or numeric)
- created_at, updated_at, last_seen
- resolved (boolean), annotations
- occurrences_count, failing_tests, stack_traces, reproduce_steps
- suggested_fixes, related_files, impact_paths

## Workflow (step-by-step)
1. Validate input: ensure either problem_id(s) or a filter query present.
2. Query Metabob for matching problems (search_codebase_issues or speciality API). Include all returned metadata.
3. Filter out stale/fixed problems:
   - Exclude if resolved == true.
   - Exclude if last_seen/updated_at older than staleness_days (default 90) unless user overrides.
   - Exclude if occurrences_count < occurrence_min.
   - Optionally check git history: reject if a commit or annotation indicates it was fixed (search for problem_id or standardized annotation text). This is recommended before making changes.
4. For each remaining problem gather: list_file_components(file_path), analyze_change_impact(file_path,component) to compute blast radius, assess_deletion_safety(file_path,component) when deletion is considered.
5. Gather context: failing tests, stack traces, reproduce steps, suggested_fixes, and related_files (suggest_related_changes).
6. Compute a prioritized recommendation using severity, reproducibility, impact (number of dependent components), and failing tests. Present one of: Fix now (create todo), Defer (document reason), Ignore (document and annotate).
7. If user approves a fix: set SQL todo (INSERT into todos), mark in_progress, implement changes, run tests, then call metabob-mark_problem_complete(problem_id, file_path, resolution_notes) and metabob-annotate_component(file_path, component, reason).
8. After fix: run suggest_related_changes to find siblings and consider batch fixes.

## Filtering by specific categories (e.g., runtime issues)
- Accept `filters.category` as a string or list. Examples: "runtime", "security", "tests", "performance".
- Translate category filters into Metabob query terms (e.g., `category:runtime` or search in tags/labels returned by Metabob).
- Provide an interactive path: if category unspecified, prompt user with choices using the CLI ask_user flow.
- Support combined filters: category + severity_min + age_days.

Example filter payload:
{
  "category": "runtime",
  "severity_min": "high",
  "age_days": 30,
  "unresolved_only": true
}

## Avoiding old/fixed problems
- Primary checks:
  - resolved flag must be false
  - last_seen or updated_at within staleness_days (default 90)
  - occurrences_count >= occurrence_min
- Secondary checks:
  - Search git commits for problem_id or standard annotation patterns (e.g., "mark_problem_complete: <problem_id>")
  - Check metabob annotations for resolution notes
- If any evidence indicates the problem was fixed, skip and report the evidence to the user.

## Recommended defaults and overrides
- staleness_days: 90 (override by user)
- occurrence_min: 1
- severity cutoff: configurable (e.g., only high/critical by default)

## Output format
- Summary table: problem_id, title, severity, file_path, last_seen, occurrences, recommended_action
- Detailed context section for selected problem: stack traces, failing tests, impact graph, suggested_fixes
- Action plan if user approves: steps to fix, files to change, tests to run, todo id

## Post-fix responsibilities (enforced by the skill)
- Call metabob-mark_problem_complete with a detailed resolution_notes explaining what was changed and why
- Call metabob-annotate_component for the modified component(s)
- Update SQL todos to 'done'

## Integration notes for implementers (assistant guidance)
- Prefer Metabob semantic queries first: search_codebase_issues(problem_id or query)
- Use list_file_components to ensure exact component naming before calling analyze_change_impact
- Always call analyze_change_impact and assess_deletion_safety for risky changes
- Use suggest_related_changes to find co-change files and batch fixes
- Track work via SQL todos table and update status consistently

## Interaction patterns
- "Triage runtime issues in repo": prompt for category filters, run search, return prioritized list
- "Investigate problem abc-123": fetch problem metadata, validate freshness, compute blast radius, recommend action
- "Fix problem abc-123": prepare todo, run fix workflow, mark problem complete and annotate component

## Examples
1) Triage runtime issues unresolved in last 30 days with severity >= high:
   filters = {category: "runtime", severity_min: "high", age_days: 30, unresolved_only: true}
   -> call metabob.search_codebase_issues(filters) -> filter by last_seen >= now-30d -> proceed

2) Validate problem by id and ensure it's not already fixed:
   - call search_codebase_issues(problem_id)
   - if problem.resolved == true or last_seen < now-90d: report "stale or resolved"
   - else gather analyze_change_impact and recommend fixes

## Safety and privacy
- Never exfiltrate secrets from repository or external systems
- When searching git history, avoid printing sensitive commit content

## FAQ
Q: How to restrict to only runtime problems?
A: Use filters.category = "runtime". If Metabob lacks a category field, search keywords in title/description and tags, or ask the user to confirm picks.

Q: How to avoid re-fixing fixed issues?
A: Rely on resolved flag, last_seen threshold, occurrence_count, and quick git/annotation search for proof-of-fix. If uncertain, report as "uncertain: needs manual verification".

---

Version: 1.0
Maintainer: Copilot / Metabob integration
Guidance: Use Metabob tool outputs as ground truth; cross-check with repo metadata before making changes.
