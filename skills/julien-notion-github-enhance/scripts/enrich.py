#!/usr/bin/env python3
"""
Enrich a single Github [DB] entry with GitHub API metadata
Usage: python enrich.py <page_id_or_url>
"""
import os
import sys
import re
import requests

# Configuration
NOTION_TOKEN = os.environ.get("NOTION_TOKEN", "")
if not NOTION_TOKEN:
    print("ERROR: NOTION_TOKEN environment variable not set")
    sys.exit(1)

GITHUB_TOKEN = os.environ.get("GITHUB_TOKEN", "")

NOTION_BASE_URL = "https://api.notion.com/v1"
NOTION_HEADERS = {
    "Authorization": f"Bearer {NOTION_TOKEN}",
    "Notion-Version": "2022-06-28",
    "Content-Type": "application/json"
}

GITHUB_HEADERS = {
    "Accept": "application/vnd.github.v3+json",
    "User-Agent": "Notion-Github-Enricher"
}
if GITHUB_TOKEN:
    GITHUB_HEADERS["Authorization"] = f"token {GITHUB_TOKEN}"

# Database ID
GITHUB_DB_ID = "2cacdc04-12e3-81cc-a84e-fdbba086ab29"


def notion_request(endpoint: str, method: str = "GET", data: dict = None) -> dict:
    """Make a request to Notion API"""
    url = f"{NOTION_BASE_URL}{endpoint}"
    try:
        if method == "GET":
            response = requests.get(url, headers=NOTION_HEADERS)
        elif method == "POST":
            response = requests.post(url, headers=NOTION_HEADERS, json=data)
        elif method == "PATCH":
            response = requests.patch(url, headers=NOTION_HEADERS, json=data)
        if response.status_code in [200, 201]:
            return response.json()
        else:
            return {"error": response.status_code, "message": response.text}
    except Exception as e:
        return {"error": str(e)}


def github_request(url: str) -> dict:
    """Make a request to GitHub API"""
    try:
        response = requests.get(url, headers=GITHUB_HEADERS)
        if response.status_code == 200:
            return response.json()
        elif response.status_code == 403:
            reset_time = response.headers.get("X-RateLimit-Reset", "")
            return {"error": "RATE_LIMITED", "reset": reset_time}
        elif response.status_code == 404:
            return {"error": "REPO_NOT_FOUND"}
        else:
            return {"error": f"HTTP_{response.status_code}"}
    except Exception as e:
        return {"error": str(e)}


def extract_page_id(input_str: str) -> str:
    """Extract page ID from URL or return as-is if already an ID"""
    if "notion.so" in input_str or "notion.site" in input_str:
        match = re.search(r'([a-f0-9]{32}|[a-f0-9-]{36})(?:\?|$|#)', input_str)
        if match:
            return match.group(1)
    return input_str.replace("-", "") if len(input_str.replace("-", "")) == 32 else input_str


def extract_repo_info(github_url: str) -> tuple:
    """Extract owner and repo name from GitHub URL"""
    url = github_url.strip().rstrip('/')
    if '?' in url:
        url = url.split('?')[0]
    if '#' in url:
        url = url.split('#')[0]

    # Match: https://github.com/owner/repo or https://github.com/owner/repo/...
    match = re.search(r'github\.com/([^/]+)/([^/]+)', url)
    if match:
        owner = match.group(1)
        repo = match.group(2)
        repo = re.sub(r'\.git$', '', repo)
        return owner, repo

    # Organization page: https://github.com/owner
    match = re.search(r'github\.com/([^/]+)$', url)
    if match:
        return match.group(1), None

    return None, None


def get_github_repo_data(owner: str, repo: str) -> dict:
    """Get repo data from GitHub API"""
    url = f"https://api.github.com/repos/{owner}/{repo}"
    data = github_request(url)
    if "error" in data:
        return data
    if "id" in data:
        return {
            "description": data.get("description", "") or "",
            "language": data.get("language", "") or "",
            "stars": data.get("stargazers_count", 0),
            "topics": data.get("topics", []),
        }
    return {"error": "INVALID_RESPONSE"}


