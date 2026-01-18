# Claude Code Notification - Toast + Voice (French)
# Triggered by Claude Code Notification hook
#
# Usage: powershell -NoProfile -File notify-toast-voice.ps1
# Input: JSON from stdin with hook data

param(
    [switch]$VoiceOnly,
    [switch]$ToastOnly
)

# Read hook data from stdin
$inputData = $null
try {
    $inputData = [Console]::In.ReadToEnd() | ConvertFrom-Json
} catch {
    # No stdin or invalid JSON - use defaults
}

# Determine notification type and message
$title = "Claude Code"
$message = "Claude attend ton input"
$voiceMessage = "Claude attend ton retour"

if ($inputData) {
    $hookType = $inputData.hook_type

    switch -Regex ($hookType) {
        "permission" {
            $title = "Permission requise"
            $message = "Claude demande une permission"
            $voiceMessage = "Claude demande ta permission"
        }
        "idle|input" {
            $title = "Input requis"
            $message = "Claude a terminé et attend"
            $voiceMessage = "Claude a terminé et attend ton retour"
        }
        "error" {
            $title = "Erreur"
            $message = "Une erreur s'est produite"
            $voiceMessage = "Attention, une erreur s'est produite"
        }
        "complete|done|success" {
            $title = "Tâche terminée"
            $message = "Claude a terminé sa tâche"
            $voiceMessage = "Claude a terminé sa tâche"
        }
    }
}

# --- TOAST NOTIFICATION ---
if (-not $VoiceOnly) {
    try {
        [Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] | Out-Null
        [Windows.Data.Xml.Dom.XmlDocument, Windows.Data.Xml.Dom, ContentType = WindowsRuntime] | Out-Null

        $template = @"
<toast duration="short">
    <visual>
        <binding template="ToastText02">
            <text id="1">$title</text>
            <text id="2">$message</text>
        </binding>
    </visual>
    <audio src="ms-winsoundevent:Notification.Default"/>
</toast>
"@

        $xml = New-Object Windows.Data.Xml.Dom.XmlDocument
        $xml.LoadXml($template)

        $toast = New-Object Windows.UI.Notifications.ToastNotification $xml
        [Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier("Claude Code").Show($toast)
    } catch {
        # Toast failed - continue with voice
    }
}

# --- VOICE NOTIFICATION ---
if (-not $ToastOnly) {
    try {
        Add-Type -AssemblyName System.Speech
        $synth = New-Object System.Speech.Synthesis.SpeechSynthesizer

        # Try French voice first
        try {
            $synth.SelectVoice('Microsoft Hortense Desktop')
        } catch {
            # Use default voice
        }

        $synth.Rate = 1
        $synth.Volume = 80
        $synth.Speak($voiceMessage)
    } catch {
        # Voice failed silently
    }
}
