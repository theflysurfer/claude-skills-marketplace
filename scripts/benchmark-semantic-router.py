#!/usr/bin/env python3
"""
Benchmark for semantic-skill-router.py
Tests 100 phrases in French and English to measure:
- Response time
- Routing accuracy

Loads the model once and runs all tests efficiently.
"""

import json
import time
import sys
from pathlib import Path

# Expected routing for each phrase
BENCHMARK_PHRASES = [
    # === NGINX (10 phrases) ===
    ("configure nginx for my website", "julien-infra-hostinger-nginx"),
    ("setup reverse proxy", "julien-infra-hostinger-nginx"),
    ("je veux configurer nginx", "julien-infra-hostinger-nginx"),
    ("SSL certificate renewal", "julien-infra-hostinger-nginx"),
    ("certificat ssl expiré", "julien-infra-hostinger-nginx"),
    ("configure https for domain", "julien-infra-hostinger-nginx"),
    ("nginx 502 bad gateway error", "julien-infra-hostinger-nginx"),
    ("proxy pass configuration", "julien-infra-hostinger-nginx"),
    ("let's encrypt certbot", "julien-infra-hostinger-nginx"),
    ("ajouter un nouveau site nginx", "julien-infra-hostinger-nginx"),

    # === DOCKER (10 phrases) ===
    ("start docker container", "julien-infra-hostinger-docker"),
    ("docker compose up", "julien-infra-hostinger-docker"),
    ("lancer les conteneurs", "julien-infra-hostinger-docker"),
    ("optimize docker images", "julien-infra-hostinger-docker"),
    ("nettoyer les images docker", "julien-infra-hostinger-docker"),
    ("container keeps crashing", "julien-infra-hostinger-docker"),
    ("build docker image", "julien-infra-hostinger-docker"),
    ("docker logs command", "julien-infra-hostinger-docker"),
    ("restart all containers", "julien-infra-hostinger-docker"),
    ("dockerfile optimization", "julien-infra-hostinger-docker"),

    # === SSH (10 phrases) ===
    ("connect to server via ssh", "julien-infra-hostinger-ssh"),
    ("connexion ssh au serveur", "julien-infra-hostinger-ssh"),
    ("hostinger vps access", "julien-infra-hostinger-ssh"),
    ("server connection failed", "julien-infra-hostinger-ssh"),
    ("accéder au vps", "julien-infra-hostinger-ssh"),
    ("ssh key authentication", "julien-infra-hostinger-ssh"),
    ("se connecter au serveur", "julien-infra-hostinger-ssh"),
    ("remote server access", "julien-infra-hostinger-ssh"),
    ("terminal connection to vps", "julien-infra-hostinger-ssh"),
    ("clé ssh pour hostinger", "julien-infra-hostinger-ssh"),

    # === DEPLOYMENT (10 phrases) ===
    ("deploy to production", "julien-infra-hostinger-deployment"),
    ("mise en production", "julien-infra-hostinger-deployment"),
    ("déployer l'application", "julien-infra-hostinger-deployment"),
    ("push to live server", "julien-infra-hostinger-deployment"),
    ("mettre en ligne le site", "julien-infra-hostinger-deployment"),
    ("production deployment steps", "julien-infra-hostinger-deployment"),
    ("déploiement automatique", "julien-infra-hostinger-deployment"),
    ("release to production", "julien-infra-hostinger-deployment"),
    ("publier les modifications", "julien-infra-hostinger-deployment"),
    ("sync code to server", "julien-infra-hostinger-deployment"),

    # === SKILL CREATOR (10 phrases) ===
    ("create a new skill", "julien-dev-tools-skill-creator"),
    ("créer une nouvelle skill", "julien-dev-tools-skill-creator"),
    ("write SKILL.md file", "julien-dev-tools-skill-creator"),
    ("add skill to marketplace", "julien-dev-tools-skill-creator"),
    ("développer une skill", "julien-dev-tools-skill-creator"),
    ("skill template creation", "julien-dev-tools-skill-creator"),
    ("nouvelle skill claude", "julien-dev-tools-skill-creator"),
    ("build custom skill", "julien-dev-tools-skill-creator"),
    ("écrire une skill", "julien-dev-tools-skill-creator"),
    ("skill development guide", "julien-dev-tools-skill-creator"),

    # === SKILL REVIEWER (10 phrases) ===
    ("review my skill quality", "julien-dev-tools-skill-reviewer"),
    ("évaluer la qualité de la skill", "julien-dev-tools-skill-reviewer"),
    ("check skill score", "julien-dev-tools-skill-reviewer"),
    ("améliorer ma skill", "julien-dev-tools-skill-reviewer"),
    ("skill audit needed", "julien-dev-tools-skill-reviewer"),
    ("vérifier la skill", "julien-dev-tools-skill-reviewer"),
    ("improve skill quality", "julien-dev-tools-skill-reviewer"),
    ("scorer cette skill", "julien-dev-tools-skill-reviewer"),
    ("skill needs review", "julien-dev-tools-skill-reviewer"),
    ("relire ma skill", "julien-dev-tools-skill-reviewer"),

    # === PDF (10 phrases) ===
    ("extract text from pdf", "anthropic-office-pdf"),
    ("extraire le texte du pdf", "anthropic-office-pdf"),
    ("merge pdf files", "anthropic-office-pdf"),
    ("fusionner des fichiers pdf", "anthropic-office-pdf"),
    ("fill pdf form", "anthropic-office-pdf"),
    ("remplir formulaire pdf", "anthropic-office-pdf"),
    ("split pdf document", "anthropic-office-pdf"),
    ("diviser le pdf en pages", "anthropic-office-pdf"),
    ("pdf manipulation", "anthropic-office-pdf"),
    ("convert to pdf", "anthropic-office-pdf"),

    # === EXCEL (10 phrases) ===
    ("create excel spreadsheet", "anthropic-office-xlsx"),
    ("créer un fichier excel", "anthropic-office-xlsx"),
    ("add formulas to spreadsheet", "anthropic-office-xlsx"),
    ("formules excel", "anthropic-office-xlsx"),
    ("analyze data in xlsx", "anthropic-office-xlsx"),
    ("analyser les données excel", "anthropic-office-xlsx"),
    ("pivot table creation", "anthropic-office-xlsx"),
    ("tableau croisé dynamique", "anthropic-office-xlsx"),
    ("excel chart creation", "anthropic-office-xlsx"),
    ("graphique dans excel", "anthropic-office-xlsx"),

    # === CLAUDE.md (10 phrases) ===
    ("create CLAUDE.md file", "julien-dev-tools-claude-md-documenter"),
    ("créer un CLAUDE.md", "julien-dev-tools-claude-md-documenter"),
    ("document project context", "julien-dev-tools-claude-md-documenter"),
    ("documenter le projet", "julien-dev-tools-claude-md-documenter"),
    ("project instructions file", "julien-dev-tools-claude-md-documenter"),
    ("instructions du projet", "julien-dev-tools-claude-md-documenter"),
    ("setup claude.md", "julien-dev-tools-claude-md-documenter"),
    ("fichier claude.md", "julien-dev-tools-claude-md-documenter"),
    ("project documentation", "julien-dev-tools-claude-md-documenter"),
    ("contexte projet claude", "julien-dev-tools-claude-md-documenter"),

    # === FRONTEND (10 phrases) ===
    ("create landing page", "anthropic-web-frontend-design"),
    ("créer une page d'accueil", "anthropic-web-frontend-design"),
    ("design dashboard ui", "anthropic-web-frontend-design"),
    ("interface utilisateur", "anthropic-web-frontend-design"),
    ("react component design", "anthropic-web-frontend-design"),
    ("composant react", "anthropic-web-frontend-design"),
    ("html css website", "anthropic-web-frontend-design"),
    ("design web moderne", "anthropic-web-frontend-design"),
    ("frontend interface", "anthropic-web-frontend-design"),
    ("ui design for app", "anthropic-web-frontend-design"),

    # === COMPLEX/AMBIGUOUS PHRASES (15 phrases) ===
    # Multi-step requests
    ("I need to deploy my dockerized app to the server and configure nginx as reverse proxy", "julien-infra-hostinger-deployment"),
    ("créer une skill qui génère des fichiers PDF automatiquement", "julien-dev-tools-skill-creator"),
    ("after connecting via SSH, I want to restart all docker containers", "julien-infra-hostinger-ssh"),
    ("build a react dashboard and export the data to excel", "anthropic-web-frontend-design"),
    ("je veux documenter mon projet et créer une skill pour l'automatiser", "julien-dev-tools-claude-md-documenter"),

    # Conversational/indirect requests
    ("my website is showing 502 errors and I don't know what's wrong", "julien-infra-hostinger-nginx"),
    ("le certificat SSL a expiré hier et les utilisateurs voient des warnings", "julien-infra-hostinger-nginx"),
    ("I made changes to my code and want them live on the production server", "julien-infra-hostinger-deployment"),
    ("les conteneurs ne démarrent plus depuis la mise à jour", "julien-infra-hostinger-docker"),
    ("can you help me understand how to make my skill better?", "julien-dev-tools-skill-reviewer"),

    # Mixed language
    ("setup nginx pour mon site web avec SSL certificate", "julien-infra-hostinger-nginx"),
    ("créer un excel file avec des formulas pour le budget", "anthropic-office-xlsx"),
    ("deploy mon application sur le VPS hostinger", "julien-infra-hostinger-deployment"),
    ("fill the PDF form avec les données du client", "anthropic-office-pdf"),
    ("je veux review my skill quality score", "julien-dev-tools-skill-reviewer"),

    # === NEGATIVE TEST CASES (10 phrases) - Should return None ===
    ("what's the weather like today?", None),
    ("can you tell me a joke?", None),
    ("how do I cook pasta?", None),
    ("quelle heure est-il?", None),
    ("explain quantum physics to me", None),
    ("write a poem about love", None),
    ("what's 2 + 2?", None),
    ("recommend a good movie", None),
    ("translate hello to spanish", None),
    ("who won the world cup?", None),
]

