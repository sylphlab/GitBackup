<!-- Version: 1.0 | Last Updated: 2025-07-08 -->
# Project Brief: GitHub Repository Backup Tool

**Goal:** Create a TypeScript application to back up all repositories from a specified GitHub user's account.

**Core Features:**
1. Prompt user for GitHub Personal Access Token (PAT).
2. Fetch all repositories associated with the PAT.
3. Clone new repositories to a designated local directory (e.g., `./backup`).
4. Forcefully update existing repositories to match the remote default branch.
5. Provide a mechanism for regular (e.g., daily) updates.

**Target User:** Developers needing a simple way to back up their personal or organizational GitHub repositories locally.

**Non-Goals:**
- Complex UI.
- Support for other Git platforms (GitLab, Bitbucket).
- Backup of non-default branches' working directories.
