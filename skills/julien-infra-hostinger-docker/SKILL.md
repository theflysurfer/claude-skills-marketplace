---
name: julien-infra-hostinger-docker
description: This skill should be used when managing Docker services on the Hostinger VPS (srv759970, automation@69.62.108.82). It provides workflows for optimizing images, deploying services, troubleshooting errors, and maintaining the Docker infrastructure for Python/FastAPI, Streamlit, Next.js, and ML applications.
---

# Docker Hostinger VPS Management

Manage Docker services on Hostinger VPS (srv759970) at `automation@69.62.108.82`.

## Server Configuration

- **Host**: `automation@69.62.108.82`
- **Base path**: `/opt/`
- **Disk**: 193 GB total, ~117 GB available
- **Services**: 30+ containers including ML apps (WhisperX 12GB, Paperflow 6.65GB), dashboards, APIs, databases

## Core Workflows

### Status Check

To check service status and disk usage:

```bash
ssh automation@69.62.108.82 "docker ps --format 'table {{.Names}}\t{{.Status}}'"
ssh automation@69.62.108.82 "docker system df"
```

### Deploy Service

To deploy or update a service:

1. Navigate to service directory: `cd /opt/[service-name]`
2. Build image: `docker-compose build`
3. Deploy: `docker-compose up -d`

For services with optimization or after ContainerConfig errors:
```bash
docker-compose down && docker-compose up -d --force-recreate
```

### Optimize Image

To create optimized multi-stage Dockerfile:

1. Backup original: `cp Dockerfile Dockerfile.old.bak`
2. Select template from `references/dockerfiles/` based on stack type
3. Adapt template (ports, commands, healthchecks, user names)
4. **Apply layer optimization best practices** (see `references/layer-optimization-best-practices.md`):
   - Order layers from least to most frequently changed (deps before code)
   - Use multi-stage builds (builder + runtime)
   - Combine RUN commands to reduce layer count
   - Add .dockerignore to exclude unnecessary files
   - Use --no-cache-dir flags for package managers
   - Install only production dependencies in runtime stage
5. Upload to server via heredoc (permission-safe)
6. Build without cache: `docker-compose build --no-cache`
7. Deploy with force-recreate
8. Verify status and logs
9. Clean dangling images: `docker image prune -f`

See `references/optimization-workflow.md` for detailed workflow steps.
See `references/layer-optimization-best-practices.md` for comprehensive layer optimization guide.

### Troubleshoot Errors

Common errors and solutions:

- **ContainerConfig KeyError**: Use `docker-compose down && docker-compose up -d --force-recreate`
- **Network has active endpoints**: Skip `down`, use only `up -d --force-recreate`
- **Wrong CMD in container**: Rebuild with `--no-cache` flag
- **Permission denied (scp)**: Use `cat` with heredoc instead

See `references/troubleshooting.md` for complete error reference.

### Cleanup

To reclaim disk space:

```bash
# Remove dangling images
ssh automation@69.62.108.82 "docker image prune -f"

# Remove unused volumes
ssh automation@69.62.108.82 "docker volume prune -f"
```

## Service Categories

**Optimized Apps** (multi-stage builds):
- support-dashboard (665 MB)
- downto40-streamlit (778 MB)
- discord-bot (617 MB)
- langchain-service (333 MB)
- mkdocs (225 MB)

**ML Apps** (do not optimize):
- whisperx (12.2 GB - large-v3 model, French)
- paperflow (6.65 GB - ML dependencies)

**Infrastructure**:
- prometheus, grafana, loki, promtail
- postgres, mysql, mongo, redis
- portainer

See `references/services-catalog.md` for complete list with ports and details.

## Key Principles

- Always backup before optimization
- Use `--no-cache` after creating optimized Dockerfiles
- Verify logs after deployment
- Include health checks for API/web services
- Use non-root users for security
- Clean dangling images regularly

## Templates

Multi-stage Dockerfile templates available in `references/dockerfiles/`:
- `python-fastapi.dockerfile` - FastAPI/Flask applications
- `python-streamlit.dockerfile` - Streamlit dashboards
- `nextjs.dockerfile` - Next.js applications

Standard `.dockerignore` available in `assets/dockerignore-standard`.

## Layer Optimization

Docker layer optimization is **critical** for:
- **Faster builds**: Cache reuse when dependencies unchanged
- **Smaller images**: 64% average size reduction (1.8 GB → 650 MB)
- **Disk space**: 17+ GB saved across all services on srv759970
- **Faster deployments**: Smaller images = faster pulls and startups

**Core principles:**
1. **Order layers strategically**: Dependencies before code (maximize cache hits)
2. **Multi-stage builds**: Separate build tools from runtime (discard build deps)
3. **Combine RUN commands**: Reduce layer count, cleanup in same layer
4. **Use .dockerignore**: Exclude tests, docs, .git (faster COPY, smaller context)
5. **Production deps only**: Remove dev dependencies from runtime stage

See `references/layer-optimization-best-practices.md` for:
- Detailed explanations with before/after examples
- Real-world optimizations (FastAPI 72% reduction, Next.js 76% reduction)
- Layer ordering checklist
- When to optimize vs when to skip (ML models)

## Scripts

