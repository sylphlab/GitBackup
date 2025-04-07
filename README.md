# GitHub Repository Backup Tool

This tool automatically backs up (clones or updates) all accessible repositories associated with a GitHub Personal Access Token (PAT).

## Features

- Fetches all repositories (owner, collaborator, public, private) accessible by the provided PAT.
- Clones new repositories into the `./backup` directory.
- Forcefully updates existing repositories in the `./backup` directory to match the remote default branch (overwrites local changes).
- Prompts for PAT if not found in the `.env` file.

## Prerequisites

- Node.js (which includes npm)
- Git

## Setup

1.  **Clone this repository (or download the files).**
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Create a `.env` file (optional but recommended):**
    Create a file named `.env` in the project root and add your GitHub PAT:
    ```
    GITHUB_PAT=ghp_YourPersonalAccessTokenHere
    ```
    *Note: Ensure your PAT has the necessary 'repo' scope to access your repositories.*
    *Also ensure your Git installation is configured for HTTPS authentication (e.g., via Git Credential Manager or similar) or use SSH keys.*

## Usage

Run the tool using:

```bash
npm start
```

- If the `GITHUB_PAT` is defined in the `.env` file, the tool will use it directly.
- Otherwise, it will prompt you to enter your PAT securely in the terminal.

Backed-up repositories will be located in the `backup` directory within the project folder.

**Important:** The update process uses `git reset --hard` on the default branch. Any local changes in the backed-up repositories on that branch **will be lost**.

## Daily Automatic Updates

This tool itself does not include a built-in scheduler. To run it automatically every day, you need to use your operating system's task scheduler:

- **Windows:** Use Task Scheduler to create a task that runs `npm start` in this project's directory daily.
- **macOS/Linux:** Use `cron` to create a cron job that runs `npm start` in this project's directory daily.

**Example Cron Job (runs daily at 3:00 AM):**

```cron
0 3 * * * cd /path/to/your/GitBackup && npm start >> /path/to/your/backup.log 2>&1
```

Replace `/path/to/your/GitBackup` with the actual path to this project directory and `/path/to/your/backup.log` with your desired log file location.