def get_social_preview(owner: str, repo: str) -> str:
    """Get social preview image URL"""
    return f"https://opengraph.githubassets.com/1/{owner}/{repo}"


def enrich_entry(page_id: str):
    """Enrich a single Github [DB] entry with GitHub API data"""
    # Rate limit info
    if not GITHUB_TOKEN:
        print("INFO: No GITHUB_TOKEN set (60 requests/hour limit)")
    else:
        print("INFO: GITHUB_TOKEN found (5000 requests/hour limit)")

    # Get the page
    page = notion_request(f"/pages/{page_id}")
    if "error" in page:
        print(f"ERROR: PAGE_NOT_FOUND - {page.get('message', page.get('error'))}")
        sys.exit(1)

    props = page.get("properties", {})

    # Get title
    title_arr = props.get("Name", {}).get("title", [])
    name = title_arr[0]["plain_text"] if title_arr else "(no title)"

    # Get URL
    url = props.get("URL", {}).get("url", "")
    if not url:
        print("ERROR: NO_URL - No URL property found")
        sys.exit(1)

    if "github.com" not in url.lower():
        print(f"ERROR: NOT_GITHUB_URL - URL is not a GitHub URL: {url}")
        sys.exit(1)

    print(f"Processing: {name}")
    print(f"URL: {url}")

    # Extract owner/repo
    owner, repo = extract_repo_info(url)
    if not owner or not repo:
        print(f"ERROR: NOT_REPO_URL - Could not extract owner/repo from URL")
        sys.exit(1)

    print(f"Repo: {owner}/{repo}")

    # Get GitHub data
    github_data = get_github_repo_data(owner, repo)
    if "error" in github_data:
        error = github_data["error"]
        if error == "RATE_LIMITED":
            print(f"ERROR: RATE_LIMITED - Set GITHUB_TOKEN for higher limits")
        elif error == "REPO_NOT_FOUND":
            print(f"ERROR: REPO_NOT_FOUND - Repository may be deleted or private")
        else:
            print(f"ERROR: {error}")
        sys.exit(1)

    description = github_data.get("description", "")
    language = github_data.get("language", "")
    stars = github_data.get("stars", 0)

    print(f"Description: {description[:60]}..." if description else "Description: (none)")
    print(f"Language: {language}" if language else "Language: (none)")
    print(f"Stars: {stars}")

    # Build update properties
    update_props = {}

    if description:
        update_props["Description"] = {
            "rich_text": [{"text": {"content": description[:2000]}}]
        }

    if language:
        # Map to known languages or "Other"
        known_languages = ["Python", "JavaScript", "TypeScript", "Go", "Rust", "Java", "C++", "C", "Ruby", "PHP", "Swift", "Kotlin", "Scala", "Shell", "HTML", "CSS"]
        lang_value = language if language in known_languages else "Other"
        update_props["Language"] = {"select": {"name": lang_value}}

    if stars > 0:
        update_props["Stars"] = {"number": stars}

    # Get cover image
    cover_url = get_social_preview(owner, repo)
    print(f"Cover: {cover_url}")

    # Update the page
    data = {"properties": update_props}
    data["cover"] = {"type": "external", "external": {"url": cover_url}}

    result = notion_request(f"/pages/{page_id}", method="PATCH", data=data)

    if "error" in result:
        print(f"ERROR: UPDATE_FAILED - {result.get('message', result.get('error'))}")
        sys.exit(1)

    print("\nSUCCESS: Entry enriched!")
    print(f"Updated fields: {', '.join(update_props.keys())}")
    if cover_url:
        print("Cover image: Added")


def main():
    if len(sys.argv) < 2:
        print("Usage: python enrich.py <page_id_or_url>")
        print("Example: python enrich.py 12345678-1234-1234-1234-123456789abc")
        sys.exit(1)

    input_str = sys.argv[1]
    page_id = extract_page_id(input_str)
    enrich_entry(page_id)


if __name__ == "__main__":
    main()
