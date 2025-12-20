# {{ categories_info["infrastructure"].name }}

{{ categories_info["infrastructure"].description }}

**{{ categories_info["infrastructure"].count }} skills disponibles**

## Skills

{{ skills_table("infrastructure") }}

## Domaines couverts

### Hostinger VPS
- `julien-infra-hostinger-core` - Configuration de base
- `julien-infra-hostinger-docker` - Gestion Docker
- `julien-infra-hostinger-database` - Bases de données
- `julien-infra-hostinger-security` - Sécurité
- `julien-infra-hostinger-web` - Configuration web

### Déploiement
- `julien-infra-deployment-verifier` - Vérification de déploiement
- `julien-infra-git-vps-sync` - Synchronisation Git vers VPS

## Utilisation

```bash
# Gérer Docker sur Hostinger
Skill("julien-infra-hostinger-docker")

# Vérifier un déploiement
Skill("julien-infra-deployment-verifier")
```
