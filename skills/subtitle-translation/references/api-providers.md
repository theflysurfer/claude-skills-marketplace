# API Providers for Subtitle Translation

## Recommended: OpenRouter

Best balance of cost, quality, and reliability.

### Setup

1. Create account at https://openrouter.ai
2. Add credits (minimum $5 recommended)
3. Generate API key in dashboard

### Pricing (December 2024)

| Model | Input | Output | Quality | Speed |
|-------|-------|--------|---------|-------|
| **Llama 3.3 70B** | $0.11/M | $0.34/M | Excellent | Fast |
| Llama 3.1 405B | $0.80/M | $0.80/M | Best | Slower |
| Mixtral 8x22B | $0.65/M | $0.65/M | Good | Fast |
| GPT-4o-mini | $0.15/M | $0.60/M | Very Good | Fast |

### Check Credits

```python
import requests

def get_openrouter_credits(api_key):
    r = requests.get(
        "https://openrouter.ai/api/v1/credits",
        headers={"Authorization": f"Bearer {api_key}"}
    )
    data = r.json().get("data", {})
    total = data.get("total_credits", 0)
    used = data.get("total_usage", 0)
    return total - used
```

## Alternative: Direct Providers

### Anthropic (Claude)

- Higher quality but more expensive
- Good for difficult translations
- $3/M input, $15/M output (Claude 3.5 Sonnet)

### OpenAI

- GPT-4o-mini: $0.15/M input, $0.60/M output
- Reliable but needs credit card

### Groq (Free Tier)

- Llama models with generous free tier
- Rate limited, good for testing
- https://console.groq.com

## Cost Estimation Formula

```
Real Cost = Naive Cost × 1.5

Where:
Naive Cost = episodes × subtitles/ep × tokens/subtitle × 2 × price/token

Typical values:
- subtitles/episode: 250
- tokens/subtitle: 50
- price: varies by model
```

### Example: 600 Episodes with Llama 3.3 70B

```
Naive = 600 × 250 × 50 × 2 × $0.225/M = $3.38
Real  = $3.38 × 1.5 = ~$5.00
```

## Rate Limits

| Provider | Requests/min | Tokens/min |
|----------|--------------|------------|
| OpenRouter | 200 | 100K |
| OpenAI | 60 | 90K |
| Groq (free) | 30 | 6K |

**Recommendation**: Add 0.5s delay between batch requests to stay safe.
