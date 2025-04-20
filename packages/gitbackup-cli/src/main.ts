#!/usr/bin/env node
// src/main.ts
import dotenv from 'dotenv';
import inquirer from 'inquirer';
import { Octokit } from '@octokit/rest';
import type { RestEndpointMethodTypes } from '@octokit/rest';
import { simpleGit, SimpleGit, SimpleGitOptions, CheckRepoActions } from 'simple-git'; 
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

// Load environment variables from .env file
dotenv.config();

// Recreate __dirname for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define the backup directory relative to the project root
// **CRITICAL FIX:** Ensure backupDir is correctly resolved and used.
const projectRoot = path.resolve(__dirname, '../'); // Go up one level from dist/main.js
const backupDir = path.join(projectRoot, 'backup'); // Backup dir inside project root

// Type alias for repository data for clarity
type Repository = RestEndpointMethodTypes["repos"]["listForAuthenticatedUser"]["response"]["data"][0];

console.log('GitHub Backup Tool Initialized');
console.log(`Project root determined as: ${projectRoot}`);
console.log(`Backup directory set to: ${backupDir}`);

/**
 * Gets the GitHub Personal Access Token (PAT).
 */
async function getGitHubToken(): Promise<string> {
  const tokenFromEnv = process.env.GITHUB_PAT;
  if (tokenFromEnv) {
    console.log('GitHub PAT found in environment variables.');
    return tokenFromEnv;
  }

  console.log('GitHub PAT not found in environment variables.');
  const answers = await inquirer.prompt([
    {
      type: 'password',
      name: 'githubToken',
      message: '請輸入你的 GitHub Personal Access Token (PAT):',
      mask: '*',
      validate: (input: string) => {
        if (!input || input.trim().length === 0) {
          return 'PAT 不能為空。 (PAT cannot be empty.)';
        }
        if (!input.startsWith('ghp_') && !input.startsWith('github_pat_')) {
           console.warn('\n   警告：輸入的 Token 看起來不像標準的 GitHub PAT 格式。請確保它是正確的。');
        }
        return true;
      },
    },
  ]);
  return answers.githubToken.trim();
}

/**
 * Fetches all repositories for the authenticated user.
 */
async function fetchUserRepositories(octokit: Octokit): Promise<Repository[]> {
  try {
    console.log('正在獲取 repository 列表... (Fetching repository list...)');
    const repos = await octokit.paginate(octokit.rest.repos.listForAuthenticatedUser, {
        affiliation: 'owner,collaborator',
        visibility: 'all',
        per_page: 100,
    });
    console.log(`成功獲取 ${repos.length} 個 repositories。 (Successfully fetched ${repos.length} repositories.)`);
    return repos;
  } catch (error: any) {
    console.error(`獲取 repositories 時出錯：(Error fetching repositories:) ${error.message}`);
    if (error.status === 401) {
        console.error('   -> 驗證失敗。請檢查你的 GitHub PAT 是否有效並具有正確的權限 (repo scope)。');
    } else if (error.status === 403) {
        console.error('   -> API 速率限制超出或權限不足。請稍後再試或檢查 PAT 權限。');
    }
    throw new Error(`Error fetching repositories: ${error.message}`);
  }
}

/**
 * Checks if a directory exists.
 */
async function directoryExists(dirPath: string): Promise<boolean> {
    try {
        // **CRITICAL FIX:** Ensure path is absolute before checking
        const absolutePath = path.resolve(dirPath);
        const stats = await fs.stat(absolutePath);
        return stats.isDirectory();
    } catch (error: any) {
        if (error.code === 'ENOENT') {
            return false; // Doesn't exist
        }
        // Log other stat errors
        console.error(`Error checking directory existence for ${dirPath}:`, error);
        throw error; 
    }
}

/**
 * Checks if a directory is a valid Git repository.
 */
async function isGitRepository(dirPath: string): Promise<boolean> {
    try {
        // **CRITICAL FIX:** Initialize simple-git with the absolute path
        const absolutePath = path.resolve(dirPath);
        const git = simpleGit(absolutePath);
        return await git.checkIsRepo(CheckRepoActions.IS_REPO_ROOT);
    } catch (error) {
        // Log errors during checkIsRepo for debugging
        // console.debug(`Error checking if ${dirPath} is repo:`, error); 
        return false;
    }
}

