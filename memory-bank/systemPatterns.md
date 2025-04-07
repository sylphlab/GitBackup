<!-- Version: 1.1 | Last Updated: 2025-07-08 -->
# System Patterns

- **Authentication:** GitHub Personal Access Token (PAT).
- **API Interaction:** Use `@octokit/rest` library for GitHub API calls.
- **Git Operations:** Use `simple-git` library for local clone/update operations (clone, fetch/checkout/reset).
- **Configuration:** Store PAT potentially via environment variables (`dotenv`) or secure input (`inquirer`).
- **Scheduling:** Initially manual execution. Daily updates can be handled externally (e.g., Task Scheduler, cron) by running the compiled script.
- **Module System:** ES Modules (ESM).