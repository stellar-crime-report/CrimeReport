# 🤝 Contributing to CrimeReport

First off — **thank you** for taking the time to contribute! CrimeReport is an open-source civic tech project and every contribution, big or small, makes communities safer.

This guide covers everything you need to get from zero to your first merged PR.

---

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Ways to Contribute](#ways-to-contribute)
- [Drips Stellar Wave](#drips-stellar-wave)
- [Development Setup](#development-setup)
- [Workflow](#workflow)
- [Issue Labels](#issue-labels)
- [Pull Request Guidelines](#pull-request-guidelines)
- [Commit Convention](#commit-convention)
- [Code Style](#code-style)
- [Getting Help](#getting-help)

---

## 📜 Code of Conduct

By participating in this project, you agree to be respectful, inclusive, and constructive. We are building tools for public safety — that mission starts with how we treat each other.

Harassment, discrimination, or toxic behavior of any kind will not be tolerated.

---

## 🛠️ Ways to Contribute

You don't have to be a senior engineer to contribute. Here's how different people can help:

| Role | How You Can Help |
|------|-----------------|
| 👨‍💻 **Frontend Dev** | Build map components, report forms, UI improvements |
| 🔧 **Backend Dev** | API endpoints, geospatial queries, authentication |
| ⛓️ **Blockchain Dev** | Soroban smart contracts, Stellar SDK integration |
| 🎨 **Designer** | UI/UX improvements, mockups, accessibility audits |
| 📝 **Technical Writer** | Docs, tutorials, API references |
| 🧪 **QA / Tester** | Write tests, find bugs, report issues |
| 🌍 **Translator** | Localize the app for different languages |

---

## 🌊 Drips Stellar Wave

CrimeReport is participating in the **[Drips Stellar Wave Program](https://www.drips.network/wave/stellar)**. During active Waves, contributors who get PRs merged earn **Points that convert to real XLM rewards**.

### How to Participate in a Wave

1. **Check for active Waves** at [drips.network/wave/stellar](https://www.drips.network/wave/stellar)
2. **Browse Wave issues** in this repo — they'll be tagged with the `wave` label
3. **Comment on an issue** to claim it before starting work
4. **Submit your PR** before the Wave deadline (usually 7 days)
5. **Get merged → earn Points → earn XLM** 💰

> ⚠️ Read the full [Drips Terms & Rules](https://docs.drips.network/wave/terms-and-rules) before participating.

### Issue Point Values

| Complexity | Points | What it usually means |
|------------|--------|-----------------------|
| Trivial | 100 | Typo fixes, small UI tweaks, docs |
| Medium | 150 | New features, bug fixes, small contracts |
| High | 200 | Complex features, Soroban contracts, architecture changes |

---

## 💻 Development Setup

### 1. Fork & Clone

```bash
# Fork the repo on GitHub, then:
git clone https://github.com/YOUR_USERNAME/CrimeReport.git
cd CrimeReport
```

### 2. Add the upstream remote

```bash
git remote add upstream https://github.com/stellar-crime-report/CrimeReport.git
```

### 3. Install dependencies

```bash
# Frontend
cd frontend && npm install

# Backend
cd ../backend && npm install
```

### 4. Set up environment variables

```bash
cp .env.example .env
# Fill in your values (see README for details)
```

### 5. Start development servers

```bash
# Backend (terminal 1)
cd backend && npm run start:dev

# Frontend (terminal 2)
cd frontend && npm run dev
```

### 6. (Optional) Soroban / Stellar Setup

For blockchain-related issues, you'll need:

```bash
# Install Stellar CLI
cargo install --locked stellar-cli --features opt

# Configure for testnet
stellar network add testnet \
  --rpc-url https://soroban-testnet.stellar.org \
  --network-passphrase "Test SDF Network ; September 2015"

# Generate a test keypair
stellar keys generate --network testnet alice
```

---

## 🔄 Workflow

### Step 1 — Find or create an issue

- Browse [open issues](../../issues)
- Look for `good first issue` if you're new
- If you have an idea not in the issues, open one first before coding

### Step 2 — Claim the issue

Comment on the issue:
```
I'd like to work on this. ETA: [X days]
```

> Please don't submit PRs for unclaimed issues — it creates conflicts.

### Step 3 — Create a branch

```bash
git checkout -b feat/your-feature-name
# or
git checkout -b fix/bug-description
```

### Step 4 — Make your changes

- Keep changes focused and scoped to the issue
- Write or update tests where applicable
- Keep commits clean and descriptive (see [Commit Convention](#commit-convention))

### Step 5 — Sync with upstream

```bash
git fetch upstream
git rebase upstream/main
```

### Step 6 — Submit your PR

- Open a Pull Request against the `main` branch
- Fill out the PR template completely
- Reference the issue: `Closes #123`
- Add screenshots/recordings for UI changes

---

## 🏷️ Issue Labels

| Label | Meaning |
|-------|---------|
| `good first issue` | Safe for newcomers, well-scoped |
| `help wanted` | Open for community contributions |
| `wave` | Active in the current Drips Wave |
| `bug` | Something is broken |
| `enhancement` | New feature or improvement |
| `stellar` | Soroban / Stellar blockchain related |
| `frontend` | React / Next.js / UI work |
| `backend` | API / database work |
| `docs` | Documentation improvements |
| `design` | UI/UX focused |

---

## ✅ Pull Request Guidelines

A good PR:

- **Solves one thing** — don't bundle unrelated changes
- **Has a clear title** — e.g. `feat: add crime filter by type`
- **References its issue** — `Closes #42`
- **Includes tests** — for logic changes, backend routes, or contracts
- **Passes CI** — make sure all checks are green before requesting review
- **Has a description** — explain what you changed and why

### PR Template

When you open a PR, fill in:

```markdown
## What does this PR do?
<!-- Brief summary -->

## Related Issue
Closes #

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Refactor
- [ ] Docs
- [ ] Blockchain / Soroban

## Screenshots (if UI change)

## Checklist
- [ ] My code follows the project code style
- [ ] I have tested my changes locally
- [ ] I have added/updated tests where needed
- [ ] I have updated relevant documentation
```

---

## 💬 Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>: <short description>

[optional body]
[optional footer]
```

### Types

| Type | When to use |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `style` | Formatting, no logic change |
| `refactor` | Code restructuring |
| `test` | Adding or updating tests |
| `chore` | Build, CI, tooling changes |
| `contract` | Soroban smart contract changes |

### Examples

```bash
feat: add geolocation auto-detect on report form
fix: resolve map pin clustering on zoom level 10
docs: add Soroban setup guide to CONTRIBUTING
contract: deploy reward distribution to testnet
```

---

## 🧹 Code Style

### JavaScript / TypeScript
- Use **TypeScript** wherever possible
- Follow the ESLint config (`.eslintrc.js`)
- Format with **Prettier** (`npm run format`)
- Use `async/await` over raw promises

### React
- Functional components only
- Use hooks for state and side effects
- Keep components small and single-purpose

### Rust (Soroban Contracts)
- Follow Rust standard formatting (`cargo fmt`)
- Use `cargo clippy` before committing

### Naming
- **Files**: `kebab-case.ts`
- **Components**: `PascalCase.tsx`
- **Functions/variables**: `camelCase`
- **Constants**: `UPPER_SNAKE_CASE`

---

## 🆘 Getting Help

Stuck? We've got you:

- 💬 **Discord**: [Join the server](https://discord.gg) and ask in `#contributors`
- 🐛 **GitHub Issues**: Comment directly on the issue you're working on
- 📬 **Email**: [maintainer@crimereport.app](mailto:maintainer@crimereport.app)

We aim to respond within **48 hours**.

---

## 🙏 Recognition

All contributors are listed in our [CONTRIBUTORS.md](CONTRIBUTORS.md) file and acknowledged in release notes. Wave contributors who earn points will be featured on our leaderboard.

---

<p align="center">
  Thanks for making communities safer, one commit at a time. 🌍
</p>
