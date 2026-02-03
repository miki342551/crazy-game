# Deployment Guide

This guide explains how to deploy changes to GitHub and Vercel for the Crazy Remix game.

## Prerequisites

- Git installed on your system
- GitHub repository set up (miki342551/crazy-game)
- Vercel connected to your GitHub repository (for automatic deployments)

## Quick Deployment

### Standard Git Workflow

```bash
# 1. Check what files were modified
git status

# 2. Stage all modified files
git add .
# OR stage specific files
git add path/to/file1 path/to/file2

# 3. Commit the changes with a descriptive message
git commit -m "Description of your changes"

# 4. Push to GitHub
git push
```

## Detailed Steps

### 1. Check Status

Before making any commits, check what files have been modified:

```bash
git status
```

This will show:
- **Modified files** (in red) - files that have changes but aren't staged
- **Staged files** (in green) - files ready to be committed
- **Untracked files** - new files that Git doesn't know about yet

### 2. Stage Changes

Add files to the staging area (preparing them for commit):

```bash
# Stage ALL changes (most common)
git add .

# Stage specific files only
git add src/logic/gameState.js src/index.css

# Stage all files in a folder
git add src/logic/
```

### 3. Commit Changes

Create a commit with a descriptive message:

```bash
git commit -m "Your commit message here"
```

**Good commit message examples:**
- `"Fix: Update draw card counter logic"`
- `"Feature: Add mobile optimization for cards"`
- `"Refactor: Simplify validation logic in gameState"`
- `"Docs: Update README with new game rules"`

### 4. Push to GitHub

Push your commits to the remote repository:

```bash
# If upstream is already set
git push

# First time pushing a new branch (set upstream)
git push --set-upstream origin main
```

## Automatic Vercel Deployment

Once you push to GitHub:

1. **Vercel detects the push** - If your Vercel project is connected to the GitHub repository
2. **Auto-deploy starts** - Vercel automatically builds and deploys your changes
3. **Check deployment status** - Visit your Vercel dashboard to monitor progress
4. **Live in minutes** - Changes are typically live within 1-2 minutes

### Vercel Dashboard

Visit: https://vercel.com/dashboard

- View deployment logs
- Check build status
- Preview deployments before they go live
- Roll back to previous versions if needed

## Common Scenarios

### Undo Last Commit (Before Push)

```bash
# Undo commit but keep changes
git reset --soft HEAD~1

# Undo commit and discard changes
git reset --hard HEAD~1
```

### View Commit History

```bash
# View recent commits
git log --oneline -10

# View detailed commit info
git log
```

### Discard Local Changes

```bash
# Discard changes to specific file
git restore path/to/file

# Discard all changes (dangerous!)
git restore .
```

### Pull Latest Changes from GitHub

```bash
# Pull latest changes from remote
git pull
```

## Troubleshooting

### "fatal: The current branch has no upstream branch"

**Solution:** Set the upstream branch:
```bash
git push --set-upstream origin main
```

### Merge Conflicts

If you get merge conflicts when pulling:

1. Open the conflicting files
2. Resolve conflicts (look for `<<<<<<<`, `=======`, `>>>>>>>` markers)
3. Stage the resolved files: `git add .`
4. Complete the merge: `git commit`
5. Push: `git push`

### Authentication Issues

If GitHub asks for credentials:

1. Use a **Personal Access Token** instead of password
2. Generate token at: https://github.com/settings/tokens
3. Use token as password when prompted

## Best Practices

1. ✅ **Commit often** - Small, focused commits are better than large ones
2. ✅ **Write clear messages** - Explain *what* changed and *why*
3. ✅ **Pull before push** - Always pull latest changes before pushing
4. ✅ **Test locally** - Test changes before committing
5. ✅ **Use branches** - For larger features, use feature branches
6. ❌ **Don't commit secrets** - Never commit API keys, passwords, etc.

## Git Branch Workflow (Advanced)

For larger features:

```bash
# Create and switch to new branch
git checkout -b feature/new-game-mode

# Make changes and commit
git add .
git commit -m "Add new game mode"

# Push branch to GitHub
git push -u origin feature/new-game-mode

# Merge back to main (via GitHub Pull Request recommended)
# Or locally:
git checkout main
git merge feature/new-game-mode
git push
```

## Resources

- [Git Documentation](https://git-scm.com/doc)
- [GitHub Guides](https://guides.github.com/)
- [Vercel Documentation](https://vercel.com/docs)