/**
 * Forcefully updates an existing repository to match the remote default branch.
 */
async function forceUpdateRepository(repo: Repository, localPath: string): Promise<void> {
    const repoName = repo.name;
    const repoUrl = repo.clone_url;
    const defaultBranch = repo.default_branch;
    const remoteDefaultBranch = `origin/${defaultBranch}`;
    // **CRITICAL FIX:** Ensure git commands run within the specific repo directory
    const gitOptions: Partial<SimpleGitOptions> = { 
        baseDir: path.resolve(localPath), // Set baseDir to the specific repo path
        binary: 'git',
        maxConcurrentProcesses: 6,
    };
    const git: SimpleGit = simpleGit(gitOptions);

    console.log(`  [${repoName}] 目錄已存在，嘗試強制更新到遠端 ${defaultBranch} 分支...`);
    try {
        // 1. Check and update remote URL if necessary
        const remotes = await git.getRemotes(true);
        const origin = remotes.find(r => r.name === 'origin');
        let currentRemoteUrl = origin?.refs?.fetch;
        
        const normalizedRepoUrl = repoUrl.endsWith('.git') ? repoUrl : `${repoUrl}.git`;
        const normalizedCurrentRemoteUrl = currentRemoteUrl?.endsWith('.git') ? currentRemoteUrl : `${currentRemoteUrl}.git`;

        if (!origin || normalizedCurrentRemoteUrl !== normalizedRepoUrl) {
            console.log(`  [${repoName}] 遠端 URL 不匹配或不存在 ('${currentRemoteUrl}' vs '${repoUrl}')，正在更新...`);
            // Use set-url if origin exists, otherwise add (should be rare)
            await git.remote(origin ? ['set-url', 'origin', repoUrl] : ['add', 'origin', repoUrl]);
            console.log(`  [${repoName}] 遠端 URL 已更新為: ${repoUrl}`);
        }

        // 2. Fetch all updates from origin and prune deleted remote branches
        await git.fetch('origin', '--prune');
        console.log(`  [${repoName}] Fetch 完成。`);
        
        // 3. Ensure we are on the default branch (or checkout if not)
        await git.checkout(defaultBranch);
        console.log(`  [${repoName}] 已切換到 ${defaultBranch} 分支。`);

        // 4. Force reset local default branch to match the fetched remote default branch
        await git.reset(['--hard', remoteDefaultBranch]);
        console.log(`  [${repoName}] 強制更新成功，本地 ${defaultBranch} 已與 ${remoteDefaultBranch} 同步。`);

    } catch (updateError: any) {
        console.error(`  [${repoName}] 強制更新失敗： ${updateError.message}`);
        if (updateError.stderr) {
            console.error(`  [${repoName}] Git stderr: ${updateError.stderr}`);
        }
        const errorMsg = (updateError.message + (updateError.stderr || '')).toLowerCase();
        if (errorMsg.includes('could not read') || errorMsg.includes('authentication failed') || errorMsg.includes('access rights')) {
             console.error(`  [${repoName}] -> 提示：Git 操作失敗，可能是 HTTPS 認證問題。請檢查你的 Git Credential Manager (Windows) 或相關憑據輔助程序配置，或考慮使用 SSH 密鑰進行認證。`);
             console.error(`     (Hint: Git operation failed, possibly due to HTTPS authentication issues. Check Git Credential Manager (Windows) or credential helper setup, or consider using SSH keys.)`);
        }
    }
}

/**
 * Tries to clone a repository, and if it fails because the directory exists, 
 * it attempts to forcefully update the existing repository.
 */
