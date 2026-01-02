/**
 * Skill Actions - Trigger Claude Code skills from MkDocs
 * Requires skill-api-server.py running on localhost:8888
 */

const SKILL_API_URL = "http://127.0.0.1:8888";

// Check if API server is running
async function checkApiHealth() {
  try {
    const response = await fetch(`${SKILL_API_URL}/health`, {
      method: "GET",
      mode: "cors"
    });
    return response.ok;
  } catch (e) {
    return false;
  }
}

// Execute a skill via the API
async function executeSkill(skillName) {
  const button = event?.target;
  const originalText = button?.textContent;

  try {
    // Update button state
    if (button) {
      button.textContent = "...";
      button.disabled = true;
    }

    const response = await fetch(`${SKILL_API_URL}/api/skill/${skillName}`, {
      method: "POST",
      mode: "cors",
      headers: { "Content-Type": "application/json" }
    });

    const data = await response.json();

    if (data.success) {
      showNotification(`Skill "${skillName}" executed successfully`, "success");
      if (button) button.textContent = "Done!";
    } else {
      showNotification(`Error: ${data.error || data.stderr}`, "error");
      if (button) button.textContent = "Error";
    }

  } catch (e) {
    if (e.message.includes("Failed to fetch")) {
      showNotification("API server not running. Start with: python scripts/skill-api-server.py", "error");
    } else {
      showNotification(`Error: ${e.message}`, "error");
    }
    if (button) button.textContent = "Error";
  } finally {
    // Reset button after delay
    if (button) {
      setTimeout(() => {
        button.textContent = originalText;
        button.disabled = false;
      }, 2000);
    }
  }
}

// Copy command to clipboard
function copyCommand(command) {
  navigator.clipboard.writeText(command).then(() => {
    showNotification(`Copied: ${command}`, "success");
  }).catch(err => {
    showNotification("Failed to copy", "error");
  });
}

// Show notification toast
function showNotification(message, type = "info") {
  // Remove existing notifications
  document.querySelectorAll(".skill-notification").forEach(n => n.remove());

  const notification = document.createElement("div");
  notification.className = `skill-notification skill-notification-${type}`;
  notification.textContent = message;
  document.body.appendChild(notification);

  // Auto-remove after 4 seconds
  setTimeout(() => notification.remove(), 4000);
}

// Initialize on page load
document.addEventListener("DOMContentLoaded", async () => {
  // Check API health and update indicators
  const apiHealthy = await checkApiHealth();

  document.querySelectorAll(".skill-action-btn").forEach(btn => {
    if (!apiHealthy) {
      btn.classList.add("api-offline");
      btn.title = "API server offline - click to copy command instead";
    }
  });

  // Add click handlers for action buttons
  document.querySelectorAll("[data-skill-action]").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      const skillName = btn.dataset.skillAction;
      const apiHealthy = await checkApiHealth();

      if (apiHealthy) {
        executeSkill(skillName);
      } else {
        // Fallback: copy command
        copyCommand(`Skill("${skillName}")`);
      }
    });
  });

  // Add click handlers for copy buttons
  document.querySelectorAll("[data-copy-command]").forEach(btn => {
    btn.addEventListener("click", (e) => {
      copyCommand(btn.dataset.copyCommand);
    });
  });
});

// Expose functions globally
window.executeSkill = executeSkill;
window.copyCommand = copyCommand;
