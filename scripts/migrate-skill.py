#!/usr/bin/env python3
"""
Intelligent Skill Migration: Local → Marketplace

Analyzes skill dependencies, paths, scripts, and security before migration.

Usage:
    python migrate-skill.py .claude/skills/my-skill
    python migrate-skill.py .claude/skills/my-skill --category workflow
    python migrate-skill.py .claude/skills/my-skill --analyze-only
"""

import argparse
import ast
import json
import os
import re
import shutil
import sys
from dataclasses import dataclass, field
from pathlib import Path

# Paths
HOME = Path.home()
MARKETPLACE = HOME / "OneDrive" / "Coding" / "_Projets de code" / "2025.11 Claude Code MarketPlace"
SYNC_CONFIG = MARKETPLACE / "configs" / "sync-config.json"
TRIGGERS_FILE = MARKETPLACE / "configs" / "skill-triggers.json"

# Python standard library modules (incomplete but covers most)
STDLIB_MODULES = {
    "abc", "argparse", "ast", "asyncio", "base64", "bisect", "calendar",
    "collections", "concurrent", "configparser", "contextlib", "copy",
    "csv", "dataclasses", "datetime", "decimal", "difflib", "email",
    "enum", "errno", "fcntl", "fileinput", "fnmatch", "fractions",
    "functools", "gc", "getpass", "glob", "gzip", "hashlib", "heapq",
    "html", "http", "importlib", "inspect", "io", "itertools", "json",
    "locale", "logging", "math", "mimetypes", "multiprocessing", "numbers",
    "operator", "os", "pathlib", "pickle", "platform", "pprint", "queue",
    "random", "re", "secrets", "select", "shlex", "shutil", "signal",
    "socket", "sqlite3", "ssl", "stat", "statistics", "string", "struct",
    "subprocess", "sys", "tempfile", "textwrap", "threading", "time",
    "timeit", "traceback", "types", "typing", "unicodedata", "unittest",
    "urllib", "uuid", "warnings", "weakref", "xml", "zipfile", "zlib"
}

# Common third-party packages
COMMON_PACKAGES = {
    "requests": "HTTP client",
    "httpx": "Async HTTP client",
    "aiohttp": "Async HTTP",
    "pyyaml": "YAML parsing",
    "yaml": "YAML parsing",
    "toml": "TOML parsing",
    "rich": "Terminal formatting",
    "click": "CLI framework",
    "typer": "CLI framework",
    "python-dotenv": "Environment loading",
    "dotenv": "Environment loading",
    "beautifulsoup4": "HTML parsing",
    "bs4": "HTML parsing",
    "lxml": "XML parsing",
    "pillow": "Image processing",
    "PIL": "Image processing",
    "pydantic": "Data validation",
    "attrs": "Data classes",
    "pytest": "Testing",
    "black": "Code formatting",
    "ruff": "Linting",
}

# Heavy packages that may need venv
HEAVY_PACKAGES = {
    "sklearn": ("Machine learning", "~200MB"),
    "scikit-learn": ("Machine learning", "~200MB"),
    "pandas": ("Data analysis", "~100MB"),
    "numpy": ("Numerical computing", "~50MB"),
    "scipy": ("Scientific computing", "~150MB"),
    "torch": ("Deep learning", "~2GB"),
    "tensorflow": ("Deep learning", "~1GB"),
    "transformers": ("NLP models", "~500MB"),
    "sentence-transformers": ("Sentence embeddings", "~500MB"),
    "playwright": ("Browser automation", "~200MB"),
    "selenium": ("Browser automation", "~100MB"),
    "opencv-python": ("Computer vision", "~100MB"),
    "cv2": ("Computer vision", "~100MB"),
    "spacy": ("NLP", "~200MB"),
    "nltk": ("NLP", "~50MB"),
    "matplotlib": ("Plotting", "~50MB"),
    "seaborn": ("Statistical plotting", "~30MB"),
}