async function cloneOrUpdateRepository(repo: Repository, baseDir: string): Promise<void> {
    const repoName = repo.name;
    const repoUrl = repo.clone_url;
    // **CRITICAL FIX:** Ensure localPath is absolute and correctly points inside backupDir
    const localPath = path.resolve(baseDir, repoName); 
    
    // **CRITICAL FIX:** Ensure gitOptions for clone does NOT specify a baseDir initially
    const cloneGitOptions: Partial<SimpleGitOptions> = {
        binary: 'git',
        maxConcurrentProcesses: 6,
    };

    // **Safety Check:** Prevent cloning into project root or outside backup dir
    if (!localPath.startsWith(path.resolve(baseDir))) {
        console.error(`  [${repoName}] 錯誤：計算出的本地路徑 '${localPath}' 不在備份目錄 '${baseDir}' 內。已跳過。`);
        console.error(`     (Error: Calculated local path '${localPath}' is outside the backup directory '${baseDir}'. Skipping.)`);
        return;
    }
    if (localPath === path.resolve(projectRoot)) {
         console.error(`  [${repoName}] 錯誤：計算出的本地路徑與項目根目錄相同！已跳過以防止覆蓋。`);
         console.error(`     (Error: Calculated local path is the same as the project root! Skipping to prevent overwrite.)`);
         return;
    }

    try {
        // Always try to clone first
        console.log(`  [${repoName}] 嘗試克隆到 '${localPath}'...`);
        await fs.mkdir(baseDir, { recursive: true }); // Ensure base directory exists
        const cloneGit: SimpleGit = simpleGit(cloneGitOptions); // Initialize without baseDir for clone
        await cloneGit.clone(repoUrl, localPath); // Pass absolute localPath as target
        console.log(`  [${repoName}] 克隆成功。`);

    } catch (cloneError: any) {
        const errorMsg = (cloneError.message + (cloneError.stderr || '')).toLowerCase();
        if (errorMsg.includes('already exists and is not an empty directory')) {
            console.log(`  [${repoName}] 克隆失敗因為目錄已存在，檢查是否為 Git Repo...`);
            if (await isGitRepository(localPath)) {
                await forceUpdateRepository(repo, localPath);
            } else {
                console.warn(`  [${repoName}] 目錄已存在但不是有效的 Git repository，已跳過更新。`);
            }
        } else {
            console.error(`  [${repoName}] 克隆失敗： ${cloneError.message}`);
            if (cloneError.stderr) {
                console.error(`  [${repoName}] Git stderr: ${cloneError.stderr}`);
            }
            if (errorMsg.includes('could not read') || errorMsg.includes('authentication failed') || errorMsg.includes('access rights')) {
                console.error(`  [${repoName}] -> 提示：克隆失敗，可能是 HTTPS 認證問題。請檢查你的 Git Credential Manager 或相關憑據輔助程序配置，或考慮使用 SSH 密鑰。`);
                console.error(`     (Hint: Clone failed, possibly due to HTTPS authentication issues. Check Git Credential Manager or credential helper setup, or consider using SSH keys.)`);
            }
        }
    }
}

/**
 * Main application function.
 */
async function main() {
    console.log('開始備份流程... (Starting backup process...)');

    try {
        // Ensure backup directory exists using the absolute path
        await fs.mkdir(backupDir, { recursive: true });
        console.log(`確保備份目錄存在：${backupDir}`);
    } catch (dirError: any) {
        console.error(`創建或訪問備份目錄時出錯： ${backupDir}`, dirError);
        process.exit(1);
    }

    const githubToken = await getGitHubToken();
    console.log('成功獲取 GitHub PAT。');

    const octokit = new Octokit({
        auth: githubToken,
        userAgent: 'Sylph-GitHub-Backup-Tool v1.0'
    });

    let repositories: Repository[] = [];
    try {
        repositories = await fetchUserRepositories(octokit);
    } catch (fetchError) {
        process.exit(1);
    }

    if (repositories && repositories.length > 0) {
        console.log(`開始處理 ${repositories.length} 個 repositories...`);

        // **CRITICAL FIX:** Process repositories sequentially to avoid race conditions / lock file issues
        console.log('注意：為避免並發問題，將逐個處理 repositories... (Note: Processing repositories sequentially to avoid concurrency issues...)');
        for (const repo of repositories) {
            await cloneOrUpdateRepository(repo, backupDir);
        }
        console.log(`處理完成。嘗試處理 ${repositories.length} 個 repositories。請檢查上面的日誌了解詳細的成功/失敗信息。`);

    } else {
        console.log('沒有找到需要備份的 repositories。');
    }

    console.log('備份流程完成。');
}

// Execute the main function and handle errors
main().catch(error => {
    console.error('發生未處理的頂層錯誤：', error);
    process.exit(1);
});
