# Operating a shared service

This guide collects what the platform team has learned about running a busy shared service. It is long on purpose: each section stands alone, so you can jump to the one that matches the problem in front of you.

## 1. Working with the request pipeline

When you look closely at the request pipeline, the first thing to notice is that most of the work happens before any user sees a result. Each stage hands a small, well defined piece of state to the next one, and the system stays predictable only while those hand-offs stay **explicit**. In practice that means writing down what each stage owns, what it may assume, and what it must never touch.

A common mistake is to treat the request pipeline as a single unit. It is easier to reason about as a chain of _independent_ steps, where each step can fail, retry, or be skipped without corrupting the others. Section 1 walks through those steps in order and points out where the sharp edges are, using `config.the` as the running example.

- Write down who owns the request pipeline and how to reach them during an incident.
- Record the current limits, including the ones nobody remembers setting.
- Add an alert that fires before users notice, not after.
  - Page only on symptoms that need a human right now.
  - Send everything else to a daily digest.
- Review the runbook every quarter and delete steps that no longer apply.

The [reference documentation](https://example.com/docs/0) covers the full option list, but three settings matter far more than the rest: the timeout, the retry limit, and the size of the working set. Get those right and the request pipeline mostly takes care of itself; get them wrong and no amount of tuning elsewhere will help. Keep ~~guessing~~ measuring before changing any of them.

Here is a short example related to the request pipeline:

```ts
export async function withRetry<T>(run: () => Promise<T>, limit = 3): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < limit; attempt += 1) {
    try {
      return await run();
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}
```

### Checklist for the request pipeline

1. Reproduce the problem with the request pipeline in a staging environment first.
2. Capture the exact inputs, the expected output, and the observed output.
3. Change one variable at a time and note the effect of each change.
4. Ship the smallest fix that explains every observation you recorded.

Finally, remember that the request pipeline is shared by every team that ships to this service. A change that looks local can shift latency for someone else, so announce it early, roll it out behind a flag, and watch the dashboards for at least one full traffic cycle before you call it done.

If something does go wrong with the request pipeline, resist the urge to fix it in place. Roll back first, confirm that the symptoms stop, and only then start looking for the cause. A calm rollback is almost always cheaper than a clever fix applied under pressure, and it leaves the evidence intact for the review afterwards.

> Treat every limit as a decision someone made on purpose. If you can't find the reason, find the person before changing it.

- [x] Confirm the rollout plan with the on-call engineer.
- [ ] Update the dashboard links in the team handbook.
- [ ] Schedule a follow-up review in two weeks.

---

## 2. Working with cache invalidation

When you look closely at cache invalidation, the first thing to notice is that most of the work happens before any user sees a result. Each stage hands a small, well defined piece of state to the next one, and the system stays predictable only while those hand-offs stay **explicit**. In practice that means writing down what each stage owns, what it may assume, and what it must never touch.

A common mistake is to treat cache invalidation as a single unit. It is easier to reason about as a chain of _independent_ steps, where each step can fail, retry, or be skipped without corrupting the others. Section 2 walks through those steps in order and points out where the sharp edges are, using `config.cache` as the running example.

- Write down who owns cache invalidation and how to reach them during an incident.
- Record the current limits, including the ones nobody remembers setting.
- Add an alert that fires before users notice, not after.
  - Page only on symptoms that need a human right now.
  - Send everything else to a daily digest.
- Review the runbook every quarter and delete steps that no longer apply.

The [reference documentation](https://example.com/docs/1) covers the full option list, but three settings matter far more than the rest: the timeout, the retry limit, and the size of the working set. Get those right and cache invalidation mostly takes care of itself; get them wrong and no amount of tuning elsewhere will help. Keep ~~guessing~~ measuring before changing any of them.

Here is a short example related to cache invalidation:

```sql
SELECT team, COUNT(*) AS incidents, AVG(minutes_to_resolve) AS mttr
FROM incidents
WHERE opened_at >= NOW() - INTERVAL '90 days'
GROUP BY team
ORDER BY incidents DESC;
```

### Checklist for cache invalidation

1. Reproduce the problem with cache invalidation in a staging environment first.
2. Capture the exact inputs, the expected output, and the observed output.
3. Change one variable at a time and note the effect of each change.
4. Ship the smallest fix that explains every observation you recorded.

Finally, remember that cache invalidation is shared by every team that ships to this service. A change that looks local can shift latency for someone else, so announce it early, roll it out behind a flag, and watch the dashboards for at least one full traffic cycle before you call it done.

If something does go wrong with cache invalidation, resist the urge to fix it in place. Roll back first, confirm that the symptoms stop, and only then start looking for the cause. A calm rollback is almost always cheaper than a clever fix applied under pressure, and it leaves the evidence intact for the review afterwards.

> Treat every limit as a decision someone made on purpose. If you can't find the reason, find the person before changing it.

- [x] Confirm the rollout plan with the on-call engineer.
- [ ] Update the dashboard links in the team handbook.
- [ ] Schedule a follow-up review in two weeks.

---

## 3. Working with background jobs

When you look closely at background jobs, the first thing to notice is that most of the work happens before any user sees a result. Each stage hands a small, well defined piece of state to the next one, and the system stays predictable only while those hand-offs stay **explicit**. In practice that means writing down what each stage owns, what it may assume, and what it must never touch.

A common mistake is to treat background jobs as a single unit. It is easier to reason about as a chain of _independent_ steps, where each step can fail, retry, or be skipped without corrupting the others. Section 3 walks through those steps in order and points out where the sharp edges are, using `config.background` as the running example.

- Write down who owns background jobs and how to reach them during an incident.
- Record the current limits, including the ones nobody remembers setting.
- Add an alert that fires before users notice, not after.
  - Page only on symptoms that need a human right now.
  - Send everything else to a daily digest.
- Review the runbook every quarter and delete steps that no longer apply.

The [reference documentation](https://example.com/docs/2) covers the full option list, but three settings matter far more than the rest: the timeout, the retry limit, and the size of the working set. Get those right and background jobs mostly takes care of itself; get them wrong and no amount of tuning elsewhere will help. Keep ~~guessing~~ measuring before changing any of them.

Here is a short example related to background jobs:

```bash
set -euo pipefail
for region in us-east eu-west ap-south; do
  echo "draining $region"
  ./deploy drain --region "$region" --timeout 300
done
```

### Checklist for background jobs

1. Reproduce the problem with background jobs in a staging environment first.
2. Capture the exact inputs, the expected output, and the observed output.
3. Change one variable at a time and note the effect of each change.
4. Ship the smallest fix that explains every observation you recorded.

Finally, remember that background jobs is shared by every team that ships to this service. A change that looks local can shift latency for someone else, so announce it early, roll it out behind a flag, and watch the dashboards for at least one full traffic cycle before you call it done.

If something does go wrong with background jobs, resist the urge to fix it in place. Roll back first, confirm that the symptoms stop, and only then start looking for the cause. A calm rollback is almost always cheaper than a clever fix applied under pressure, and it leaves the evidence intact for the review afterwards.

> Treat every limit as a decision someone made on purpose. If you can't find the reason, find the person before changing it.

- [x] Confirm the rollout plan with the on-call engineer.
- [ ] Update the dashboard links in the team handbook.
- [ ] Schedule a follow-up review in two weeks.

---

## 4. Working with schema migrations

When you look closely at schema migrations, the first thing to notice is that most of the work happens before any user sees a result. Each stage hands a small, well defined piece of state to the next one, and the system stays predictable only while those hand-offs stay **explicit**. In practice that means writing down what each stage owns, what it may assume, and what it must never touch.

A common mistake is to treat schema migrations as a single unit. It is easier to reason about as a chain of _independent_ steps, where each step can fail, retry, or be skipped without corrupting the others. Section 4 walks through those steps in order and points out where the sharp edges are, using `config.schema` as the running example.

- Write down who owns schema migrations and how to reach them during an incident.
- Record the current limits, including the ones nobody remembers setting.
- Add an alert that fires before users notice, not after.
  - Page only on symptoms that need a human right now.
  - Send everything else to a daily digest.
- Review the runbook every quarter and delete steps that no longer apply.

The [reference documentation](https://example.com/docs/3) covers the full option list, but three settings matter far more than the rest: the timeout, the retry limit, and the size of the working set. Get those right and schema migrations mostly takes care of itself; get them wrong and no amount of tuning elsewhere will help. Keep ~~guessing~~ measuring before changing any of them.

Here is a short example related to schema migrations:

```json
{
  "timeoutMs": 2500,
  "retryLimit": 3,
  "workingSet": 512,
  "flags": ["gradual-rollout", "shadow-reads"]
}
```

### Checklist for schema migrations

1. Reproduce the problem with schema migrations in a staging environment first.
2. Capture the exact inputs, the expected output, and the observed output.
3. Change one variable at a time and note the effect of each change.
4. Ship the smallest fix that explains every observation you recorded.

Finally, remember that schema migrations is shared by every team that ships to this service. A change that looks local can shift latency for someone else, so announce it early, roll it out behind a flag, and watch the dashboards for at least one full traffic cycle before you call it done.

If something does go wrong with schema migrations, resist the urge to fix it in place. Roll back first, confirm that the symptoms stop, and only then start looking for the cause. A calm rollback is almost always cheaper than a clever fix applied under pressure, and it leaves the evidence intact for the review afterwards.

> Treat every limit as a decision someone made on purpose. If you can't find the reason, find the person before changing it.

- [x] Confirm the rollout plan with the on-call engineer.
- [ ] Update the dashboard links in the team handbook.
- [ ] Schedule a follow-up review in two weeks.

---

## 5. Working with rate limiting

When you look closely at rate limiting, the first thing to notice is that most of the work happens before any user sees a result. Each stage hands a small, well defined piece of state to the next one, and the system stays predictable only while those hand-offs stay **explicit**. In practice that means writing down what each stage owns, what it may assume, and what it must never touch.

A common mistake is to treat rate limiting as a single unit. It is easier to reason about as a chain of _independent_ steps, where each step can fail, retry, or be skipped without corrupting the others. Section 5 walks through those steps in order and points out where the sharp edges are, using `config.rate` as the running example.

- Write down who owns rate limiting and how to reach them during an incident.
- Record the current limits, including the ones nobody remembers setting.
- Add an alert that fires before users notice, not after.
  - Page only on symptoms that need a human right now.
  - Send everything else to a daily digest.
- Review the runbook every quarter and delete steps that no longer apply.

The [reference documentation](https://example.com/docs/4) covers the full option list, but three settings matter far more than the rest: the timeout, the retry limit, and the size of the working set. Get those right and rate limiting mostly takes care of itself; get them wrong and no amount of tuning elsewhere will help. Keep ~~guessing~~ measuring before changing any of them.

### Checklist for rate limiting

1. Reproduce the problem with rate limiting in a staging environment first.
2. Capture the exact inputs, the expected output, and the observed output.
3. Change one variable at a time and note the effect of each change.
4. Ship the smallest fix that explains every observation you recorded.

Finally, remember that rate limiting is shared by every team that ships to this service. A change that looks local can shift latency for someone else, so announce it early, roll it out behind a flag, and watch the dashboards for at least one full traffic cycle before you call it done.

If something does go wrong with rate limiting, resist the urge to fix it in place. Roll back first, confirm that the symptoms stop, and only then start looking for the cause. A calm rollback is almost always cheaper than a clever fix applied under pressure, and it leaves the evidence intact for the review afterwards.

> Treat every limit as a decision someone made on purpose. If you can't find the reason, find the person before changing it.

- [x] Confirm the rollout plan with the on-call engineer.
- [ ] Update the dashboard links in the team handbook.
- [ ] Schedule a follow-up review in two weeks.

---

## 6. Working with observability

When you look closely at observability, the first thing to notice is that most of the work happens before any user sees a result. Each stage hands a small, well defined piece of state to the next one, and the system stays predictable only while those hand-offs stay **explicit**. In practice that means writing down what each stage owns, what it may assume, and what it must never touch.

A common mistake is to treat observability as a single unit. It is easier to reason about as a chain of _independent_ steps, where each step can fail, retry, or be skipped without corrupting the others. Section 6 walks through those steps in order and points out where the sharp edges are, using `config.observability` as the running example.

- Write down who owns observability and how to reach them during an incident.
- Record the current limits, including the ones nobody remembers setting.
- Add an alert that fires before users notice, not after.
  - Page only on symptoms that need a human right now.
  - Send everything else to a daily digest.
- Review the runbook every quarter and delete steps that no longer apply.

The [reference documentation](https://example.com/docs/5) covers the full option list, but three settings matter far more than the rest: the timeout, the retry limit, and the size of the working set. Get those right and observability mostly takes care of itself; get them wrong and no amount of tuning elsewhere will help. Keep ~~guessing~~ measuring before changing any of them.

The settings that matter most for observability:

| Setting | Default | Safe range | Notes |
| :--- | ---: | :---: | --- |
| Timeout | 2500 ms | 500–5000 ms | Raise only with a matching client timeout. |
| Retry limit | 3 | 1–5 | Each retry multiplies peak load. |
| Working set | 512 | 128–2048 | Bounded by available memory per worker. |
| Batch size | 50 | 10–200 | Larger batches hide per-item failures. |

### Checklist for observability

1. Reproduce the problem with observability in a staging environment first.
2. Capture the exact inputs, the expected output, and the observed output.
3. Change one variable at a time and note the effect of each change.
4. Ship the smallest fix that explains every observation you recorded.

Finally, remember that observability is shared by every team that ships to this service. A change that looks local can shift latency for someone else, so announce it early, roll it out behind a flag, and watch the dashboards for at least one full traffic cycle before you call it done.

If something does go wrong with observability, resist the urge to fix it in place. Roll back first, confirm that the symptoms stop, and only then start looking for the cause. A calm rollback is almost always cheaper than a clever fix applied under pressure, and it leaves the evidence intact for the review afterwards.

> Treat every limit as a decision someone made on purpose. If you can't find the reason, find the person before changing it.

- [x] Confirm the rollout plan with the on-call engineer.
- [ ] Update the dashboard links in the team handbook.
- [ ] Schedule a follow-up review in two weeks.

---

## 7. Working with feature flags

When you look closely at feature flags, the first thing to notice is that most of the work happens before any user sees a result. Each stage hands a small, well defined piece of state to the next one, and the system stays predictable only while those hand-offs stay **explicit**. In practice that means writing down what each stage owns, what it may assume, and what it must never touch.

A common mistake is to treat feature flags as a single unit. It is easier to reason about as a chain of _independent_ steps, where each step can fail, retry, or be skipped without corrupting the others. Section 7 walks through those steps in order and points out where the sharp edges are, using `config.feature` as the running example.

- Write down who owns feature flags and how to reach them during an incident.
- Record the current limits, including the ones nobody remembers setting.
- Add an alert that fires before users notice, not after.
  - Page only on symptoms that need a human right now.
  - Send everything else to a daily digest.
- Review the runbook every quarter and delete steps that no longer apply.

The [reference documentation](https://example.com/docs/6) covers the full option list, but three settings matter far more than the rest: the timeout, the retry limit, and the size of the working set. Get those right and feature flags mostly takes care of itself; get them wrong and no amount of tuning elsewhere will help. Keep ~~guessing~~ measuring before changing any of them.

### Checklist for feature flags

1. Reproduce the problem with feature flags in a staging environment first.
2. Capture the exact inputs, the expected output, and the observed output.
3. Change one variable at a time and note the effect of each change.
4. Ship the smallest fix that explains every observation you recorded.

Finally, remember that feature flags is shared by every team that ships to this service. A change that looks local can shift latency for someone else, so announce it early, roll it out behind a flag, and watch the dashboards for at least one full traffic cycle before you call it done.

If something does go wrong with feature flags, resist the urge to fix it in place. Roll back first, confirm that the symptoms stop, and only then start looking for the cause. A calm rollback is almost always cheaper than a clever fix applied under pressure, and it leaves the evidence intact for the review afterwards.

> Treat every limit as a decision someone made on purpose. If you can't find the reason, find the person before changing it.

- [x] Confirm the rollout plan with the on-call engineer.
- [ ] Update the dashboard links in the team handbook.
- [ ] Schedule a follow-up review in two weeks.

---

## 8. Working with search indexing

When you look closely at search indexing, the first thing to notice is that most of the work happens before any user sees a result. Each stage hands a small, well defined piece of state to the next one, and the system stays predictable only while those hand-offs stay **explicit**. In practice that means writing down what each stage owns, what it may assume, and what it must never touch.

A common mistake is to treat search indexing as a single unit. It is easier to reason about as a chain of _independent_ steps, where each step can fail, retry, or be skipped without corrupting the others. Section 8 walks through those steps in order and points out where the sharp edges are, using `config.search` as the running example.

- Write down who owns search indexing and how to reach them during an incident.
- Record the current limits, including the ones nobody remembers setting.
- Add an alert that fires before users notice, not after.
  - Page only on symptoms that need a human right now.
  - Send everything else to a daily digest.
- Review the runbook every quarter and delete steps that no longer apply.

The [reference documentation](https://example.com/docs/7) covers the full option list, but three settings matter far more than the rest: the timeout, the retry limit, and the size of the working set. Get those right and search indexing mostly takes care of itself; get them wrong and no amount of tuning elsewhere will help. Keep ~~guessing~~ measuring before changing any of them.

### Checklist for search indexing

1. Reproduce the problem with search indexing in a staging environment first.
2. Capture the exact inputs, the expected output, and the observed output.
3. Change one variable at a time and note the effect of each change.
4. Ship the smallest fix that explains every observation you recorded.

Finally, remember that search indexing is shared by every team that ships to this service. A change that looks local can shift latency for someone else, so announce it early, roll it out behind a flag, and watch the dashboards for at least one full traffic cycle before you call it done.

If something does go wrong with search indexing, resist the urge to fix it in place. Roll back first, confirm that the symptoms stop, and only then start looking for the cause. A calm rollback is almost always cheaper than a clever fix applied under pressure, and it leaves the evidence intact for the review afterwards.

> Treat every limit as a decision someone made on purpose. If you can't find the reason, find the person before changing it.

- [x] Confirm the rollout plan with the on-call engineer.
- [ ] Update the dashboard links in the team handbook.
- [ ] Schedule a follow-up review in two weeks.

---

## 9. Working with session storage

When you look closely at session storage, the first thing to notice is that most of the work happens before any user sees a result. Each stage hands a small, well defined piece of state to the next one, and the system stays predictable only while those hand-offs stay **explicit**. In practice that means writing down what each stage owns, what it may assume, and what it must never touch.

A common mistake is to treat session storage as a single unit. It is easier to reason about as a chain of _independent_ steps, where each step can fail, retry, or be skipped without corrupting the others. Section 9 walks through those steps in order and points out where the sharp edges are, using `config.session` as the running example.

- Write down who owns session storage and how to reach them during an incident.
- Record the current limits, including the ones nobody remembers setting.
- Add an alert that fires before users notice, not after.
  - Page only on symptoms that need a human right now.
  - Send everything else to a daily digest.
- Review the runbook every quarter and delete steps that no longer apply.

The [reference documentation](https://example.com/docs/8) covers the full option list, but three settings matter far more than the rest: the timeout, the retry limit, and the size of the working set. Get those right and session storage mostly takes care of itself; get them wrong and no amount of tuning elsewhere will help. Keep ~~guessing~~ measuring before changing any of them.

### Checklist for session storage

1. Reproduce the problem with session storage in a staging environment first.
2. Capture the exact inputs, the expected output, and the observed output.
3. Change one variable at a time and note the effect of each change.
4. Ship the smallest fix that explains every observation you recorded.

Finally, remember that session storage is shared by every team that ships to this service. A change that looks local can shift latency for someone else, so announce it early, roll it out behind a flag, and watch the dashboards for at least one full traffic cycle before you call it done.

If something does go wrong with session storage, resist the urge to fix it in place. Roll back first, confirm that the symptoms stop, and only then start looking for the cause. A calm rollback is almost always cheaper than a clever fix applied under pressure, and it leaves the evidence intact for the review afterwards.

> Treat every limit as a decision someone made on purpose. If you can't find the reason, find the person before changing it.

- [x] Confirm the rollout plan with the on-call engineer.
- [ ] Update the dashboard links in the team handbook.
- [ ] Schedule a follow-up review in two weeks.

---

## 10. Working with error budgets

When you look closely at error budgets, the first thing to notice is that most of the work happens before any user sees a result. Each stage hands a small, well defined piece of state to the next one, and the system stays predictable only while those hand-offs stay **explicit**. In practice that means writing down what each stage owns, what it may assume, and what it must never touch.

A common mistake is to treat error budgets as a single unit. It is easier to reason about as a chain of _independent_ steps, where each step can fail, retry, or be skipped without corrupting the others. Section 10 walks through those steps in order and points out where the sharp edges are, using `config.error` as the running example.

- Write down who owns error budgets and how to reach them during an incident.
- Record the current limits, including the ones nobody remembers setting.
- Add an alert that fires before users notice, not after.
  - Page only on symptoms that need a human right now.
  - Send everything else to a daily digest.
- Review the runbook every quarter and delete steps that no longer apply.

The [reference documentation](https://example.com/docs/9) covers the full option list, but three settings matter far more than the rest: the timeout, the retry limit, and the size of the working set. Get those right and error budgets mostly takes care of itself; get them wrong and no amount of tuning elsewhere will help. Keep ~~guessing~~ measuring before changing any of them.

### Checklist for error budgets

1. Reproduce the problem with error budgets in a staging environment first.
2. Capture the exact inputs, the expected output, and the observed output.
3. Change one variable at a time and note the effect of each change.
4. Ship the smallest fix that explains every observation you recorded.

Finally, remember that error budgets is shared by every team that ships to this service. A change that looks local can shift latency for someone else, so announce it early, roll it out behind a flag, and watch the dashboards for at least one full traffic cycle before you call it done.

If something does go wrong with error budgets, resist the urge to fix it in place. Roll back first, confirm that the symptoms stop, and only then start looking for the cause. A calm rollback is almost always cheaper than a clever fix applied under pressure, and it leaves the evidence intact for the review afterwards.

> Treat every limit as a decision someone made on purpose. If you can't find the reason, find the person before changing it.

- [x] Confirm the rollout plan with the on-call engineer.
- [ ] Update the dashboard links in the team handbook.
- [ ] Schedule a follow-up review in two weeks.

---

## 11. Working with deploy rollbacks

When you look closely at deploy rollbacks, the first thing to notice is that most of the work happens before any user sees a result. Each stage hands a small, well defined piece of state to the next one, and the system stays predictable only while those hand-offs stay **explicit**. In practice that means writing down what each stage owns, what it may assume, and what it must never touch.

A common mistake is to treat deploy rollbacks as a single unit. It is easier to reason about as a chain of _independent_ steps, where each step can fail, retry, or be skipped without corrupting the others. Section 11 walks through those steps in order and points out where the sharp edges are, using `config.deploy` as the running example.

- Write down who owns deploy rollbacks and how to reach them during an incident.
- Record the current limits, including the ones nobody remembers setting.
- Add an alert that fires before users notice, not after.
  - Page only on symptoms that need a human right now.
  - Send everything else to a daily digest.
- Review the runbook every quarter and delete steps that no longer apply.

The [reference documentation](https://example.com/docs/10) covers the full option list, but three settings matter far more than the rest: the timeout, the retry limit, and the size of the working set. Get those right and deploy rollbacks mostly takes care of itself; get them wrong and no amount of tuning elsewhere will help. Keep ~~guessing~~ measuring before changing any of them.

### Checklist for deploy rollbacks

1. Reproduce the problem with deploy rollbacks in a staging environment first.
2. Capture the exact inputs, the expected output, and the observed output.
3. Change one variable at a time and note the effect of each change.
4. Ship the smallest fix that explains every observation you recorded.

Finally, remember that deploy rollbacks is shared by every team that ships to this service. A change that looks local can shift latency for someone else, so announce it early, roll it out behind a flag, and watch the dashboards for at least one full traffic cycle before you call it done.

If something does go wrong with deploy rollbacks, resist the urge to fix it in place. Roll back first, confirm that the symptoms stop, and only then start looking for the cause. A calm rollback is almost always cheaper than a clever fix applied under pressure, and it leaves the evidence intact for the review afterwards.

> Treat every limit as a decision someone made on purpose. If you can't find the reason, find the person before changing it.

- [x] Confirm the rollout plan with the on-call engineer.
- [ ] Update the dashboard links in the team handbook.
- [ ] Schedule a follow-up review in two weeks.

---

## 12. Working with queue backpressure

When you look closely at queue backpressure, the first thing to notice is that most of the work happens before any user sees a result. Each stage hands a small, well defined piece of state to the next one, and the system stays predictable only while those hand-offs stay **explicit**. In practice that means writing down what each stage owns, what it may assume, and what it must never touch.

A common mistake is to treat queue backpressure as a single unit. It is easier to reason about as a chain of _independent_ steps, where each step can fail, retry, or be skipped without corrupting the others. Section 12 walks through those steps in order and points out where the sharp edges are, using `config.queue` as the running example.

- Write down who owns queue backpressure and how to reach them during an incident.
- Record the current limits, including the ones nobody remembers setting.
- Add an alert that fires before users notice, not after.
  - Page only on symptoms that need a human right now.
  - Send everything else to a daily digest.
- Review the runbook every quarter and delete steps that no longer apply.

The [reference documentation](https://example.com/docs/11) covers the full option list, but three settings matter far more than the rest: the timeout, the retry limit, and the size of the working set. Get those right and queue backpressure mostly takes care of itself; get them wrong and no amount of tuning elsewhere will help. Keep ~~guessing~~ measuring before changing any of them.

### Checklist for queue backpressure

1. Reproduce the problem with queue backpressure in a staging environment first.
2. Capture the exact inputs, the expected output, and the observed output.
3. Change one variable at a time and note the effect of each change.
4. Ship the smallest fix that explains every observation you recorded.

Finally, remember that queue backpressure is shared by every team that ships to this service. A change that looks local can shift latency for someone else, so announce it early, roll it out behind a flag, and watch the dashboards for at least one full traffic cycle before you call it done.

If something does go wrong with queue backpressure, resist the urge to fix it in place. Roll back first, confirm that the symptoms stop, and only then start looking for the cause. A calm rollback is almost always cheaper than a clever fix applied under pressure, and it leaves the evidence intact for the review afterwards.

> Treat every limit as a decision someone made on purpose. If you can't find the reason, find the person before changing it.

- [x] Confirm the rollout plan with the on-call engineer.
- [ ] Update the dashboard links in the team handbook.
- [ ] Schedule a follow-up review in two weeks.

---

## 13. Working with secret rotation

When you look closely at secret rotation, the first thing to notice is that most of the work happens before any user sees a result. Each stage hands a small, well defined piece of state to the next one, and the system stays predictable only while those hand-offs stay **explicit**. In practice that means writing down what each stage owns, what it may assume, and what it must never touch.

A common mistake is to treat secret rotation as a single unit. It is easier to reason about as a chain of _independent_ steps, where each step can fail, retry, or be skipped without corrupting the others. Section 13 walks through those steps in order and points out where the sharp edges are, using `config.secret` as the running example.

- Write down who owns secret rotation and how to reach them during an incident.
- Record the current limits, including the ones nobody remembers setting.
- Add an alert that fires before users notice, not after.
  - Page only on symptoms that need a human right now.
  - Send everything else to a daily digest.
- Review the runbook every quarter and delete steps that no longer apply.

The [reference documentation](https://example.com/docs/12) covers the full option list, but three settings matter far more than the rest: the timeout, the retry limit, and the size of the working set. Get those right and secret rotation mostly takes care of itself; get them wrong and no amount of tuning elsewhere will help. Keep ~~guessing~~ measuring before changing any of them.

### Checklist for secret rotation

1. Reproduce the problem with secret rotation in a staging environment first.
2. Capture the exact inputs, the expected output, and the observed output.
3. Change one variable at a time and note the effect of each change.
4. Ship the smallest fix that explains every observation you recorded.

Finally, remember that secret rotation is shared by every team that ships to this service. A change that looks local can shift latency for someone else, so announce it early, roll it out behind a flag, and watch the dashboards for at least one full traffic cycle before you call it done.

If something does go wrong with secret rotation, resist the urge to fix it in place. Roll back first, confirm that the symptoms stop, and only then start looking for the cause. A calm rollback is almost always cheaper than a clever fix applied under pressure, and it leaves the evidence intact for the review afterwards.

> Treat every limit as a decision someone made on purpose. If you can't find the reason, find the person before changing it.

- [x] Confirm the rollout plan with the on-call engineer.
- [ ] Update the dashboard links in the team handbook.
- [ ] Schedule a follow-up review in two weeks.

---

## 14. Working with capacity planning

When you look closely at capacity planning, the first thing to notice is that most of the work happens before any user sees a result. Each stage hands a small, well defined piece of state to the next one, and the system stays predictable only while those hand-offs stay **explicit**. In practice that means writing down what each stage owns, what it may assume, and what it must never touch.

A common mistake is to treat capacity planning as a single unit. It is easier to reason about as a chain of _independent_ steps, where each step can fail, retry, or be skipped without corrupting the others. Section 14 walks through those steps in order and points out where the sharp edges are, using `config.capacity` as the running example.

- Write down who owns capacity planning and how to reach them during an incident.
- Record the current limits, including the ones nobody remembers setting.
- Add an alert that fires before users notice, not after.
  - Page only on symptoms that need a human right now.
  - Send everything else to a daily digest.
- Review the runbook every quarter and delete steps that no longer apply.

The [reference documentation](https://example.com/docs/13) covers the full option list, but three settings matter far more than the rest: the timeout, the retry limit, and the size of the working set. Get those right and capacity planning mostly takes care of itself; get them wrong and no amount of tuning elsewhere will help. Keep ~~guessing~~ measuring before changing any of them.

### Checklist for capacity planning

1. Reproduce the problem with capacity planning in a staging environment first.
2. Capture the exact inputs, the expected output, and the observed output.
3. Change one variable at a time and note the effect of each change.
4. Ship the smallest fix that explains every observation you recorded.

Finally, remember that capacity planning is shared by every team that ships to this service. A change that looks local can shift latency for someone else, so announce it early, roll it out behind a flag, and watch the dashboards for at least one full traffic cycle before you call it done.

If something does go wrong with capacity planning, resist the urge to fix it in place. Roll back first, confirm that the symptoms stop, and only then start looking for the cause. A calm rollback is almost always cheaper than a clever fix applied under pressure, and it leaves the evidence intact for the review afterwards.

> Treat every limit as a decision someone made on purpose. If you can't find the reason, find the person before changing it.

- [x] Confirm the rollout plan with the on-call engineer.
- [ ] Update the dashboard links in the team handbook.
- [ ] Schedule a follow-up review in two weeks.

---

## 15. Working with dependency upgrades

When you look closely at dependency upgrades, the first thing to notice is that most of the work happens before any user sees a result. Each stage hands a small, well defined piece of state to the next one, and the system stays predictable only while those hand-offs stay **explicit**. In practice that means writing down what each stage owns, what it may assume, and what it must never touch.

A common mistake is to treat dependency upgrades as a single unit. It is easier to reason about as a chain of _independent_ steps, where each step can fail, retry, or be skipped without corrupting the others. Section 15 walks through those steps in order and points out where the sharp edges are, using `config.dependency` as the running example.

- Write down who owns dependency upgrades and how to reach them during an incident.
- Record the current limits, including the ones nobody remembers setting.
- Add an alert that fires before users notice, not after.
  - Page only on symptoms that need a human right now.
  - Send everything else to a daily digest.
- Review the runbook every quarter and delete steps that no longer apply.

The [reference documentation](https://example.com/docs/14) covers the full option list, but three settings matter far more than the rest: the timeout, the retry limit, and the size of the working set. Get those right and dependency upgrades mostly takes care of itself; get them wrong and no amount of tuning elsewhere will help. Keep ~~guessing~~ measuring before changing any of them.

### Checklist for dependency upgrades

1. Reproduce the problem with dependency upgrades in a staging environment first.
2. Capture the exact inputs, the expected output, and the observed output.
3. Change one variable at a time and note the effect of each change.
4. Ship the smallest fix that explains every observation you recorded.

Finally, remember that dependency upgrades is shared by every team that ships to this service. A change that looks local can shift latency for someone else, so announce it early, roll it out behind a flag, and watch the dashboards for at least one full traffic cycle before you call it done.

If something does go wrong with dependency upgrades, resist the urge to fix it in place. Roll back first, confirm that the symptoms stop, and only then start looking for the cause. A calm rollback is almost always cheaper than a clever fix applied under pressure, and it leaves the evidence intact for the review afterwards.

> Treat every limit as a decision someone made on purpose. If you can't find the reason, find the person before changing it.

- [x] Confirm the rollout plan with the on-call engineer.
- [ ] Update the dashboard links in the team handbook.
- [ ] Schedule a follow-up review in two weeks.

---

## 16. Working with load shedding

When you look closely at load shedding, the first thing to notice is that most of the work happens before any user sees a result. Each stage hands a small, well defined piece of state to the next one, and the system stays predictable only while those hand-offs stay **explicit**. In practice that means writing down what each stage owns, what it may assume, and what it must never touch.

A common mistake is to treat load shedding as a single unit. It is easier to reason about as a chain of _independent_ steps, where each step can fail, retry, or be skipped without corrupting the others. Section 16 walks through those steps in order and points out where the sharp edges are, using `config.load` as the running example.

- Write down who owns load shedding and how to reach them during an incident.
- Record the current limits, including the ones nobody remembers setting.
- Add an alert that fires before users notice, not after.
  - Page only on symptoms that need a human right now.
  - Send everything else to a daily digest.
- Review the runbook every quarter and delete steps that no longer apply.

The [reference documentation](https://example.com/docs/15) covers the full option list, but three settings matter far more than the rest: the timeout, the retry limit, and the size of the working set. Get those right and load shedding mostly takes care of itself; get them wrong and no amount of tuning elsewhere will help. Keep ~~guessing~~ measuring before changing any of them.

### Checklist for load shedding

1. Reproduce the problem with load shedding in a staging environment first.
2. Capture the exact inputs, the expected output, and the observed output.
3. Change one variable at a time and note the effect of each change.
4. Ship the smallest fix that explains every observation you recorded.

Finally, remember that load shedding is shared by every team that ships to this service. A change that looks local can shift latency for someone else, so announce it early, roll it out behind a flag, and watch the dashboards for at least one full traffic cycle before you call it done.

If something does go wrong with load shedding, resist the urge to fix it in place. Roll back first, confirm that the symptoms stop, and only then start looking for the cause. A calm rollback is almost always cheaper than a clever fix applied under pressure, and it leaves the evidence intact for the review afterwards.

> Treat every limit as a decision someone made on purpose. If you can't find the reason, find the person before changing it.

- [x] Confirm the rollout plan with the on-call engineer.
- [ ] Update the dashboard links in the team handbook.
- [ ] Schedule a follow-up review in two weeks.

---

## 17. Working with data retention

When you look closely at data retention, the first thing to notice is that most of the work happens before any user sees a result. Each stage hands a small, well defined piece of state to the next one, and the system stays predictable only while those hand-offs stay **explicit**. In practice that means writing down what each stage owns, what it may assume, and what it must never touch.

A common mistake is to treat data retention as a single unit. It is easier to reason about as a chain of _independent_ steps, where each step can fail, retry, or be skipped without corrupting the others. Section 17 walks through those steps in order and points out where the sharp edges are, using `config.data` as the running example.

- Write down who owns data retention and how to reach them during an incident.
- Record the current limits, including the ones nobody remembers setting.
- Add an alert that fires before users notice, not after.
  - Page only on symptoms that need a human right now.
  - Send everything else to a daily digest.
- Review the runbook every quarter and delete steps that no longer apply.

The [reference documentation](https://example.com/docs/16) covers the full option list, but three settings matter far more than the rest: the timeout, the retry limit, and the size of the working set. Get those right and data retention mostly takes care of itself; get them wrong and no amount of tuning elsewhere will help. Keep ~~guessing~~ measuring before changing any of them.

### Checklist for data retention

1. Reproduce the problem with data retention in a staging environment first.
2. Capture the exact inputs, the expected output, and the observed output.
3. Change one variable at a time and note the effect of each change.
4. Ship the smallest fix that explains every observation you recorded.

Finally, remember that data retention is shared by every team that ships to this service. A change that looks local can shift latency for someone else, so announce it early, roll it out behind a flag, and watch the dashboards for at least one full traffic cycle before you call it done.

If something does go wrong with data retention, resist the urge to fix it in place. Roll back first, confirm that the symptoms stop, and only then start looking for the cause. A calm rollback is almost always cheaper than a clever fix applied under pressure, and it leaves the evidence intact for the review afterwards.

> Treat every limit as a decision someone made on purpose. If you can't find the reason, find the person before changing it.

- [x] Confirm the rollout plan with the on-call engineer.
- [ ] Update the dashboard links in the team handbook.
- [ ] Schedule a follow-up review in two weeks.

---

## 18. Working with incident reviews

When you look closely at incident reviews, the first thing to notice is that most of the work happens before any user sees a result. Each stage hands a small, well defined piece of state to the next one, and the system stays predictable only while those hand-offs stay **explicit**. In practice that means writing down what each stage owns, what it may assume, and what it must never touch.

A common mistake is to treat incident reviews as a single unit. It is easier to reason about as a chain of _independent_ steps, where each step can fail, retry, or be skipped without corrupting the others. Section 18 walks through those steps in order and points out where the sharp edges are, using `config.incident` as the running example.

- Write down who owns incident reviews and how to reach them during an incident.
- Record the current limits, including the ones nobody remembers setting.
- Add an alert that fires before users notice, not after.
  - Page only on symptoms that need a human right now.
  - Send everything else to a daily digest.
- Review the runbook every quarter and delete steps that no longer apply.

The [reference documentation](https://example.com/docs/17) covers the full option list, but three settings matter far more than the rest: the timeout, the retry limit, and the size of the working set. Get those right and incident reviews mostly takes care of itself; get them wrong and no amount of tuning elsewhere will help. Keep ~~guessing~~ measuring before changing any of them.

### Checklist for incident reviews

1. Reproduce the problem with incident reviews in a staging environment first.
2. Capture the exact inputs, the expected output, and the observed output.
3. Change one variable at a time and note the effect of each change.
4. Ship the smallest fix that explains every observation you recorded.

Finally, remember that incident reviews is shared by every team that ships to this service. A change that looks local can shift latency for someone else, so announce it early, roll it out behind a flag, and watch the dashboards for at least one full traffic cycle before you call it done.

If something does go wrong with incident reviews, resist the urge to fix it in place. Roll back first, confirm that the symptoms stop, and only then start looking for the cause. A calm rollback is almost always cheaper than a clever fix applied under pressure, and it leaves the evidence intact for the review afterwards.

> Treat every limit as a decision someone made on purpose. If you can't find the reason, find the person before changing it.

- [x] Confirm the rollout plan with the on-call engineer.
- [ ] Update the dashboard links in the team handbook.
- [ ] Schedule a follow-up review in two weeks.

---
