<!-- Version: 1.1 | Last Updated: 2025-07-08 -->
# Tech Context

- **Language:** TypeScript
- **Runtime:** Node.js
- **Package Manager:** npm
- **Module System:** ES Modules (`"type": "module"` in package.json, `"module": "NodeNext"` in tsconfig.json)
- **Core Libraries:**
    - `@octokit/rest`: GitHub API interaction.
    - `simple-git`: Local Git operations.
    - `dotenv`: Environment variable management (for PAT).
    - `inquirer`: Interactive command-line prompts (for PAT input).
- **Build Tool:** `tsc` (TypeScript Compiler)
- **Target Directory:** `f:/newgit/GitBackup`
- **Backup Location:** `./backup` (relative to project root)
- **Playbook Guideline Versions:** (None consulted yet)