# Security patterns to detect
SECURITY_PATTERNS = [
    (r'api[_-]?key\s*[=:]\s*["\'][^"\']{10,}["\']', "API key"),
    (r'password\s*[=:]\s*["\'][^"\']+["\']', "Password"),
    (r'secret\s*[=:]\s*["\'][^"\']{10,}["\']', "Secret"),
    (r'token\s*[=:]\s*["\'][^"\']{10,}["\']', "Token"),
    (r'mongodb://[^\s"\']+', "MongoDB connection string"),
    (r'postgres://[^\s"\']+', "PostgreSQL connection string"),
    (r'mysql://[^\s"\']+', "MySQL connection string"),
    (r'sk-[a-zA-Z0-9]{20,}', "OpenAI API key"),
    (r'ghp_[a-zA-Z0-9]{36}', "GitHub token"),
]

# Path patterns to detect
PATH_PATTERNS = [
    (r'C:\\Users\\[^\\]+', "Windows hardcoded path"),
    (r'/home/[^/]+/', "Linux hardcoded path"),
    (r'/Users/[^/]+/', "macOS hardcoded path"),
    (r'\\\\', "Backslash (Windows-only)"),
]


@dataclass
class AnalysisResult:
    """Result of skill analysis."""
    skill_path: Path
    skill_name: str = ""

    # Structure
    files: list[str] = field(default_factory=list)
    skill_md_lines: int = 0
    has_scripts: bool = False
    has_references: bool = False
    has_assets: bool = False

    # Frontmatter
    frontmatter_valid: bool = False
    frontmatter_name: str = ""
    frontmatter_description: str = ""
    frontmatter_triggers: list[str] = field(default_factory=list)

    # Dependencies
    stdlib_imports: set = field(default_factory=set)
    common_imports: dict = field(default_factory=dict)
    heavy_imports: dict = field(default_factory=dict)
    unknown_imports: set = field(default_factory=set)

    # Issues
    path_issues: list[tuple] = field(default_factory=list)  # (file, line, pattern, issue)
    security_issues: list[tuple] = field(default_factory=list)  # (file, line, pattern, issue)
    missing_refs: list[str] = field(default_factory=list)

    # Recommendations
    needs_venv: bool = False
    pip_requirements: list[str] = field(default_factory=list)

    # MCP Detection
    has_mcp_config: bool = False
    mcp_servers: dict = field(default_factory=dict)  # {name: config}
    mcp_env_vars: list = field(default_factory=list)  # Required env vars
    mcp_commands: set = field(default_factory=set)    # npx, uvx, node, etc.


def parse_frontmatter(content: str) -> dict | None:
    """Parse YAML frontmatter from SKILL.md."""
    match = re.match(r'^---\s*\n(.*?)\n---\s*\n', content, re.DOTALL)
    if not match:
        return None

    frontmatter = {}
    current_key = None
    current_list = []

    for line in match.group(1).split('\n'):
        line = line.rstrip()

        # List item
        if line.strip().startswith('- '):
            if current_key:
                current_list.append(line.strip()[2:].strip().strip('"\''))
            continue

        # Key-value
        if ':' in line and not line.startswith(' '):
            # Save previous list if any
            if current_key and current_list:
                frontmatter[current_key] = current_list
                current_list = []

            key, value = line.split(':', 1)
            key = key.strip()
            value = value.strip().strip('"\'')

            if value:
                frontmatter[key] = value
                current_key = None
            else:
                current_key = key

    # Save last list
    if current_key and current_list:
        frontmatter[current_key] = current_list

    return frontmatter


def extract_imports(content: str) -> set[str]:
    """Extract import names from Python code."""
    imports = set()

    try:
        tree = ast.parse(content)
        for node in ast.walk(tree):
            if isinstance(node, ast.Import):
                for alias in node.names:
                    imports.add(alias.name.split('.')[0])
            elif isinstance(node, ast.ImportFrom):
                if node.module:
                    imports.add(node.module.split('.')[0])
    except SyntaxError:
        # Fallback to regex
        for match in re.finditer(r'^(?:from|import)\s+([\w.]+)', content, re.MULTILINE):
            imports.add(match.group(1).split('.')[0])

    return imports


