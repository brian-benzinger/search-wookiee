# Backlog

## CI/CD

- [x] Pin `actions/checkout` and `actions/setup-node` to full commit SHAs (rubric #4: action pinning) — pinned to v4.3.1/v4.4.0; Dependabot (already enabled) will keep them current
- [x] Add `npm audit` step to CI to surface any future dependency vulnerabilities (rubric #6: security scanning) — currently a no-op since there are no runtime deps, but useful as deps are added
- [x] Add top-level `permissions: {}` to the CI workflow for defense-in-depth (rubric #4: least privilege) — ensures future jobs inherit no permissions unless explicitly granted
- [ ] Enforce branch protection on `main` requiring the `test` check to pass before merge (rubric #8: required checks) — needs repo-admin rights to configure
- [x] Add Dependabot `npm` ecosystem entry to monitor future npm dependencies proactively
