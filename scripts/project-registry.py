#!/usr/bin/env python3
"""
Gestion du registre de projets (calqué sur Claude Code).

Ce script gère la découverte, l'enregistrement et la mise à jour
des projets dans le registre central.

Usage:
    python project-registry.py scan          # Scan tous les roots
    python project-registry.py discover PATH # Découvre un projet spécifique
    python project-registry.py info [PATH]   # Affiche les infos d'un projet
    python project-registry.py list          # Liste tous les projets
    python project-registry.py encode PATH   # Encode un chemin
"""

import json
import os
import re
import sys
from pathlib import Path
from datetime import datetime
from glob import glob
from typing import Optional

# Chemin vers le registre
SCRIPT_DIR = Path(__file__).parent
REGISTRY_PATH = SCRIPT_DIR.parent / "configs" / "projects-registry.json"


# =============================================================================
# FONCTIONS D'ENCODAGE (calquées sur Claude Code)
# =============================================================================

def encode_path(path: str) -> str:
    """
    Encode un chemin comme Claude Code le fait.

    C:\\Users\\julien\\... → C-Users-julien-...
    /home/user/... → home-user-...
    """
    # Normaliser le chemin (résout les .., /, etc.)
    normalized = os.path.normpath(os.path.abspath(path))

    # Encoder: remplacer séparateurs et : par -
    encoded = normalized.replace('/', '-').replace('\\', '-').replace(':', '-')

    # Nettoyer les doubles tirets
    while '--' in encoded:
        encoded = encoded.replace('--', '-')

    return encoded.strip('-')


def decode_path(encoded: str, os_hint: str = "auto") -> str:
    """
    Decode un chemin encodé (best effort, perte d'info possible).

    Args:
        encoded: Le chemin encodé
        os_hint: "windows", "unix", ou "auto" pour auto-détection
    """
    if os_hint == "auto":
        # Auto-détection basée sur le premier caractère
        # Windows: commence par une lettre seule (C-Users-...)
        # Unix: commence par home, usr, etc.
        first_part = encoded.split('-')[0] if '-' in encoded else encoded
        os_hint = "windows" if len(first_part) == 1 and first_part.isalpha() else "unix"

    if os_hint == "windows":
        parts = encoded.split('-', 1)
        if len(parts) == 2 and len(parts[0]) == 1:
            return f"{parts[0]}:\\{parts[1].replace('-', '\\')}"
        return encoded.replace('-', '\\')

    return '/' + encoded.replace('-', '/')


def extract_project_name(folder_name: str) -> str:
    """
    Extrait le nom propre d'un dossier projet.

    Pattern supporté: YYYY.MM Nom → Nom
    Sinon retourne le nom tel quel.
    """
    # Pattern: 2025.12 Mon Projet → Mon Projet
    match = re.match(r'^\d{4}\.\d{2}\s+(.+)$', folder_name)
    if match:
        return match.group(1)
    return folder_name


# =============================================================================
# GESTION DU REGISTRE
# =============================================================================

def load_registry() -> dict:
    """Charge le registre depuis le fichier JSON."""
    if REGISTRY_PATH.exists():
        try:
            return json.loads(REGISTRY_PATH.read_text(encoding="utf-8"))
        except json.JSONDecodeError as e:
            print(f"Erreur de parsing du registre: {e}", file=sys.stderr)
            return create_empty_registry()
    return create_empty_registry()


def save_registry(registry: dict):
    """Sauvegarde le registre dans le fichier JSON."""
    # S'assurer que le dossier existe
    REGISTRY_PATH.parent.mkdir(parents=True, exist_ok=True)

    # Mettre à jour le timestamp
    registry["last_updated"] = datetime.now().isoformat()

    REGISTRY_PATH.write_text(
        json.dumps(registry, indent=2, ensure_ascii=False),
        encoding="utf-8"
    )


def create_empty_registry() -> dict:
    """Crée une structure de registre vide."""
    return {
        "$schema": "./schemas/projects-registry.schema.json",
        "version": "2.0.0",
        "last_updated": datetime.now().isoformat(),
        "last_scan": None,
        "scan_roots": [],
        "scan_stats": {
            "scanned": 0,
            "new": 0,
            "updated": 0,
            "missing": 0
        },
        "projects": {},
        "project_types": {}
    }


# =============================================================================
# DÉTECTION DE TYPE
# =============================================================================

def detect_project_type(path: str, types_config: dict, root_config: Optional[dict] = None) -> Optional[str]:
    """
    Détecte le type de projet basé sur les patterns de fichiers.

    Args:
        path: Chemin du projet
        types_config: Configuration des types depuis le registre
        root_config: Configuration du root (pour default_type)

    Returns:
        Le nom du type détecté ou None
    """
    path_obj = Path(path)

    # Vérifier chaque type de projet
    for type_name, type_info in types_config.items():
        patterns = type_info.get("detection_patterns", [])
        for pattern in patterns:
            # Construire le pattern complet
            full_pattern = str(path_obj / pattern)
            # Utiliser glob avec recursive
            matches = glob(full_pattern, recursive=True)
            if matches:
                return type_name

    # Fallback sur le default_type du root si disponible
    if root_config and "default_type" in root_config:
        return root_config["default_type"]

    return None


