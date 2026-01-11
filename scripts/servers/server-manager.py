#!/usr/bin/env python3
"""
Server Manager - Start/stop/status for Windows startup servers.

Usage:
    python server-manager.py list              List all servers with status
    python server-manager.py status            Show running servers
    python server-manager.py start <name>      Start a server
    python server-manager.py stop <name>       Stop a server
    python server-manager.py startup <name>    Toggle startup (enable/disable)
"""
import json
import os
import subprocess
import sys
import socket
from pathlib import Path
from typing import Optional

# Paths
SCRIPT_DIR = Path(__file__).parent
MARKETPLACE_ROOT = SCRIPT_DIR.parent
REGISTRY_FILE = MARKETPLACE_ROOT / "configs" / "servers-registry.json"
STARTUP_FOLDER = Path(os.environ.get("APPDATA", "")) / "Microsoft" / "Windows" / "Start Menu" / "Programs" / "Startup"


def load_registry() -> dict:
    """Load servers registry."""
    if REGISTRY_FILE.exists():
        with open(REGISTRY_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return {"servers": {}, "utilities": {}}


def check_port(port: int) -> bool:
    """Check if a port is in use (server running)."""
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.settimeout(1)
            result = s.connect_ex(("localhost", port))
            return result == 0
    except Exception:
        return False


def check_startup_file(filename: str) -> bool:
    """Check if startup file exists."""
    return (STARTUP_FOLDER / filename).exists()


def get_server_status(server: dict) -> str:
    """Get server status."""
    port = server.get("port")
    if port and check_port(port):
        return "🟢 Running"

    startup_file = server.get("startup_file")
    if startup_file and check_startup_file(startup_file):
        return "🟡 Startup enabled"

    return "🔴 Stopped"


def list_servers():
    """List all servers with their status."""
    registry = load_registry()

    print("\n📦 SERVEURS")
    print("=" * 70)
    print(f"{'Name':<20} {'Port':<8} {'Status':<18} {'Category':<12}")
    print("-" * 70)

    for server_id, server in registry.get("servers", {}).items():
        name = server.get("name", server_id)[:19]
        port = server.get("port", "-")
        status = get_server_status(server)
        category = server.get("category", "other")
        print(f"{name:<20} {str(port):<8} {status:<18} {category:<12}")

    print("\n🔧 UTILITAIRES")
    print("-" * 70)
    for util_id, util in registry.get("utilities", {}).items():
        name = util.get("name", util_id)[:19]
        startup_file = util.get("startup_file", "")
        status = "🟢 Enabled" if check_startup_file(startup_file) else "🔴 Disabled"
        print(f"{name:<20} {'-':<8} {status:<18} {'utility':<12}")

    print()


def show_status():
    """Show only running servers."""
    registry = load_registry()

    running = []
    for server_id, server in registry.get("servers", {}).items():
        port = server.get("port")
        if port and check_port(port):
            running.append((server.get("name", server_id), port))

    if running:
        print("\n🟢 RUNNING SERVERS")
        print("-" * 40)
        for name, port in running:
            print(f"  {name} (port {port})")
    else:
        print("\n⚠️ No servers currently running")

    print()


def start_server(server_id: str):
    """Start a server by ID."""
    registry = load_registry()
    servers = registry.get("servers", {})

    if server_id not in servers:
        print(f"❌ Server '{server_id}' not found")
        print(f"   Available: {', '.join(servers.keys())}")
        return 1

    server = servers[server_id]
    port = server.get("port")

    # Check if already running
    if port and check_port(port):
        print(f"✅ {server.get('name', server_id)} already running on port {port}")
        return 0

    start_cmd = server.get("start_command")
    if not start_cmd:
        print(f"❌ No start_command defined for '{server_id}'")
        return 1

    cwd = server.get("cwd", "").replace("$MARKETPLACE_ROOT", str(MARKETPLACE_ROOT))

    print(f"🚀 Starting {server.get('name', server_id)}...")
    try:
        # Start in background
        if sys.platform == "win32":
            subprocess.Popen(
                start_cmd,
                shell=True,
                cwd=cwd or None,
                creationflags=subprocess.CREATE_NEW_CONSOLE
            )
        else:
            subprocess.Popen(
                start_cmd,
                shell=True,
                cwd=cwd or None,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL
            )
        print(f"✅ Started (port {port})")
        return 0
    except Exception as e:
        print(f"❌ Failed to start: {e}")
        return 1


def stop_server(server_id: str):
    """Stop a server by ID."""
    registry = load_registry()
    servers = registry.get("servers", {})

    if server_id not in servers:
        print(f"❌ Server '{server_id}' not found")
        return 1

    server = servers[server_id]
    stop_cmd = server.get("stop_command")
    port = server.get("port")

    if stop_cmd:
        print(f"🛑 Stopping {server.get('name', server_id)}...")
        try:
            subprocess.run(stop_cmd, shell=True, check=True)
            print(f"✅ Stopped")
            return 0
        except Exception as e:
            print(f"❌ Failed to stop: {e}")
            return 1
    elif port:
        # Try to find and kill process by port
        print(f"🛑 Killing process on port {port}...")
        try:
            if sys.platform == "win32":
                # Find PID by port
                result = subprocess.run(
                    f'netstat -ano | findstr ":{port}"',
                    shell=True,
                    capture_output=True,
                    text=True
                )
                for line in result.stdout.strip().split("\n"):
                    if "LISTENING" in line:
                        parts = line.split()
                        if parts:
                            pid = parts[-1]
                            subprocess.run(f"taskkill /PID {pid} /F", shell=True)
                            print(f"✅ Killed PID {pid}")
                            return 0
            print(f"⚠️ Could not find process on port {port}")
            return 1
        except Exception as e:
            print(f"❌ Failed: {e}")
            return 1
    else:
        print(f"❌ No stop_command or port defined for '{server_id}'")
        return 1


def main():
    """Main entry point."""
    if len(sys.argv) < 2:
        print(__doc__)
        return 0

    cmd = sys.argv[1].lower()

    if cmd == "list":
        list_servers()
    elif cmd == "status":
        show_status()
    elif cmd == "start" and len(sys.argv) > 2:
        return start_server(sys.argv[2])
    elif cmd == "stop" and len(sys.argv) > 2:
        return stop_server(sys.argv[2])
    else:
        print(__doc__)
        return 1

    return 0


if __name__ == "__main__":
    sys.exit(main())
