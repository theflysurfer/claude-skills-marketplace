# {{ categories_info["office"].name }}

{{ categories_info["office"].description }}

**{{ categories_info["office"].count }} skills disponibles**

## Skills

{{ skills_table("office") }}

## Utilisation

Ces skills permettent de manipuler les fichiers Office directement depuis Claude Code :

```bash
# Créer un fichier Excel
Skill("anthropic-office-xlsx")

# Générer un document Word
Skill("anthropic-office-docx")

# Créer une présentation PowerPoint
Skill("anthropic-office-pptx")

# Extraire du texte d'un PDF
Skill("anthropic-office-pdf")
```

## Prérequis

Aucun prérequis particulier. Ces skills sont fournies par Anthropic et fonctionnent out-of-the-box.
