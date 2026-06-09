---
title: Collaboration, Knowledge Sharing & Team Fit
order: 16
icon: 👥
---

## Key Concepts

### Working with Infrastructure Teams

SQL Server performance issues often originate outside SQL Server:

```
App Team ── "Queries are slow!"
    ↓
DBA ────── Check DMVs → blocking, waits, queries
    ↓
Infra ──── Check storage latency, VM CPU ready, network
    ↓
Joint ──── "The storage LUN is showing 30ms latency. Let's move the 
           log file to a faster LUN and see if WRITELOG waits drop."
```

> [!tip]
> When collaborating, provide data, not opinions. "I see `PAGEIOLATCH_SH` waits averaging 50ms on the Inventory data file" is more useful than "The storage is slow."

### Knowledge Sharing

A team should not have single points of failure:

- Document everything — runbooks, architecture, known issues
- Rotate knowledge — different team members handle incidents
- Internal training — share a DBA topic each month
- Peer review — review scripts and config changes
- Post-incident reviews — share lessons learned

> "If only one person knows how to fail over the AG, that's a risk — not a job security strategy."

### 24/7 On-Call Readiness

When the phone rings at 02:30:

1. **Check the alert** — what fired? How critical?
2. **Open the runbook** — follow the documented steps
3. **Assess severity** — wake someone up or handle yourself?
4. **Gather evidence** — don't fix blind, collect data first
5. **Communicate** — log the incident, update status
6. **Fix or mitigate** — apply the fix or workaround
7. **Document** — what happened, what you did, follow-up needed

### Interview: "What Would You Improve First?"

This question tests your judgment, not your technical depth. Show measured thinking:

1. **Listen first** — understand the current state before suggesting changes
2. **Start with basics** — verify backups, restore testing, monitoring
3. **Build trust** — fix a small, visible problem first
4. **Then improve** — automation, documentation, performance
5. **Stay humble** — "I'd learn the environment before making changes"

---

## Interview Q&A

**Q:** How do you handle a situation where the infrastructure team says "SQL Server is fine" but the application is slow?

> I share the data I've collected from SQL Server — wait stats, IO latency, blocking chains — and ask for their data — storage latency, VM CPU ready time, network drops. I frame it as "we have a symptom, let's work together to find the root cause." I avoid blame. The goal is to fix the problem, not to win an argument.

**Q:** What's your approach to knowledge sharing in a DBA team?

> I believe every process should be documented and accessible. Runbooks should be in a shared location, not in someone's local folder. We should have regular knowledge-sharing sessions where each team member presents a topic. Incident post-mortems should be shared. And we should peer-review changes to spread knowledge and catch mistakes. A team that shares knowledge is more resilient.

**Q:** You join a new company as a senior DBA. What's the first thing you look at?

> I don't walk in and start changing things. First, I learn the environment — which databases are business-critical, who the stakeholders are, what the current pain points are. I verify the basics: are backups running? Has restore been tested? Is there monitoring? I look at recent incidents to understand patterns. After I understand the current state, I identify the highest-risk areas and propose improvements. The first change I make should be low-risk and high-visibility — something that makes the team's life better immediately.

---

## Sample Interview Answers

### 60-Second Opening Statement

> "My focus as a DBA is database availability, recoverability, performance, security, and capacity. I believe in proactive monitoring, tested backup and restore, methodical troubleshooting, and clear communication during incidents. I automate repetitive tasks, document processes, and collaborate with both infrastructure and application teams to keep the platform stable and improving."

### Answering "Describe a difficult DBA issue you resolved"

> "We had a critical OLTP database where the transaction log was growing uncontrollably. The backup job was failing silently. I checked `log_reuse_wait_desc`, found the backup chain was broken, fixed the job manually, took log backups to reclaim space, resized the log properly, set up monitoring alerts for both log usage and backup job failures, and updated the runbook. The issue never recurred."
