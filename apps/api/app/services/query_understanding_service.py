import re
import json
import httpx
from typing import Dict, Any, List
from datetime import datetime, timedelta
from apps.api.app.core.config import settings
from apps.api.app.core.logging import logger

class QueryUnderstandingService:
    """
    LLM Query Understanding and decomposition service using Ollama with deterministic fallback.
    """

    def __init__(self):
        self.ollama_url = settings.OLLAMA_URL
        self.model = settings.OLLAMA_MODEL
        self.timeout = settings.OLLAMA_TIMEOUT_SECONDS

    async def analyze_query(self, raw_query: str) -> Dict[str, Any]:
        """Convert natural language query to structured search parameters."""
        clean_query = raw_query.strip()
        if not clean_query:
            return self._fallback_parse(raw_query)

        prompt = f"""You are a search query interpreter for an image and visual document memory system.
Analyze the user's natural language search query and return ONLY valid JSON matching this schema:
{{
  "semantic_query": "cleaned conceptual query for visual embedding search",
  "keywords": ["exact", "ocr", "terms"],
  "content_type": "screenshot | photo | diagram | note | code | any",
  "year": 2024 or null,
  "confidence": 0.95
}}

User Query: "{clean_query}"
JSON:"""

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                res = await client.post(
                    f"{self.ollama_url}/api/generate",
                    json={
                        "model": self.model,
                        "prompt": prompt,
                        "stream": False,
                        "format": "json"
                    }
                )
                if res.status_code == 200:
                    data = res.json()
                    response_text = data.get("response", "").strip()
                    parsed = json.loads(response_text)
                    logger.info(f"Ollama structured query understanding: {parsed}")
                    return {
                        "semantic_query": parsed.get("semantic_query", clean_query),
                        "keywords": parsed.get("keywords", clean_query.split()),
                        "content_type": parsed.get("content_type", "any"),
                        "year": parsed.get("year"),
                        "engine": f"ollama-{self.model}"
                    }
        except Exception as e:
            logger.debug(f"Ollama unavailable or timed out ({e}). Using deterministic query understanding.")

        return self._fallback_parse(clean_query)

    def _fallback_parse(self, query: str) -> Dict[str, Any]:
        """Deterministic rule-based query parser when Ollama is offline."""
        lower = query.lower()

        # Content type detection
        content_type = "any"
        if "screenshot" in lower:
            content_type = "screenshot"
        elif "diagram" in lower or "architecture" in lower:
            content_type = "diagram"
        elif "code" in lower or "python" in lower:
            content_type = "code"
        elif "note" in lower or "handwritten" in lower:
            content_type = "note"
        elif "photo" in lower or "event" in lower:
            content_type = "photo"

        # Year detection (e.g., 2023, 2024, 2025, 2026)
        year_match = re.search(r'\b(20[1-3][0-9])\b', query)
        detected_year = int(year_match.group(1)) if year_match else None

        # Clean words from query
        stop_phrases = ["find", "show", "my", "images", "containing", "about", "photo", "where", "i", "was", "related", "to"]
        words = re.findall(r'[a-zA-Z0-9_\-]+', query)
        keywords = [w for w in words if w.lower() not in stop_phrases and len(w) > 1]
        semantic_query = " ".join(keywords) if keywords else query

        return {
            "semantic_query": semantic_query,
            "keywords": keywords,
            "content_type": content_type,
            "year": detected_year,
            "engine": "rule-based-fallback"
        }

query_understanding_service = QueryUnderstandingService()
