# Team Guide: C35 Scope Change Desk

Read this once. It takes about 15 minutes. If you get stuck, message Krishna with a screenshot.

## The rules (the short version)

1. **You work only on your own branch**, named after you: `harini`, `swapnil`, `sanjana`, `krishna`.
2. **Never push to `main`.** Work reaches `main` only through a Pull Request that Krishna merges.
3. **Never commit passwords, keys or a `.env` file.**
4. **Do not edit `fixture.json`.** It is the shared starting data.
5. **All data is synthetic.** Never write that we have real customers or real revenue.
6. Commit small and often, with a clear message.

## One-time setup

### 1. Install the tools

| Tool | Why | Check it worked |
| --- | --- | --- |
| [Git](https://git-scm.com/downloads) | Saves and shares your work | `git --version` |
| [Node.js 20 or newer (LTS)](https://nodejs.org) | Runs the project | `node -v` |
| [VS Code](https://code.visualstudio.com) (optional) | Editor | opens |

Open a terminal (Windows: search for "PowerShell" or "Git Bash"; Mac: "Terminal") to run the commands below.

### 2. Get access to the repo

The repo is private. Send Krishna your **GitHub username**. He will invite you. Accept the invitation in your email or at https://github.com/Krishnass05/fynd/invitations.

### 3. Tell Git who you are

Use your own name and the email on your GitHub account, so your commits count as yours:

```bash
git config --global user.name "Your Name"
git config --global user.email "you@example.com"
```

### 4. Download the project and switch to your branch

```bash
git clone https://github.com/Krishnass05/fynd.git
cd fynd
git checkout harini
```

Replace `harini` with your own branch name. The first time you push, GitHub may ask you to sign in through your browser. Do that.

### 5. Check that everything works

```bash
npm install
npm test
npm run dev
```

`npm install` downloads the project parts (a few minutes the first time, once). `npm test` should show every test passing. `npm run dev` opens the app at http://localhost:3000 (press `Ctrl+C` to stop it). Pick "Demo Client" or "Demo Freelancer" on the start page. Data is in memory and resets when you restart. Read [docs/OWNERSHIP.md](docs/OWNERSHIP.md) to see which folders are yours.

## Your daily routine

```bash
git checkout harini          # make sure you are on YOUR branch
git pull origin main         # bring in the latest team work
# ... make your changes ...
npm test                     # must pass before you commit
npm run build                # must pass before you open a pull request
git add -A
git commit -m "Short clear message about what you did"
git push origin harini
```

Check which branch you are on any time with `git branch`. The one with `*` is current.

## Sending your work to main (Pull Request)

Do this every 2 to 4 hours, or whenever you finish a piece.

1. Push your branch (last step above).
2. Open https://github.com/Krishnass05/fynd and click **Compare & pull request** (or **Pull requests**, then **New pull request**).
3. Set **base: `main`** and **compare: your branch**.
4. Write one or two lines on what changed, then click **Create pull request**.
5. Message Krishna. He reviews and merges.
6. After the merge, run `git pull origin main` on your branch to stay in sync.

## Adding the Statements of Work (SOWs)

We need 50 job profiles, each as a Statement of Work.

- Put them in the folder **`docs/sow/`**. Read `docs/sow/README.md` first. It has the naming rule and the template.
- One file per job profile, for example `docs/sow/01-landing-page-design.md`.
- Each SOW must state: what is **included**, what is **excluded**, the **price or hourly rate**, the **deadline**, and the **assumed hours**.
- No coding is needed. You can add files in the browser: open your branch on GitHub, go to `docs/sow`, click **Add file, then Upload files**, and commit to **your branch**. Check the branch name at the top left before you commit.

## If something goes wrong

| Problem | What to do |
| --- | --- |
| "Permission denied" or "repository not found" | You have not accepted the invite yet, or you are signed in to the wrong GitHub account |
| "Updates were rejected" when pushing | Run `git pull origin harini`, then push again |
| Merge conflict | Do not guess. Message Krishna and share your screen |
| You committed on `main` by mistake | Do not push. Tell Krishna |
| You committed a secret | Tell Krishna right away. The key must be replaced, not just deleted |
| `npm test` fails and you did not change code | Run `git pull origin main`, then try again |

## For Krishna (repo owner)

### One-time GitHub setup
1. **Invite teammates:** repo, **Settings, Collaborators, Add people**. Give each person **Write** access.
2. **Default branch:** it should be `main` (repo, **Settings, General, Default branch**).
3. **Protect `main`:** **Settings, Branches, Add branch protection rule** for `main`: require a pull request before merging, and block force pushes. Private repos on a free personal plan may not offer this. If the option is missing, the rule is a team agreement: nobody pushes to `main`.
4. **Tags:** when the v1/v2 work is ready, create `v1-before-feedback` and `v2-after-feedback` on the right commits.

### Reviewing and merging a Pull Request
1. Open the PR, check **Files changed**, and confirm the checks or `npm test` pass.
2. Click **Merge pull request**, then **Confirm**.
3. Locally: `git checkout main`, `git pull origin main`.

### Keeping your own branch current
```bash
git checkout krishna
git pull origin main
```

### Rhythm for the 24 hours
- Merge to `main` every 2 to 4 hours.
- Feature freeze at hour 20. After that, only bug fixes and the demo.
- Before presenting, run `npm test` on `main` and confirm the live link works.
