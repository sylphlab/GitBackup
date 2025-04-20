# GitBackup 備份神器 🛡️

[![Node.js CI](https://github.com/YOUR_USERNAME/YOUR_REPONAME/actions/workflows/node.js.yml/badge.svg)](https://github.com/YOUR_USERNAME/YOUR_REPONAME/actions/workflows/node.js.yml)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)
[![npm version](https://badge.fury.io/js/gitbackup.svg)](https://badge.fury.io/js/gitbackup) <!-- Placeholder - Update if published -->

**輕鬆、自動化備份你所有 GitHub Repositories！**

呢個工具可以自動幫你備份（Clone 新嘅或者強制更新舊嘅）所有同你 GitHub Personal Access Token (PAT) 相關聯嘅 Repositories。確保你嘅代碼安全，萬無一失！

## ✨ 主要功能

*   **全面獲取:** 自動搵出你 PAT 可以訪問嘅所有 Repositories (包括你自己嘅、協作嘅、公開同私有嘅)。
*   **智能備份:**
    *   自動 Clone 新嘅 Repositories 到指定嘅 `backup` 目錄。
    *   強制更新 `backup` 目錄裡面已經存在嘅 Repositories，令佢哋同遠端嘅預設分支保持完全一致 (注意：會覆蓋本地修改)。
*   **靈活認證:** 如果冇喺 `.env` 檔案搵到 GitHub PAT，會喺命令行安全提示你輸入。
*   **Docker 支持:** 提供 Dockerfile，方便喺容器環境運行。
*   **NPX 運行:** (需要發佈到 npm) 可以直接用 `npx gitbackup` 快速啟動。

## 🚀 開始使用

### 環境要求

*   Node.js (建議 LTS 版本，內含 npm)
*   Git

### 本地安裝與設置

1.  **Clone 代碼庫:**
    ```bash
    git clone https://github.com/YOUR_USERNAME/YOUR_REPONAME.git # 替換成你嘅 Repo URL
    cd YOUR_REPONAME
    ```
2.  **安裝依賴:**
    ```bash
    npm install
    ```
3.  **設置 GitHub PAT (推薦):**
    *   喺項目根目錄創建一個 `.env` 檔案。
    *   加入你嘅 GitHub Personal Access Token:
        ```dotenv
        GITHUB_PAT=ghp_YourPersonalAccessTokenHere
        ```
    *   **重要提示:**
        *   確保你嘅 PAT 有足夠權限 (至少需要 `repo` scope) 去訪問你想備份嘅 Repositories。
        *   確保你本地嘅 Git 環境已經配置好 HTTPS 認證 (例如透過 Git Credential Manager) 或者使用 SSH Key 進行認證，否則 Git 操作可能會失敗。

### 運行方式

#### 方式一：透過 npm script (本地)

```bash
npm start
```

*   如果 `.env` 文件裡面有 `GITHUB_PAT`，工具會直接使用。
*   否則，會提示你喺命令行輸入 PAT。
*   備份嘅 Repositories 會存放喺項目根目錄下嘅 `backup/` 文件夾。

#### 方式二：透過 NPX (需要先發佈到 npm)

如果你將呢個工具發佈到 npm (例如叫做 `my-git-backup-tool`)，其他人就可以直接用 NPX 運行：

```bash
npx my-git-backup-tool
```

*(注意：你需要先喺 `package.json` 嘅 `name` 欄位設定一個獨特嘅 npm 套件名稱，然後用 `npm publish` 發佈。)*

#### 方式三：透過 Docker

1.  **Build Docker Image:**
    ```bash
    docker build -t gitbackup-tool .
    ```
2.  **Run Docker Container:**
    你需要將你嘅 GitHub PAT 作為環境變數傳入，並且將本地嘅 `backup` 目錄掛載到容器裡面。

    ```bash
    # 創建一個本地 backup 目錄 (如果未有)
    mkdir -p ./my_github_backups

    # 運行容器 (將 ./my_github_backups 掛載到容器嘅 /app/backup)
    docker run --rm -e GITHUB_PAT="ghp_YourPersonalAccessTokenHere" -v "$(pwd)/my_github_backups:/app/backup" gitbackup-tool
    ```
    *   將 `ghp_YourPersonalAccessTokenHere` 換成你嘅真實 PAT。
    *   將 `$(pwd)/my_github_backups` 換成你想喺主機存放備份嘅實際路徑。備份會出現喺呢個目錄裡面。
    *   `--rm` 會喺容器停止後自動刪除容器。

## ⚠️ 重要提示

*   **強制更新:** 更新現有 Repository 時會使用 `git reset --hard`，呢個操作會**丟棄**你喺本地備份目錄對應分支上做嘅任何修改。請確保你明白呢點。
*   **認證:** Git 操作（Clone/Fetch）嘅成功依賴於你本地 Git 環境嘅 HTTPS 或 SSH 認證設置。如果遇到認證失敗，請檢查相關配置。

## ⏰ 自動化每日備份

呢個工具本身冇內建排程功能。你可以用操作系統嘅任務排程器嚟實現每日自動運行：

*   **Windows:** 使用「工作排程器」(Task Scheduler)。
*   **macOS/Linux:** 使用 `cron`。

**Cron Job 範例 (每日凌晨 3 點運行):**

```cron
0 3 * * * cd /path/to/your/GitBackup && npm start >> /path/to/your/backup.log 2>&1
```

*   記得將 `/path/to/your/GitBackup` 換成項目實際路徑，`/path/to/your/backup.log` 換成你想要嘅日誌檔案路徑。

## 🤝 貢獻

歡迎提出 Issue 或者 Pull Request！

## 📄 授權條款

ISC License.