def get_git_remote(path: str) -> Optional[str]:
    """
    Récupère l'URL du remote git si disponible.

    Retourne un format normalisé: github.com/user/repo
    """
    git_config = Path(path) / ".git" / "config"

    if not git_config.exists():
        return None

    try:
        content = git_config.read_text(encoding="utf-8")

        # Chercher l'URL du remote origin
        in_remote_origin = False
        for line in content.split('\n'):
            line = line.strip()

            if line == '[remote "origin"]':
                in_remote_origin = True
                continue

            if in_remote_origin:
                if line.startswith('['):
                    break  # Nouvelle section

                if line.startswith('url = '):
                    url = line.split('url = ')[1].strip()

                    # Normaliser l'URL
                    # git@github.com:user/repo.git → github.com/user/repo
                    if 'github.com' in url:
                        url = url.replace('git@github.com:', 'github.com/')
                        url = url.replace('.git', '')
                        if url.startswith('https://'):
                            url = url[8:]
                        return url

                    return url
    except Exception:
        pass

    return None


# =============================================================================
# DÉCOUVERTE DE PROJETS
# =============================================================================

def discover_project(path: str, root_config: Optional[dict] = None) -> dict:
    """
    Découvre et enregistre un nouveau projet.

    Args:
        path: Chemin du projet
        root_config: Configuration du root (optionnel)

    Returns:
        Dictionnaire avec les infos du projet
    """
    registry = load_registry()
    path = os.path.abspath(path)
    encoded = encode_path(path)

    # Projet déjà connu?
    is_new = encoded not in registry["projects"]

    if not is_new:
        # Mettre à jour last_seen seulement
        registry["projects"][encoded]["last_seen"] = datetime.now().isoformat()
        registry["projects"][encoded]["status"] = "active"
        save_registry(registry)
        project = registry["projects"][encoded].copy()
        project["is_new"] = False
        return project

    # Nouveau projet - détecter le type
    project_type = detect_project_type(path, registry.get("project_types", {}), root_config)

    # Obtenir les skills par défaut
    default_skills = []
    if project_type and project_type in registry.get("project_types", {}):
        default_skills = registry["project_types"][project_type].get("default_skills", [])
    elif root_config and "default_skills" in root_config:
        default_skills = root_config["default_skills"]

    # Extraire le nom du dossier
    folder_name = Path(path).name
    clean_name = extract_project_name(folder_name)

    # Construire l'entrée projet
    project = {
        "id": clean_name.lower().replace(' ', '-').replace('[', '').replace(']', ''),
        "name": clean_name,
        "path": path,
        "type": project_type,
        "skills": default_skills,
        "tags": [project_type] if project_type else [],
        "git_remote": get_git_remote(path),
        "root": root_config["path"] if root_config else None,
        "status": "active",
        "discovered_at": datetime.now().isoformat(),
        "last_seen": datetime.now().isoformat()
    }

    # Enregistrer
    registry["projects"][encoded] = project
    save_registry(registry)

    project_copy = project.copy()
    project_copy["is_new"] = True
    return project_copy


def scan_project_roots(registry: dict) -> list[dict]:
    """
    Scanne tous les roots configurés et découvre les projets.

    Returns:
        Liste des projets découverts
    """
    discovered = []

    for root_config in registry.get("scan_roots", []):
        root_path = Path(root_config["path"])
        depth = root_config.get("depth", 1)

        if not root_path.exists():
            print(f"Root non trouvé: {root_path}", file=sys.stderr)
            continue

        print(f"Scanning: {root_path}")

        # Lister les sous-dossiers
        for item in root_path.iterdir():
            if not item.is_dir():
                continue
            if item.name.startswith('.'):
                continue

            # Découvrir le projet
            project = discover_project(str(item), root_config)
            discovered.append(project)

    return discovered


def auto_update_registry() -> dict:
    """
    Met à jour le registre avec les projets découverts.

    Returns:
        Statistiques du scan
    """
    registry = load_registry()
    now = datetime.now().isoformat()

    # Scanner tous les roots
    discovered = scan_project_roots(registry)

    # Recharger le registre (modifié par scan_project_roots)
    registry = load_registry()

    # Marquer les projets disparus
    missing_count = 0
    for encoded, project in registry["projects"].items():
        path = project.get("path")
        if path and not Path(path).exists():
            if project.get("status") != "missing":
                project["status"] = "missing"
                project["missing_since"] = now
                missing_count += 1

    # Calculer les stats
    new_count = sum(1 for p in discovered if p.get("is_new", False))
    updated_count = sum(1 for p in discovered if not p.get("is_new", False))

    stats = {
        "scanned": len(discovered),
        "new": new_count,
        "updated": updated_count,
        "missing": missing_count
    }

    registry["last_scan"] = now
    registry["scan_stats"] = stats
    save_registry(registry)

    return stats


