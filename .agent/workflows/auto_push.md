---
description: Workflow to automatically commit and push changes to production
---

This workflow ensures that all code changes are immediately committed and pushed to the remote repository.

// turbo-all
1. Check for changes
   ```bash
   git status
   ```

2. Add all changes
   ```bash
   git add .
   ```

3. Commit changes (Prompt the user for a commit message if not provided, otherwise use a descriptive default)
   ```bash
   git commit -m "chore: auto-commit changes"
   ```

4. Push to production
   ```bash
   git push origin main
   ```
