---
name: Deployment vs repo drift (autoscale)
description: A fix in the repo is not live until republished; how to prove it before debugging further.
---

# Autoscale deploys do not auto-update from the repo

Replit `deploymentTarget = "autoscale"` runs the build captured at the last
publish. Committing a fix to `main` does NOT update production.

**Symptom that fooled us:** a bug "still happens in production" even though the
fix and its logging are clearly in the code.

**How to prove the fix isn't live (do this BEFORE changing more logic):**
1. In `git log --oneline`, find the most recent `Published your App` commit.
   If the fix commits are ABOVE it (newer), the fix is not deployed.
2. Pull deployment logs. If unconditional log lines you added in the fix
   (e.g. `[bids][timing]`) are ABSENT despite the user reproducing the issue,
   the deployed binary predates the fix.

**Why:** deployment logs can only contain log lines that exist in the deployed
build. Absence of your new logs = old build.

**How to apply:** when asked to debug a "still failing" production issue, first
confirm the fix is actually deployed (publish-commit ordering + presence of new
log lines) before instrumenting or rewriting anything.
