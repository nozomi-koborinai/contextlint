---
title: pre-commit / local hooks
description: Local hook setups that invoke contextlint via Husky / lint-staged / the pre-commit framework.
---

Calling contextlint from local git hooks keeps commits with violations out of the repository in the first place. You get feedback at commit time, before CI even runs. This page covers three common setups.

## Speed assumptions

contextlint completes in seconds, so running it at the `pre-commit` stage doesn't affect feel. For repositories with many files, you can scope down to only changed files, or leave full lint (including cross-file rules) to CI — pick a configuration that matches your goals.

## Husky

[Husky](https://typicode.github.io/husky/) is the most widely used git-hook manager in the npm ecosystem.

After installing Husky, create `.husky/pre-commit`:

```sh
#!/usr/bin/env sh
. "$(dirname "$0")/_/husky.sh"

npx contextlint
```

This setup lints the entire repository on every commit. To narrow it down to changed files, combine with lint-staged below.

## lint-staged

[lint-staged](https://github.com/lint-staged/lint-staged) lets you run lint only against files staged in git.

Add the configuration to `package.json`:

```json
{
  "lint-staged": {
    "*.md": "contextlint"
  }
}
```

Have `.husky/pre-commit` call `npx lint-staged`:

```sh
#!/usr/bin/env sh
. "$(dirname "$0")/_/husky.sh"

npx lint-staged
```

Note, however, that contextlint's **cross-file rules** like REF-001, REF-002, TBL-006, and GRP-\* require a view of the entire repository. Passing only staged files can produce false positives or miss violations. If you want to use lint-staged, either drop dependence on cross-file rules or treat CI as the final check.

## pre-commit framework

[pre-commit](https://pre-commit.com/) is a Python-based, polyglot hook framework. Register it as a local hook in `.pre-commit-config.yaml`:

```yaml
repos:
  - repo: local
    hooks:
      - id: contextlint
        name: contextlint
        entry: npx contextlint
        language: system
        files: \.md$
        pass_filenames: false
```

`pass_filenames: false` is set because contextlint expects to run against the whole repository. If you want the CLI to only see changed files, switch it to `pass_filenames: true`. Same caveat as lint-staged: cross-file rules may report differently.

## Which to choose

| Aspect | Husky | Husky + lint-staged | pre-commit framework |
| --- | --- | --- | --- |
| Installation | npm only | npm only | Python only |
| Limit to changed files | Not supported | Supported | Supported |
| Multi-language project | Tied to the npm ecosystem | Tied to the npm ecosystem | Spans multiple languages |
| Cross-file rule accuracy | Full | Limited | Limited |

To evaluate cross-file rules correctly, contextlint needs to run against the whole repository. The safest setup is to leave the local hook unscoped — or to skip cross-file rules locally and rely on CI for the full lint.

## Combining with CI

Local hooks are about "early detection at commit time"; CI is about "final check before merge". Enabling both gives you a two-layered defense:

- Catches local mistakes the moment they happen
- Falls back to CI even if a hook is skipped

For CI integration, see [GitHub Actions](/docs/integrations/ci-cd/github-actions/).