def analyze_skill(skill_path: Path) -> AnalysisResult:
    """Perform deep analysis of a skill."""
    result = AnalysisResult(skill_path=skill_path)
    result.skill_name = skill_path.name

    # List all files
    for root, dirs, files in os.walk(skill_path):
        for f in files:
            rel_path = Path(root).relative_to(skill_path) / f
            result.files.append(str(rel_path))

            if 'scripts' in str(rel_path):
                result.has_scripts = True
            if 'references' in str(rel_path):
                result.has_references = True
            if 'assets' in str(rel_path):
                result.has_assets = True

    # Analyze SKILL.md
    skill_md = skill_path / "SKILL.md"
    if not skill_md.exists():
        return result

    content = skill_md.read_text(encoding="utf-8")
    result.skill_md_lines = len(content.split('\n'))

    # Parse frontmatter
    frontmatter = parse_frontmatter(content)
    if frontmatter:
        result.frontmatter_valid = True
        result.frontmatter_name = frontmatter.get("name", "")
        result.frontmatter_description = frontmatter.get("description", "")
        result.frontmatter_triggers = frontmatter.get("triggers", [])

    # Check referenced files exist
    for match in re.finditer(r'\[([^\]]+)\]\(([^)]+)\)', content):
        ref_path = match.group(2)
        if ref_path.startswith('http'):
            continue
        full_path = skill_path / ref_path
        if not full_path.exists():
            result.missing_refs.append(ref_path)

    # Analyze all files
    all_imports = set()

    for file_rel in result.files:
        file_path = skill_path / file_rel

        try:
            file_content = file_path.read_text(encoding="utf-8")
        except (UnicodeDecodeError, IOError):
            continue

        # Python imports
        if file_rel.endswith('.py'):
            all_imports.update(extract_imports(file_content))

        # Path issues
        for line_num, line in enumerate(file_content.split('\n'), 1):
            for pattern, issue in PATH_PATTERNS:
                if re.search(pattern, line):
                    result.path_issues.append((file_rel, line_num, line.strip()[:80], issue))

        # Security issues
        for line_num, line in enumerate(file_content.split('\n'), 1):
            for pattern, issue in SECURITY_PATTERNS:
                if re.search(pattern, line, re.IGNORECASE):
                    result.security_issues.append((file_rel, line_num, line.strip()[:60], issue))

    # Categorize imports
    for imp in all_imports:
        if imp in STDLIB_MODULES:
            result.stdlib_imports.add(imp)
        elif imp in HEAVY_PACKAGES:
            desc, size = HEAVY_PACKAGES[imp]
            result.heavy_imports[imp] = f"{desc} ({size})"
        elif imp in COMMON_PACKAGES:
            result.common_imports[imp] = COMMON_PACKAGES[imp]
        else:
            # Check if it might be a common package variant
            found = False
            for pkg, desc in COMMON_PACKAGES.items():
                if imp.lower() == pkg.lower().replace('-', '_'):
                    result.common_imports[imp] = desc
                    found = True
                    break
            if not found:
                result.unknown_imports.add(imp)

    # Determine if venv needed
    result.needs_venv = len(result.heavy_imports) > 0

    # Build pip requirements
    for pkg in result.common_imports:
        result.pip_requirements.append(pkg)
    for pkg in result.heavy_imports:
        result.pip_requirements.append(pkg)

    # Check for .mcp.json
    mcp_file = skill_path / ".mcp.json"
    if mcp_file.exists():
        result.has_mcp_config = True
        try:
            mcp_data = json.loads(mcp_file.read_text(encoding="utf-8"))
            for server_name, config in mcp_data.get("mcpServers", {}).items():
                result.mcp_servers[server_name] = config

                # Extract command type
                cmd = config.get("command", "")
                args = config.get("args", [])
                args_str = " ".join(str(a) for a in args) if isinstance(args, list) else str(args)

                if cmd == "npx" or "npx" in args_str:
                    result.mcp_commands.add("npx")
                if cmd == "uvx" or "uvx" in args_str:
                    result.mcp_commands.add("uvx")
                if cmd == "node" or cmd.endswith("node.exe"):
                    result.mcp_commands.add("node")
                if cmd == "python" or cmd.endswith("python.exe"):
                    result.mcp_commands.add("python")

                # Extract env vars
                for var in config.get("env", {}).keys():
                    if var not in result.mcp_env_vars:
                        result.mcp_env_vars.append(var)
        except (json.JSONDecodeError, IOError) as e:
            print(f"  ⚠️ Could not parse .mcp.json: {e}")

    return result


