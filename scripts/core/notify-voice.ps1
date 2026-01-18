# Claude Code Voice Notification (French)
# Usage: powershell -File notify-voice.ps1 "Message à dire"

param(
    [string]$Message = "Claude attend ton retour"
)

Add-Type -AssemblyName System.Speech
$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer

# Use French voice if available, fallback to default
try {
    $synth.SelectVoice('Microsoft Hortense Desktop')
} catch {
    # Fallback to any available voice
}

$synth.Rate = 1  # Speed: -10 (slow) to 10 (fast)
$synth.Volume = 100  # Volume: 0-100

$synth.Speak($Message)
