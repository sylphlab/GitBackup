<!-- Version: 1.3 | Last Updated: 2025-07-08 -->
# Active Context

**Current Focus:** Rebuilding project after root directory overwrite by `github/gitignore` repository.

**Recent Changes:**
- Identified root cause: `git clone` likely targeted project root instead of `./backup` subfolder due to a bug.
- Cleaned up overwritten files.
- Recreating project structure and files from memory/logs.

**Next Steps:**
1. Finish recreating project files (tsconfig, README, src/main.ts, .gitignore).
2. Re-initialize Git repository.
3. Re-install npm dependencies.
4. **CRITICAL:** Review and fix the bug in `cloneOrUpdateRepository` that caused the root directory overwrite. The clone target path calculation or execution context was likely incorrect under specific error/concurrent conditions.
5. Test the application thoroughly after fixing the bug.