def print_analysis_report(result: AnalysisResult):
    """Print formatted analysis report."""
    print(f"\n{'='*60}")
    print(f"MIGRATION ANALYSIS: {result.skill_name}")
    print(f"{'='*60}\n")

    # Structure
    print("## Structure")
    print(f"- SKILL.md: {'✅ Valid' if result.frontmatter_valid else '❌ Invalid'} ({result.skill_md_lines} lines)")
    print(f"- Files: {len(result.files)}")
    print(f"- Scripts: {'Yes' if result.has_scripts else 'No'}")
    print(f"- References: {'Yes' if result.has_references else 'No'}")
    print(f"- Assets: {'Yes' if result.has_assets else 'No'}")
    print()

    # Dependencies
    print("## Dependencies Detected")

    if result.stdlib_imports:
        print(f"\n**Standard library** ({len(result.stdlib_imports)} modules, no install):")
        print(f"  {', '.join(sorted(result.stdlib_imports)[:10])}")
        if len(result.stdlib_imports) > 10:
            print(f"  ... and {len(result.stdlib_imports) - 10} more")

    if result.common_imports:
        print(f"\n**Requires pip install** ({len(result.common_imports)}):")
        for pkg, desc in result.common_imports.items():
            print(f"  - {pkg}: {desc}")

    if result.heavy_imports:
        print(f"\n**Heavy packages** (consider venv):")
        for pkg, info in result.heavy_imports.items():
            print(f"  - {pkg}: {info}")

    if result.unknown_imports:
        print(f"\n**Unknown imports** (verify manually):")
        print(f"  {', '.join(sorted(result.unknown_imports))}")

    print()

    # Path issues
    if result.path_issues:
        print(f"## Path Issues ({len(result.path_issues)})")
        for file, line, content, issue in result.path_issues[:5]:
            print(f"  ⚠️  {file}:{line} - {issue}")
            print(f"      `{content}`")
        if len(result.path_issues) > 5:
            print(f"  ... and {len(result.path_issues) - 5} more")
        print()

    # Security issues
    if result.security_issues:
        print(f"## Security Issues ({len(result.security_issues)})")
        for file, line, content, issue in result.security_issues[:5]:
            print(f"  ❌ {file}:{line} - {issue}")
            print(f"      `{content}...`")
        if len(result.security_issues) > 5:
            print(f"  ... and {len(result.security_issues) - 5} more")
        print()

    # Missing references
    if result.missing_refs:
        print(f"## Missing References ({len(result.missing_refs)})")
        for ref in result.missing_refs:
            print(f"  ❌ {ref}")
        print()

    # MCP Configuration
    if result.has_mcp_config:
        print(f"## MCP Configuration")
        print(f"Servers: {len(result.mcp_servers)}")
        for name, config in result.mcp_servers.items():
            cmd = config.get("command", "?")
            args = config.get("args", [])
            # Extract package name from args
            pkg_name = ""
            for arg in args:
                if isinstance(arg, str) and ("@" in arg or "/" in arg):
                    pkg_name = arg
                    break
            print(f"  - {name}: {pkg_name or cmd}")

        if result.mcp_env_vars:
            print(f"\n⚠️ Required environment variables:")
            for var in result.mcp_env_vars:
                print(f"  - {var}")

        if result.mcp_commands:
            print(f"\nCommands needed: {', '.join(sorted(result.mcp_commands))}")
        print()

    # Recommendations
    print("## Recommendations")

    if result.path_issues:
        print(f"1. Fix {len(result.path_issues)} path issues before migration")

    if result.security_issues:
        print(f"2. Remove {len(result.security_issues)} potential secrets (use .env)")

    if result.pip_requirements:
        print(f"3. Document dependencies: pip install {' '.join(result.pip_requirements[:5])}")

    if result.needs_venv:
        print("4. Consider dedicated venv (heavy packages detected)")

    if not result.frontmatter_triggers:
        print("5. Add triggers to frontmatter for semantic routing")

    if result.has_mcp_config:
        print("6. MCP-REQUIREMENTS.md will be generated for MCP dependencies")

    print()

    # Summary
    issues_count = len(result.path_issues) + len(result.security_issues) + len(result.missing_refs)
    if issues_count == 0:
        print("✅ Ready for migration!")
    else:
        print(f"⚠️  {issues_count} issue(s) to address before migration")