- `scripts/deploy-service.sh` - Deploy service with best practices
- `scripts/optimize-image.sh` - Generate optimized Dockerfile
- `scripts/cleanup-docker.sh` - Clean unused resources

## 🔗 Skill Chaining

### Skills Required Before
- **julien-infra-hostinger-ssh** (recommandé): Ensures SSH access to VPS before Docker operations

### Input Expected
- SSH access to VPS: `automation@69.62.108.82`
- Service directory exists: `/opt/[service-name]/`
- Dockerfile exists (or will be created)
- docker-compose.yml configured
- Sufficient disk space: Check with `docker system df` (>10 GB recommended)

### Output Produced
- **Format**: Docker service deployed and running
- **Side effects**:
  - Docker image built (optimized multi-stage if following best practices)
  - Container created and started via docker-compose
  - Old images become dangling (cleaned with `docker image prune -f`)
  - Logs available via `docker-compose logs`
- **Duration**: 3-10 minutes (build 2-8 min + deploy 1-2 min, varies by service size)

### Compatible Skills After

**Obligatoires:**
- **julien-infra-hostinger-nginx**: Configure reverse proxy for Docker service with IPv6 support (if web service)

**Recommandés:**
- **julien-infra-hostinger-maintenance**: Schedule regular cleanup (prune images/volumes)
- **julien-infra-deployment-verifier**: Verify Docker service health (if HTTP endpoint available)

**Optionnels:**
- Monitoring setup: Prometheus/Grafana for container metrics
- Log aggregation: Loki for centralized Docker logs

### Called By
- Direct user invocation: "Deploy Docker service" or "Optimize Docker image for [service]"
- **julien-infra-hostinger-deployment**: When deploying Dockerized applications
- Manual operations: When troubleshooting or updating services

### Tools Used
- `Bash` (usage: SSH commands, docker build/compose, docker system df, image prune)
- `Read` (usage: read existing Dockerfile, docker-compose.yml before modification)
- `Write` (usage: create optimized Dockerfile, .dockerignore)
- `Edit` (usage: modify docker-compose.yml for environment changes)

### Visual Workflow

```
User: "Deploy support-dashboard Docker service"
    ↓
[Optional] julien-infra-hostinger-ssh (verify SSH access)
    ↓
julien-infra-hostinger-docker (THIS SKILL)
    ├─► Step 1: Analyze current state
    │   ├─► Check existing image size
    │   ├─► Review Dockerfile
    │   └─► Identify optimization opportunities
    ├─► Step 2: Optimize (if needed)
    │   ├─► Backup original Dockerfile
    │   ├─► Select template (python-fastapi/streamlit/nextjs)
    │   ├─► Apply layer optimization best practices:
    │   │   ├─► Multi-stage build (builder + runtime)
    │   │   ├─► Order: deps before code
    │   │   ├─► Combine RUN commands
    │   │   ├─► Add .dockerignore
    │   │   └─► Production deps only in runtime
    │   └─► Upload via heredoc
    ├─► Step 3: Build
    │   ├─► docker-compose build --no-cache
    │   └─► Monitor build progress
    ├─► Step 4: Deploy
    │   ├─► docker-compose down (if exists)
    │   ├─► docker-compose up -d --force-recreate
    │   └─► Verify container status
    ├─► Step 5: Verify
    │   ├─► docker ps | grep [service]
    │   ├─► docker-compose logs --tail=50
    │   └─► Check health status (if healthcheck defined)
    └─► Step 6: Cleanup
        └─► docker image prune -f (remove dangling images)
    ↓
Docker service running ✅
    ↓
[If web service] julien-infra-hostinger-nginx (OBLIGATOIRE)
    ├─► Configure reverse proxy
    ├─► Add IPv6 listeners
    ├─► Request SSL certificate
    └─► Reload nginx
    ↓
[If HTTP endpoint] julien-infra-deployment-verifier
    ├─► Check HTTP status
    ├─► Verify SSL (if HTTPS)
    └─► Take screenshots
```

### Usage Example 1: Deploy Optimized FastAPI Service

**Scenario**: Deploy support-dashboard (FastAPI app) with Docker layer optimization

**Command**:
```bash
# User: "Deploy support-dashboard with optimized Docker image"
```

**Result**:
- Original Dockerfile: 1.2 GB (python:3.11 base, no optimization)
- Optimized Dockerfile applied:
  - Multi-stage build (builder + python:3.11-slim runtime)
  - Dependencies cached separately from code
  - Production deps only (--no-cache-dir)
  - Non-root user for security
- New image size: 333 MB ✅
- **Savings**: 867 MB (72% reduction)
- Container deployed: `support-dashboard` running on port 8000
- Nginx reverse proxy configured: https://support.srv759970.hstgr.cloud
- Duration: ~5 minutes (build 3 min + deploy 1 min + nginx 1 min)

### Usage Example 2: Troubleshoot ContainerConfig Error

**Scenario**: Container fails to start with "KeyError: 'ContainerConfig'" after code change

**Command**:
```bash
# User: "Fix support-dashboard container error"
```

**Result**:
- Error diagnosed: Cached layer mismatch
- Fix applied:
  ```bash
  cd /opt/support-dashboard
  docker-compose down
  docker-compose up -d --force-recreate
  ```
- Container recreated from scratch
- Status: Running ✅
- Duration: ~30 seconds