def load_triggers() -> dict:
    """Load skill triggers from JSON file."""
    # Use marketplace config file
    script_dir = Path(__file__).parent.parent
    triggers_file = script_dir / "configs" / "skill-triggers.json"
    if not triggers_file.exists():
        return {"skills": []}
    with open(triggers_file, "r", encoding="utf-8") as f:
        return json.load(f)

def build_router():
    """Build the semantic router with all skills."""
    from semantic_router import Route
    from semantic_router.encoders import HuggingFaceEncoder
    from semantic_router.routers import SemanticRouter

    print("Loading triggers...")
    triggers_data = load_triggers()
    skills = triggers_data.get("skills", [])

    print("Building routes...")
    routes = []
    for skill in skills:
        if skill.get("triggers"):
            route = Route(
                name=skill["name"],
                utterances=skill["triggers"]
            )
            routes.append(route)

    print(f"Created {len(routes)} routes")

    print("Initializing encoder (this may take a moment)...")
    encoder = HuggingFaceEncoder(
        name="sentence-transformers/all-MiniLM-L6-v2",
        device="cpu"
    )

    print("Building router...")
    router = SemanticRouter(encoder=encoder, routes=routes, auto_sync="local")

    return router, skills

def main():
    print("=" * 60)
    print("SEMANTIC SKILL ROUTER BENCHMARK")
    print("=" * 60)
    print(f"Testing {len(BENCHMARK_PHRASES)} phrases...")
    print()

    # Build router once
    router, skills = build_router()
    print()

    results = []
    correct = 0
    total_time = 0

    print("Running benchmark...")
    for i, (phrase, expected_skill) in enumerate(BENCHMARK_PHRASES, 1):
        start = time.time()
        result = router(phrase)
        elapsed = time.time() - start

        matched_skill = result.name if result and result.name else None
        is_correct = matched_skill == expected_skill
        if is_correct:
            correct += 1
        total_time += elapsed

        results.append({
            "phrase": phrase,
            "expected": expected_skill,
            "got": matched_skill,
            "correct": is_correct,
            "time_ms": elapsed * 1000
        })

        # Print progress
        if i % 20 == 0:
            print(f"Progress: {i}/{len(BENCHMARK_PHRASES)} ({correct}/{i} correct, avg {total_time/i*1000:.0f}ms)")

    print()
    print("=" * 60)
    print("RESULTS")
    print("=" * 60)
    print(f"Total phrases: {len(BENCHMARK_PHRASES)}")
    print(f"Correct: {correct}/{len(BENCHMARK_PHRASES)} ({correct/len(BENCHMARK_PHRASES)*100:.1f}%)")
    print(f"Total time: {total_time:.2f}s")
    print(f"Average time per phrase: {total_time/len(BENCHMARK_PHRASES)*1000:.0f}ms")
    print()

    # Show failures
    failures = [r for r in results if not r["correct"]]
    if failures:
        print(f"FAILURES ({len(failures)}):")
        for f in failures[:20]:  # Show max 20
            print(f"  - '{f['phrase'][:50]}'")
            print(f"    Expected: {f['expected']}")
            print(f"    Got: {f['got']}")
        print()

    # Show timing distribution
    times = [r["time_ms"] for r in results]
    print("TIMING:")
    print(f"  Min: {min(times):.0f}ms")
    print(f"  Max: {max(times):.0f}ms")
    print(f"  Avg: {sum(times)/len(times):.0f}ms")
    print(f"  P50: {sorted(times)[len(times)//2]:.0f}ms")
    print(f"  P90: {sorted(times)[int(len(times)*0.9)]:.0f}ms")

    # Save results to JSON
    output_file = Path.home() / ".claude" / "benchmark-results.json"
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump({
            "total": len(BENCHMARK_PHRASES),
            "correct": correct,
            "accuracy": correct / len(BENCHMARK_PHRASES),
            "total_time_s": total_time,
            "avg_time_ms": total_time / len(BENCHMARK_PHRASES) * 1000,
            "results": results
        }, f, indent=2, ensure_ascii=False)

    print(f"\nResults saved to: {output_file}")

if __name__ == "__main__":
    main()