def generate_mcp_requirements(skill_name: str, result: AnalysisResult) -> str:
    """Generate MCP-REQUIREMENTS.md content."""
    lines = [
        f"# MCP Requirements for {skill_name}",
        "",
        "This skill requires MCP (Model Context Protocol) servers to function.",
        "",
        "## Servers Required",
        "",
    ]

    for name, config in result.mcp_servers.items():
        cmd = config.get("command", "?")
        args = config.get("args", [])

        # Extract package name
        pkg_name = ""
        for arg in args:
            if isinstance(arg, str) and ("@" in arg or "/" in arg):
                pkg_name = arg
                break

        lines.append(f"### {name}")
        lines.append(f"- **Package**: `{pkg_name or 'custom'}`")
        lines.append(f"- **Command**: `{cmd}`")

        # Check for env vars in this server
        server_env = config.get("env", {})
        if server_env:
            lines.append(f"- **Environment**: {', '.join(server_env.keys())}")
        lines.append("")

    # Environment variables section
    if result.mcp_env_vars:
        lines.extend([
            "## Environment Variables",
            "",
            "| Variable | Description | Required |",
            "|----------|-------------|----------|",
        ])
        for var in result.mcp_env_vars:
            lines.append(f"| `{var}` | *Set before use* | Yes |")
        lines.append("")

    # Installation section
    lines.extend([
        "## Installation",
        "",
        "Add to your project's `.mcp.json` or copy the existing `.mcp.json` from this skill:",
        "",
        "```json",
        json.dumps({"mcpServers": result.mcp_servers}, indent=2),
        "```",
        "",
        "## Commands Needed",
        "",
    ])

    if result.mcp_commands:
        for cmd in sorted(result.mcp_commands):
            if cmd == "npx":
                lines.append(f"- `npx`: Requires Node.js (npm install -g npx)")
            elif cmd == "uvx":
                lines.append(f"- `uvx`: Requires uv (pip install uv)")
            elif cmd == "node":
                lines.append(f"- `node`: Requires Node.js")
            elif cmd == "python":
                lines.append(f"- `python`: Requires Python 3.10+")
            else:
                lines.append(f"- `{cmd}`")
    else:
        lines.append("No special commands required.")

    lines.append("")

    return "\n".join(lines)


def migrate_skill(
    result: AnalysisResult,
    category: str,
    custom_name: str | None = None,
    auto_fix: bool = False,
    remove_local: bool = False
) -> bool:
    """Execute migration after analysis."""

    # Generate marketplace name
    base_name = custom_name or result.skill_name
    base_name = re.sub(r'^julien-\w+-', '', base_name)
    base_name = re.sub(r'^(my-|local-)', '', base_name)
    marketplace_name = f"julien-{category}-{base_name}"

    target_path = MARKETPLACE / "skills" / marketplace_name

    print(f"\n{'='*60}")
    print("EXECUTING MIGRATION")
    print(f"{'='*60}\n")

    print(f"Source: {result.skill_path}")
    print(f"Target: {target_path}")
    print(f"Name: {marketplace_name}")
    print()

    # Check target doesn't exist
    if target_path.exists():
        print(f"❌ Target already exists: {target_path}")
        return False

    # Copy files
    print("Copying files...")
    shutil.copytree(result.skill_path, target_path)
    print("  ✅ Files copied")

    # Update frontmatter
    print("Updating frontmatter...")
    skill_md = target_path / "SKILL.md"
    content = skill_md.read_text(encoding="utf-8")

    content = re.sub(
        r'^(name:\s*)["\']?[\w-]+["\']?',
        f'name: {marketplace_name}',
        content,
        flags=re.MULTILINE
    )

    skill_md.write_text(content, encoding="utf-8")
    print("  ✅ Name updated")

    # Auto-fix path issues if requested
    if auto_fix and result.path_issues:
        print("Fixing path issues...")
        for file_rel, _, _, _ in result.path_issues:
            file_path = target_path / file_rel
            if file_path.exists():
                content = file_path.read_text(encoding="utf-8")
                # Replace Windows paths with ~/
                content = re.sub(r'C:\\Users\\[^\\]+', '~', content)
                content = re.sub(r'/home/[^/]+', '~', content)
                content = re.sub(r'/Users/[^/]+', '~', content)
                # Replace backslashes
                content = content.replace('\\\\', '/')
                file_path.write_text(content, encoding="utf-8")
        print(f"  ✅ Fixed {len(result.path_issues)} path issues")

    # Generate MCP-REQUIREMENTS.md if MCP config exists
    if result.has_mcp_config:
        print("Generating MCP-REQUIREMENTS.md...")
        mcp_req_path = target_path / "MCP-REQUIREMENTS.md"
        mcp_content = generate_mcp_requirements(marketplace_name, result)
        mcp_req_path.write_text(mcp_content, encoding="utf-8")
        print("  ✅ MCP-REQUIREMENTS.md generated")

    # Update sync config
    print("Updating sync-config.json...")
    if SYNC_CONFIG.exists():
        config = json.loads(SYNC_CONFIG.read_text(encoding="utf-8"))
        skills = config.get("skills_to_sync", [])
        if marketplace_name not in skills:
            skills.append(marketplace_name)
            skills.sort()
            config["skills_to_sync"] = skills
            SYNC_CONFIG.write_text(json.dumps(config, indent=2, ensure_ascii=False), encoding="utf-8")
            print("  ✅ Added to skills_to_sync")
        else:
            print("  ℹ️  Already in skills_to_sync")

    # Remove local if requested
    if remove_local:
        print("Removing local version...")
        shutil.rmtree(result.skill_path)
        print(f"  ✅ Removed: {result.skill_path}")

    print()
    print(f"✅ Migration complete!")
    print(f"   Next: Run 'python scripts/generate-triggers.py' then '/sync'")

    return True