def get_skills_for_project(path: str) -> list[str]:
    """
    Retourne les skills associés à un projet.

    Args:
        path: Chemin du projet

    Returns:
        Liste des patterns de skills
    """
    registry = load_registry()
    path = os.path.abspath(path)
    encoded = encode_path(path)

    # Projet enregistré?
    if encoded in registry["projects"]:
        return registry["projects"][encoded].get("skills", [])

    # Projet non enregistré - détecter le type et retourner les defaults
    project_type = detect_project_type(path, registry.get("project_types", {}))
    if project_type and project_type in registry.get("project_types", {}):
        return registry["project_types"][project_type].get("default_skills", [])

    return []


def get_project_info(path: str) -> Optional[dict]:
    """
    Récupère les infos d'un projet enregistré.

    Args:
        path: Chemin du projet

    Returns:
        Dictionnaire des infos ou None si non trouvé
    """
    registry = load_registry()
    path = os.path.abspath(path)
    encoded = encode_path(path)

    if encoded in registry["projects"]:
        return registry["projects"][encoded]

    return None


def list_projects(status_filter: Optional[str] = None) -> list[dict]:
    """
    Liste tous les projets enregistrés.

    Args:
        status_filter: Filtrer par status ("active", "missing", None pour tous)

    Returns:
        Liste des projets
    """
    registry = load_registry()
    projects = []

    for encoded, project in registry["projects"].items():
        if status_filter and project.get("status") != status_filter:
            continue

        project_copy = project.copy()
        project_copy["encoded_path"] = encoded
        projects.append(project_copy)

    # Trier par nom
    projects.sort(key=lambda p: p.get("name", ""))

    return projects


# =============================================================================
# CLI
# =============================================================================

def print_project_info(project: dict, verbose: bool = False):
    """Affiche les infos d'un projet de manière formatée."""
    status_icon = {
        "active": "[OK]",
        "missing": "[??]"
    }.get(project.get("status"), "[--]")

    print(f"{status_icon} {project.get('name', 'Unknown')}")
    print(f"    Type: {project.get('type') or 'non détecté'}")
    print(f"    Path: {project.get('path')}")

    if project.get("skills"):
        skills_str = ", ".join(project["skills"][:3])
        if len(project["skills"]) > 3:
            skills_str += f" (+{len(project['skills']) - 3})"
        print(f"    Skills: {skills_str}")

    if verbose:
        if project.get("git_remote"):
            print(f"    Git: {project['git_remote']}")
        if project.get("tags"):
            print(f"    Tags: {', '.join(project['tags'])}")
        print(f"    Découvert: {project.get('discovered_at', 'N/A')}")
        print(f"    Vu: {project.get('last_seen', 'N/A')}")


def main():
    """Point d'entrée CLI."""
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)

    command = sys.argv[1].lower()

    if command == "scan":
        print("Scanning des roots de projets...")
        stats = auto_update_registry()
        print(f"\nRésultat du scan:")
        print(f"  - Projets scannés: {stats['scanned']}")
        print(f"  - Nouveaux: {stats['new']}")
        print(f"  - Mis à jour: {stats['updated']}")
        print(f"  - Manquants: {stats['missing']}")

    elif command == "discover":
        if len(sys.argv) < 3:
            print("Usage: project-registry.py discover PATH", file=sys.stderr)
            sys.exit(1)

        path = sys.argv[2]
        project = discover_project(path)
        status = "Nouveau projet découvert" if project.get("is_new") else "Projet mis à jour"
        print(f"{status}:")
        print_project_info(project, verbose=True)

    elif command == "info":
        path = sys.argv[2] if len(sys.argv) > 2 else os.getcwd()
        project = get_project_info(path)

        if project:
            print_project_info(project, verbose=True)
        else:
            print(f"Projet non enregistré: {path}")
            print("Utilisez 'discover' pour l'enregistrer.")

    elif command == "list":
        projects = list_projects()

        if not projects:
            print("Aucun projet enregistré.")
            print("Utilisez 'scan' pour découvrir les projets.")
            sys.exit(0)

        print(f"Projets enregistrés ({len(projects)}):\n")
        for project in projects:
            print_project_info(project)
            print()

    elif command == "encode":
        if len(sys.argv) < 3:
            print("Usage: project-registry.py encode PATH", file=sys.stderr)
            sys.exit(1)

        path = sys.argv[2]
        encoded = encode_path(path)
        print(f"Original: {path}")
        print(f"Encodé:   {encoded}")

    elif command == "skills":
        path = sys.argv[2] if len(sys.argv) > 2 else os.getcwd()
        skills = get_skills_for_project(path)

        if skills:
            print(f"Skills pour {Path(path).name}:")
            for skill in skills:
                print(f"  - {skill}")
        else:
            print(f"Aucun skill associé à: {path}")

    else:
        print(f"Commande inconnue: {command}", file=sys.stderr)
        print(__doc__)
        sys.exit(1)


if __name__ == "__main__":
    main()
