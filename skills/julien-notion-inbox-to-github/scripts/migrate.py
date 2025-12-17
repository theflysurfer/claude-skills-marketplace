#!/usr/bin/env python3
"""
Migrate a single GitHub entry from Inbox [DB] to Github [DB]
Usage: python migrate.py <page_id_or_url>
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

NOTION_BASE_URL = "https://api.notion.com/v1"
NOTION_HEADERS = {
    "Authorization": f"Bearer {NOTION_TOKEN}",
    "Notion-Version": "2022-06-28",
    "Content-Type": "application/json"
}

# Database IDs
INBOX_DB_ID = "e50fb9d3-5d64-4601-a2f2-c0ac80d84d86"
GITHUB_DB_ID = "2cacdc04-12e3-81cc-a84e-fdbba086ab29"


def notion_request(endpoint: str, method: str = "GET", data: dict = None) -> dict:
    """Make a request to Notion API"""
    url = f"{NOTION_BASE_URL}{endpoint}"
    try:
        if method == "GET":
            response = requests.get(url, headers=NOTION_HEADERS)
        elif method == "POST":
            response = requests.post(url, headers=NOTION_HEADERS, json=data)
        if response.status_code in [200, 201]:
            return response.json()
        else:
            return {"error": response.status_code, "message": response.text}
    except Exception as e:
        return {"error": str(e)}


def extract_page_id(input_str: str) -> str:
    """Extract page ID from URL or return as-is if already an ID"""
    # If it's a URL, extract the ID
    if "notion.so" in input_str or "notion.site" in input_str:
        # Match patterns like: xxx-32charID or just 32charID
        match = re.search(r'([a-f0-9]{32}|[a-f0-9-]{36})(?:\?|$|#)', input_str)
        if match:
            return match.group(1)
    # Remove dashes if it's a UUID format without them
    return input_str.replace("-", "") if len(input_str.replace("-", "")) == 32 else input_str


def normalize_github_url(url: str) -> str:
    """Normalize GitHub URL for comparison"""
    url = url.lower().strip().rstrip('/')
    if '?' in url:
        url = url.split('?')[0]
    if '#' in url:
        url = url.split('#')[0]
    return url


def extract_repo_name(url: str) -> str:
    """Extract repo name from GitHub URL"""
    url = url.replace("https://", "").replace("http://", "")
    url = url.replace("github.com/", "")
    parts = url.split("/")
    if len(parts) >= 2:
        return f"{parts[0]}/{parts[1]}"
    elif len(parts) >= 1:
        return parts[0]
    return url


def get_existing_urls() -> set:
    """Get all existing URLs in Github [DB]"""
    urls = set()
    has_more = True
    start_cursor = None

    while has_more:
        data = {"page_size": 100}
        if start_cursor:
            data["start_cursor"] = start_cursor
        result = notion_request(f"/databases/{GITHUB_DB_ID}/query", method="POST", data=data)
        if "results" in result:
            for entry in result["results"]:
                url = entry.get("properties", {}).get("URL", {}).get("url", "")
                if url:
                    urls.add(normalize_github_url(url))
        has_more = result.get("has_more", False)
        start_cursor = result.get("next_cursor", None)

    return urls


def migrate_entry(page_id: str):
    """Migrate a single entry from Inbox to Github [DB]"""
    # Get the page
    page = notion_request(f"/pages/{page_id}")
    if "error" in page:
        print(f"ERROR: PAGE_NOT_FOUND - {page.get('message', page.get('error'))}")
        sys.exit(1)

    props = page.get("properties", {})

    # Get title
    title_arr = props.get("Name", {}).get("title", [])
    if not title_arr:
        title_arr = props.get("Title", {}).get("title", [])
    name = title_arr[0]["plain_text"] if title_arr else "(no title)"

    # Get URL - try multiple property names
    url = None
    for prop_name in ["URL", "Link", "Lien", "url", "link"]:
        if prop_name in props:
            url = props[prop_name].get("url")
            if url:
                break

    if not url:
        print("ERROR: NO_GITHUB_URL - No URL property found in this page")
        sys.exit(1)

    # Check if it's a GitHub URL
    if "github.com" not in url.lower():
        print(f"ERROR: NO_GITHUB_URL - URL is not a GitHub URL: {url}")
        sys.exit(1)

    # Check for duplicates
    existing_urls = get_existing_urls()
    normalized = normalize_github_url(url)
    if normalized in existing_urls:
        print(f"ERROR: DUPLICATE - Entry already exists in Github [DB]: {url}")
        sys.exit(1)

    # If no title, extract from URL
    if name == "(no title)" or not name.strip():
        name = extract_repo_name(url)

    # Create new entry in Github [DB]
    data = {
        "parent": {"database_id": GITHUB_DB_ID},
        "properties": {
            "Name": {"title": [{"text": {"content": name[:2000]}}]},
            "URL": {"url": url},
            "Source DB": {"select": {"name": "Inbox"}},
            "Status": {"select": {"name": "To Review"}}
        }
    }

    result = notion_request("/pages", method="POST", data=data)

    if "error" in result:
        print(f"ERROR: CREATE_FAILED - {result.get('message', result.get('error'))}")
        sys.exit(1)

    new_url = result.get("url", "")
    new_id = result.get("id", "")
    print(f"SUCCESS: Created entry in Github [DB]")
    print(f"Name: {name}")
    print(f"URL: {new_url}")
    print(f"ID: {new_id}")


def main():
    if len(sys.argv) < 2:
        print("Usage: python migrate.py <page_id_or_url>")
        print("Example: python migrate.py 12345678-1234-1234-1234-123456789abc")
        sys.exit(1)

    input_str = sys.argv[1]
    page_id = extract_page_id(input_str)
    migrate_entry(page_id)


if __name__ == "__main__":
    main()