def main():
    parser = argparse.ArgumentParser(
        description="Intelligent skill migration with dependency analysis"
    )
    parser.add_argument("source", help="Path to local skill directory")
    parser.add_argument("--category", "-c", help="Skill category (dev-tools, workflow, mcp, etc.)")
    parser.add_argument("--name", "-n", help="Custom name (without julien- prefix)")
    parser.add_argument("--analyze-only", "-a", action="store_true", help="Only analyze, don't migrate")
    parser.add_argument("--auto-fix", "-f", action="store_true", help="Auto-fix path issues")
    parser.add_argument("--remove-local", "-r", action="store_true", help="Remove local after migration")
    parser.add_argument("--json", "-j", action="store_true", help="Output analysis as JSON")

    args = parser.parse_args()

    source_path = Path(args.source).resolve()

    if not source_path.exists():
        print(f"Error: Source not found: {source_path}")
        sys.exit(1)

    # Analyze
    result = analyze_skill(source_path)

    if args.json:
        # JSON output for programmatic use
        output = {
            "skill_name": result.skill_name,
            "files": result.files,
            "frontmatter_valid": result.frontmatter_valid,
            "stdlib_imports": list(result.stdlib_imports),
            "common_imports": result.common_imports,
            "heavy_imports": result.heavy_imports,
            "unknown_imports": list(result.unknown_imports),
            "path_issues": len(result.path_issues),
            "security_issues": len(result.security_issues),
            "needs_venv": result.needs_venv,
            "pip_requirements": result.pip_requirements,
            # MCP
            "has_mcp_config": result.has_mcp_config,
            "mcp_servers": result.mcp_servers,
            "mcp_env_vars": result.mcp_env_vars,
            "mcp_commands": list(result.mcp_commands),
        }
        print(json.dumps(output, indent=2))
        sys.exit(0)

    # Print report
    print_analysis_report(result)

    if args.analyze_only:
        sys.exit(0)

    # Check if ready
    if result.security_issues and not args.auto_fix:
        print("⚠️  Security issues found. Fix them or use --auto-fix")
        print("   Migration aborted for safety.")
        sys.exit(1)

    # Get category if not provided
    category = args.category
    if not category:
        print("\nAvailable categories: dev-tools, workflow, mcp, notion, media, infra, ref")
        category = input("Category: ").strip()
        if not category:
            print("Category required.")
            sys.exit(1)

    # Migrate
    success = migrate_skill(
        result=result,
        category=category,
        custom_name=args.name,
        auto_fix=args.auto_fix,
        remove_local=args.remove_local
    )

    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
