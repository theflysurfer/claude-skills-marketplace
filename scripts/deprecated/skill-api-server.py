"""
Local API server to trigger Claude Code skills from MkDocs interface.
Listens on localhost:8888 and executes skills via `claude -p` command.

Usage:
    python scripts/skill-api-server.py

Endpoints:
    GET  /health              - Health check
    POST /api/skill/{name}    - Execute a skill
    POST /api/command         - Execute any claude command
    GET  /api/skills          - List available skills
"""

import subprocess
import json
import sys
from pathlib import Path
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import threading

PORT = 8888
ALLOWED_SKILLS = [
    "sync",
    "check-loaded-skills",
    "project-list",
    "project-info",
    "list-resources",
]

# Skills that can be triggered via the API
SKILL_COMMANDS = {
    "sync": 'Skill("sync")',
    "check-loaded-skills": 'Skill("check-loaded-skills")',
    "project-list": 'Skill("project-list")',
    "project-info": 'Skill("project-info")',
    "list-resources": 'Skill("list-resources")',
}


class SkillAPIHandler(BaseHTTPRequestHandler):
    """Handle API requests to trigger Claude Code skills."""

    def _send_json(self, data: dict, status: int = 200):
        """Send JSON response with CORS headers."""
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "http://127.0.0.1:8000")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())

    def do_OPTIONS(self):
        """Handle CORS preflight."""
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "http://127.0.0.1:8000")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_GET(self):
        """Handle GET requests."""
        parsed = urlparse(self.path)
        path = parsed.path

        if path == "/health":
            self._send_json({"status": "ok", "port": PORT})
        elif path == "/api/skills":
            self._send_json({
                "skills": list(SKILL_COMMANDS.keys()),
                "count": len(SKILL_COMMANDS)
            })
        else:
            self._send_json({"error": "Not found"}, 404)

    def do_POST(self):
        """Handle POST requests to trigger skills."""
        parsed = urlparse(self.path)
        path = parsed.path

        # /api/skill/{skill_name}
        if path.startswith("/api/skill/"):
            skill_name = path.replace("/api/skill/", "")
            self._execute_skill(skill_name)

        # /api/command (body: {"command": "..."})
        elif path == "/api/command":
            content_length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(content_length).decode()
            try:
                data = json.loads(body)
                command = data.get("command", "")
                self._execute_command(command)
            except json.JSONDecodeError:
                self._send_json({"error": "Invalid JSON"}, 400)
        else:
            self._send_json({"error": "Not found"}, 404)

    def _execute_skill(self, skill_name: str):
        """Execute a skill by name."""
        if skill_name not in SKILL_COMMANDS:
            self._send_json({
                "error": f"Skill '{skill_name}' not allowed",
                "allowed": list(SKILL_COMMANDS.keys())
            }, 400)
            return

        command = SKILL_COMMANDS[skill_name]
        self._execute_command(command)

    def _execute_command(self, command: str):
        """Execute a claude command."""
        if not command:
            self._send_json({"error": "Empty command"}, 400)
            return

        # Security: only allow Skill() commands
        if not command.startswith("Skill("):
            self._send_json({"error": "Only Skill() commands allowed"}, 403)
            return

        try:
            # Run claude in print mode
            result = subprocess.run(
                ["claude", "-p", command],
                capture_output=True,
                text=True,
                timeout=60,
                cwd=str(Path.home())
            )

            self._send_json({
                "success": result.returncode == 0,
                "command": command,
                "stdout": result.stdout[:2000] if result.stdout else "",
                "stderr": result.stderr[:500] if result.stderr else "",
                "returncode": result.returncode
            })

        except subprocess.TimeoutExpired:
            self._send_json({"error": "Command timed out"}, 504)
        except FileNotFoundError:
            self._send_json({"error": "claude CLI not found"}, 500)
        except Exception as e:
            self._send_json({"error": str(e)}, 500)

    def log_message(self, format, *args):
        """Custom log format."""
        print(f"[SkillAPI] {args[0]}")


def run_server():
    """Start the API server."""
    server = HTTPServer(("127.0.0.1", PORT), SkillAPIHandler)
    print(f"[SkillAPI] Server running on http://127.0.0.1:{PORT}")
    print(f"[SkillAPI] Available skills: {', '.join(SKILL_COMMANDS.keys())}")
    print(f"[SkillAPI] Press Ctrl+C to stop")

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n[SkillAPI] Shutting down...")
        server.shutdown()


if __name__ == "__main__":
    run_server()
