<!-- Version: 1.0 | Last Updated: 2025-07-08 -->
# Product Context

**Problem:** Developers risk data loss if GitHub experiences outages or if their account is compromised. Manually backing up many repositories is tedious.

**Solution:** An automated tool that regularly clones/force-updates all repositories associated with a user's PAT to a local machine.

**User Experience:** Simple command-line interaction: provide PAT, the tool handles the rest. Clear feedback on progress and errors.