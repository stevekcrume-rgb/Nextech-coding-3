# Performance Test Framework - Course Completion Workflow

A modular k6 performance testing framework for the Polanji Learning Platform API, implementing smoke, load, and stress testing scenarios for the Course Completion workflow including Docker support.

---

## Overview

This project implements a modular performance testing framework using k6. It is designed to simulate realistic user behavior on the Polanji API, focusing on the Course Completion workflow. The framework isolates configuration, logic, and execution to support scalability and maintainability. The project features a scenario-based testing approach, extensible utility functions, and containerized deployment options.

---

## Features

- **Scenario-Based Testing**: Organize and execute tests using predefined scenarios
- **Modular Architecture**: Clean separation of concerns with dedicated folders for configs, libraries, and utilities
- **Docker Support**: Containerized environment for consistent testing across platforms
- **CI/CD Integration**: GitHub Actions workflows for automated testing and deployment
- **Extensible Design**: Easy to add new test scenarios and utility functions

---

## Project Structure

```
.
├── .github/
│   └── workflows/        # GitHub Actions CI/CD pipelines
├── config/               # Configuration files
├── lib/                  # Core API library
├── reports/              # K6 Results
├── scenarios/            # Test scenarios and workflows
├── tests/                # Independent API tests 
├── utils/                # Utility functions and helpers
├── .gitignore
└── docker-compose.yml    # Docker composition configuration
```

---

## Prerequisites

- **k6** v0.45.0 or higher (for local development)
- **Node.js** (v18.x or higher recommended)
- **npm** or **yarn**
- **Docker** and **Docker Compose** (for containerized deployment)

---

## Usage

### Running Tests Locally

The project uses docker-compose to standardize the execution environment. Select workload profiles using the WORKLOAD environment variable.

```bash
# 1. Smoke Test (Default)
# Runs a single iteration with 1 VU to verify script logic and system health.
k6 run scenarios/workflow.js

# 2. Load Test (Baseline)
# Runs a multi-stage test peaking at 5 VUs to establish baseline metrics.
k6 run -e WORKLOAD=load scenarios/workflow.js

# 3. Stress Test (Breaking Point)
# Runs an aggressive test peaking at 20 VUs to identify system limits and bottlenecks.
k6 run -e WORKLOAD=stress scenarios/workflow.js
```

### Running with Docker

```bash
# 1. Smoke Test (Default)
# Runs a single iteration with 1 VU to verify script logic and system health.
docker-compose run --rm k6

# 2. Load Test (Baseline)
# Runs a multi-stage test peaking at 5 VUs to establish baseline metrics.
docker-compose run --rm -e WORKLOAD=load k6

# 3. Stress Test (Breaking Point)
# Runs an aggressive test peaking at 20 VUs to identify system limits and bottlenecks.
docker-compose run --rm -e WORKLOAD=stress k6
```

## Root Cause Analysis (RCA) Report

### Incident Summary

During stress testing with 20 concurrent virtual users, the **Quiz Completion endpoint** (`POST /courses/{course_id}/sections/{section_index}/quiz-complete`) exhibited a **24.2% failure rate**, while all other endpoints maintained 100% success rates. This pattern points to a **database write contention** bottleneck.

---

### 1. Bottleneck Evidence

#### Test Comparison Matrix

| Metric | Smoke (1 VU) | Load (5 VUs) | Stress (20 VUs) |
|--------|--------------|--------------|-----------------|
| **Check Pass Rate** | 100% | 97.42% | **95.77%** |
| **HTTP Failure Rate** | 0% | 0% | **5.88%** |
| **Total Requests** | 28 | 395 | 918 |
| **p(95) Duration** | 785.23ms | 844.90ms | 678.36ms |
Note: The minor check failure (97%) in the Load Test was due to a data availability check (Response has > 1 item) and not performance degradation


#### Stress Test CLI Output (Failure Evidence)

```
█ Workflow: Course Completion

  █ Reading Phase: Progress 10% → 60%
    ✓ Update Progress status is 200

  █ Quiz Phase
    ✓ Get Quizzes status is 200
    ✓ Quizzes response is valid
    ✗ Complete Quiz status is 200
     ↳  75% — ✓ 169 / ✗ 54    ← FAILURE POINT

checks.........................: 95.77% ✓ 1224     ✗ 54  
http_req_failed................: 5.88%  ✓ 54       ✗ 864 
```

#### Response Time Degradation (Quiz Completion Endpoint)

| Test Type | Avg | p(95) | Max | Status |
|-----------|-----|-------|-----|--------|
| Smoke (1 VU) | 300.75ms | 348.27ms | 357.85ms | ✓ Stable |
| Load (5 VUs) | 339.10ms | 464.72ms | **1,595.60ms** | ⚠ Degrading |
| Stress (20 VUs) | 305.24ms | 575.05ms | 814.34ms | ✗ Failing |

