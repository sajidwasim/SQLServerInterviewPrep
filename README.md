# SQL Server DBA Interview Preparation

Comprehensive interactive study guide for **Senior Infrastructure Operations Engineer (SQL Server & Automation)** interviews. Covers 24/7 enterprise operations, performance tuning, high availability, disaster recovery, security, Azure SQL, migrations, and real-world consolidation scenarios.

## Features

- **23 chapters** covering the full SQL Server DBA domain — from fundamentals to Azure SQL
- **Searchable** — instant full-text search across all chapters
- **Dark/light theme** — toggle for comfortable reading
- **Mobile-responsive** — works on desktop, tablet, and phone
- **T-SQL examples** with syntax highlighting
- **Real-world scenarios** with interview-ready answers
- **Azure SQL Guide** — dedicated chapter for cloud DBA skills
- **Offline-first** — no server required; open `index.html` directly

## Chapter Overview

| # | Chapter | Area |
|---|---------|------|
| 1 | Job Description & Role Overview | Core |
| 2 | 24/7 Enterprise Operations | Core |
| 3 | Query Store Deep Dive | Core |
| 4 | Performance Tuning & Troubleshooting | Core |
| 5 | Indexing Deep Dive | Core |
| 6 | SQL Server Internals & Storage Engine | Core |
| 7 | Production DBA Toolkit | Core |
| 8 | High Availability & Disaster Recovery | Core |
| 9 | Backup, Restore & Integrity | Core |
| 10 | Automation & Maintenance | Core |
| 11 | Migrations & Upgrades | Core |
| 12 | Cloud, Azure & Modernization | Core |
| 13 | **Azure SQL Guide** | Cloud |
| 14 | Virtualization for DBAs | Core |
| 15 | Security, Compliance & Encryption | Core |
| 16 | Incident Management & Communication | Core |
| 17 | T-SQL & DBA Scripts | Core |
| 18 | Collaboration, Knowledge Sharing & Team Fit | Core |
| 19 | Monitoring, Alerting & Observability | Core |
| 20 | Extra DBA Topics | Core |
| 21 | Interview Questions Deep Dive | Prep |
| 22 | Real-World Capstone — Database Consolidation | Prep |
| 23 | Quick Interview Revision Tutorial | Prep |

## Getting Started

### Quick Start

```bash
# Open the study guide directly in your browser
open index.html
```

### Development

```bash
# Install dependencies
npm install

# Build from source Markdown files
npm run build

# Preview with local server
npm run preview
```

## Study Companion Files

| File | Purpose |
|------|---------|
| `src/Azure_SQL_Preparations_Prompt_Bank.md` | 30 AI-tutor prompts for Azure SQL learning |
| `src/Azure_SQL_Interview_Revision_Tutorial.md` | Full Azure SQL revision tutorial |
| `src/Quick_Interview_Revision_Tutorial.md` | On-prem SQL Server revision tutorial |
| `src/SQL Server Interview Questions 01.txt` | Deep-dive Q&A with T-SQL examples |
| `src/XYZ-JD.txt` | Original job description used as reference |

## Tech Stack

- **Vanilla HTML/CSS/JS** — zero framework dependencies
- **Highlight.js** — T-SQL syntax highlighting
- **Markdown source** — content authored in `src/*.md`
- **Custom build script** — compiles Markdown into `index.html`

## Deployment

The site is fully static and ready for GitHub Pages:

1. Push to the `main` branch
2. Enable **GitHub Pages** from the repository settings (source: `main`, root)
3. The site is served directly — no build step required for deployment

## Project Structure

```
.
├── index.html                  # Single-page study guide (all chapters)
├── build.js                    # Build script (Markdown → HTML)
├── package.json
├── src/                        # Source Markdown files
│   ├── *.md                    # One file per chapter + companion files
│   └── *.txt                   # Supplementary references
└── AGENTS.md                   # Agent configuration (opencode)
```
