#!/usr/bin/env python3
"""
Route a single Inbox entry to the appropriate PKM database.
Usage: python route.py <page_id_or_url> [--destination DB_NAME]
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
DATABASE_IDS = {
    "Github [DB]": "2cacdc04-12e3-81cc-a84e-fdbba086ab29",
    "Todos [DB]": "9c9b8dcd-e01b-488f-aa87-eaaed7be9a52",
    "Inbox [DB]": "e50fb9d3-5d64-4601-a2f2-c0ac80d84d86",
    "Videos [DB]": "2cacdc04-12e3-812d-959b-ce49a1ad0b3c",
    "Articles [DB]": "2cacdc04-12e3-8199-8ac1-e9c3007843a6",
    "Podcasts [DB]": "2cacdc04-12e3-81a1-bf23-c9b9f82208f2",
    "Formations [DB]": "2cacdc04-12e3-8168-b239-ff7e17742881",
    "Lieux [DB]": "2cacdc04-12e3-81ad-a743-cf2d2a241a0d",
    "Code [DB]": "2cacdc04-12e3-81db-aa22-dbac1beefcb1",
}

# URL-based routing rules
URL_ROUTING_RULES = {
    "github.com": "Github [DB]",
    "gitlab.com": "Github [DB]",
    "youtube.com": "Videos [DB]",
    "youtu.be": "Videos [DB]",
    "vimeo.com": "Videos [DB]",
    "twitch.tv": "Videos [DB]",
    "snipd.com": "Podcasts [DB]",
    "overcast.fm": "Podcasts [DB]",
    "podcasts.apple.com": "Podcasts [DB]",
    "open.spotify.com/episode": "Podcasts [DB]",
    "open.spotify.com/show": "Podcasts [DB]",
    "udemy.com": "Formations [DB]",
    "coursera.org": "Formations [DB]",
    "skillshare.com": "Formations [DB]",
    "egghead.io": "Formations [DB]",
    "google.com/maps": "Lieux [DB]",
    "komoot.com": "Lieux [DB]",
    "alltrails.com": "Lieux [DB]",
    "airbnb.com": "Lieux [DB]",
    "gist.github.com": "Code [DB]",
    "codepen.io": "Code [DB]",
    "codesandbox.io": "Code [DB]",
    "medium.com": "Articles [DB]",
    "dev.to": "Articles [DB]",
    "substack.com": "Articles [DB]",
}

KEYWORD_RULES = {
    "podcast": "Podcasts [DB]",
    "episode": "Podcasts [DB]",
    "cours": "Formations [DB]",
    "formation": "Formations [DB]",
    "tutorial": "Formations [DB]",
    "video": "Videos [DB]",
    "rando": "Lieux [DB]",
}


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
    """Extract page ID from URL or return as-is"""
    if "notion.so" in input_str or "notion.site" in input_str:
        match = re.search(r'([a-f0-9]{32}|[a-f0-9-]{36})(?:\?|$|#)', input_str)
        if match:
            return match.group(1)
    return input_str.replace("-", "") if len(input_str.replace("-", "")) == 32 else input_str


def determine_destination(title: str, url: str) -> tuple:
    """Determine destination based on URL and keywords"""
    url_lower = url.lower() if url else ""
    title_lower = title.lower() if title else ""

    # Check URL patterns (more specific first)
    sorted_patterns = sorted(URL_ROUTING_RULES.keys(), key=len, reverse=True)
    for pattern in sorted_patterns:
        if pattern in url_lower:
            return (URL_ROUTING_RULES[pattern], f"URL pattern: {pattern}")

    # Check keywords
    for keyword, destination in KEYWORD_RULES.items():
        if keyword in title_lower:
            return (destination, f"Keyword: {keyword}")

    # Fallbacks
    if url and url.startswith("http"):
        return ("Articles [DB]", "Unknown URL -> Articles")
    if not url:
        return ("Todos [DB]", "No URL -> Task")

    return ("Inbox [DB]", "No match")


def route_entry(page_id: str, force_destination: str = None):
    """Route a single entry to appropriate database"""
    # Get the page
    page = notion_request(f"/pages/{page_id}")
    if "error" in page:
        print(f"ERROR: PAGE_NOT_FOUND - {page.get('message', page.get('error'))}")
        sys.exit(1)

    props = page.get("properties", {})

    # Get title
    title_arr = props.get("Nom", {}).get("title", [])
    if not title_arr:
        title_arr = props.get("Name", {}).get("title", [])
    title = title_arr[0]["plain_text"] if title_arr else "(no title)"

    # Get URL
    url = props.get("URL", {}).get("url", "") or ""
    if not url and title.startswith("http"):
        url = title

    print(f"Entry: {title[:60]}")
    print(f"URL: {url[:60] if url else '(none)'}")

    # Determine destination
    if force_destination:
        destination = force_destination
        reason = "Manual override"
    else:
        destination, reason = determine_destination(title, url)

    print(f"\nSuggested: {destination}")
    print(f"Reason: {reason}")

    db_id = DATABASE_IDS.get(destination)
    if not db_id:
        print(f"ERROR: Unknown destination: {destination}")
        sys.exit(1)

    # Create in destination
    data = {
        "parent": {"database_id": db_id},
        "properties": {
            "Name": {"title": [{"text": {"content": title[:2000]}}]},
            "Status": {"select": {"name": "To Review"}},
            "Source DB": {"select": {"name": "Inbox"}},
        }
    }
    if url:
        data["properties"]["URL"] = {"url": url}

    result = notion_request("/pages", method="POST", data=data)

    if "error" in result:
        print(f"\nERROR: {result.get('message', result.get('error'))[:100]}")
        sys.exit(1)

    new_url = result.get("url", "")
    print(f"\nSUCCESS: Routed to {destination}")
    print(f"New entry: {new_url}")


def main():
    if len(sys.argv) < 2:
        print("Usage: python route.py <page_id_or_url> [--destination DB_NAME]")
        print("\nAvailable destinations:")
        for name in DATABASE_IDS.keys():
            print(f"  - {name}")
        sys.exit(1)

    input_str = sys.argv[1]
    page_id = extract_page_id(input_str)

    # Check for --destination flag
    force_destination = None
    if "--destination" in sys.argv:
        idx = sys.argv.index("--destination")
        if idx + 1 < len(sys.argv):
            force_destination = sys.argv[idx + 1]

    route_entry(page_id, force_destination)


if __name__ == "__main__":
    main()