**Key Observation:** The p(95) latency increased significantly (over 50%) from smoke to stress testing. Under load testing, max latency spiked to **1.6 seconds** before requests began failing entirely under stress conditions.

---

### 2. Root Cause Hypothesis

**Primary Hypothesis: Database Write Contention**

The bottleneck resides in the **Database Layer** with contributing factors in the **Application Code Layer** specifically related to Row Locking or Transaction Contention on the user_course_progress or quiz_submissions tables.

#### Justification Based on k6 Metric Patterns

**Pattern 1: Writes fail while reads succeed**

| Endpoint | Operation Type | Stress Result |
|----------|---------------|---------------|
| Get Quizzes | READ | 100% (224/224) |
| Get Course Detail | READ | 100% (67/67) |
| Update Progress | WRITE | 100% (238/238) |
| **Complete Quiz** | **WRITE** | **75% (169/223)** |

This pattern where read operations remain stable but a specific write operation fails is the signature of **database write contention** or **row-level locking**.

**Pattern 2: Response Time Distribution**

```
Quiz Completion Response Times:
  Smoke:  avg=300.75ms, p(95)=348.27ms   → Tight distribution
  Load:   avg=339.10ms, p(95)=464.72ms   → Gap widening (queuing begins)
  Stress: avg=305.24ms, p(95)=575.05ms   → Requests timeout instead of queue
```

The divergence between average and p(95) indicates request queuing. Under stress, instead of latency continuing to rise, requests **fail outright**—suggesting connection pool exhaustion or transaction timeouts.

**Pattern 3: Multi-Table Write Operation**

The `POST /courses/{course_id}/sections/{section_index}/quiz-complete` endpoint performs:

1. Update `section_quizzes` state
2. Potentially trigger completion calculations

When 20 VUs simultaneously complete quizzes on the same course sections, this creates:
- Row-level lock contention on shared resources
- Potential deadlock scenarios
- Transaction timeout failures

---

### 3. Diagnostic Pattern Reference

**Infrastructure Metrics (Stress Test) - No Issues Detected:**

```
http_req_blocked............: avg=24.16ms  med=1.04µs   p(95)=1.58µs   ✓
http_req_connecting.........: avg=6.01ms   med=0s       p(95)=0s       ✓
http_req_tls_handshaking....: avg=18.07ms  med=0s       p(95)=0s       ✓
```

Median values near zero with elevated averages only due to initial connection establishment rules out infrastructure as the bottleneck.

---

### 4. Recommended Mitigations

Primary recommendation is to add a database index on section_quizzes to reduce lock contention. If that fails, implement a queue (Redis/RabbitMQ) for quiz submissions to decouple the write operation.

---

## Architectural & Operational Documentation

This framework tests the **Course Completion Workflow** on the Polanji Learning Platform, covering:

1. User Authentication
2. Interest & Recommendation Retrieval
3. Course Enrollment
4. Reading Progress Updates (10% → 60%)
5. Quiz Retrieval & Completion


## Tagging Strategy for Analysis

To enable effective analysis without APM tools, I implemented a strict Business Transaction Tagging strategy using the tags: { name: '...' } feature in k6.

### Why this is necessary:
By default, k6 aggregates metrics by URL. Since these URLs contain dynamic path parameters, default aggregation would create useless unique metrics.

### Tagging Rules Implemented:

Format: Entity_Action (e.g., Auth_Login, Enrollment_Enroll, Course_CompleteQuiz).

Implementation: Every API call in the src/lib/ modules includes a custom tag.

Result: This allows us to query http_req_duration specifically for "Enrollment" versus "Browsing," enabling the precise identification of the write-heavy bottleneck shown in the RCA above.

```bash
// Example from lib/Course.js
const params = { 
    headers: { ... }, 
    tags: { name: 'Course_CompleteQuiz' } // Groups all dynamic IDs under one label
};
```

### Target System

| Resource | Details |
|----------|---------|
| Website URL | https://www.polanji.com |
| OpenAPI Spec | https://api.polanji.com/openapi.json |

### Creating Test Scenarios

1. Create a new file in the `scenarios/` directory
2. Define your test scenario using the framework's API
3. Add the scenario to the test suite

### Configuration

All critical configurations are centralized in config/config.js:

- Test environment settings
- Performance thresholds (Global and API-specific)
- Performance workload (k6 stages)

Sensitive credentials are stored in config/env.js

```bash
// environment configurations and credentials

const environments = {
  // Default environment (using the provided credentials)
  dev: {
    email: 'dev-user@example.com',
    password: 'dev_password',
  },
  // Credentials can be added for production or other environments
  prod: {
    email: 'prod_user@example.com',
    password: 'prod_password',
  },
};

// Select the environment based on the command line flag -e ENV=xxx, defaulting to 'dev'
const selectedEnv = __ENV.ENV || 'dev';

export const credentials = environments[selectedEnv];
```

---

## 👥 Authors

- **stevekcrume-rgb** - *Initial work*
