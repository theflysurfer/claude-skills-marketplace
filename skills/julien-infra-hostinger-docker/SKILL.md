---
name: docker-hostinger
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
4. Upload to server via heredoc (permission-safe)
5. Build without cache: `docker-compose build --no-cache`
6. Deploy with force-recreate
7. Verify status and logs
8. Clean dangling images: `docker image prune -f`

See `references/optimization-workflow.md` for detailed steps.

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

## Scripts

- `scripts/deploy-service.sh` - Deploy service with best practices
- `scripts/optimize-image.sh` - Generate optimized Dockerfile
- `scripts/cleanup-docker.sh` - Clean unused resources
