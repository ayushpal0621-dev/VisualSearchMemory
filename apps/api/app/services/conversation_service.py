import json
import httpx
from typing import Dict, Any, List
from datetime import datetime
from sqlalchemy.orm import Session
from apps.api.app.schemas.search import (
    ConversationSearchRequest, ConversationSearchResponse, SearchRequest, SearchFilters
)
from apps.api.app.services.search_service import search_service
from apps.api.app.core.config import settings
from apps.api.app.core.logging import logger

class ConversationSearchService:
    """Conversational memory retrieval preserving dialogue context."""

    def __init__(self):
        self.ollama_url = settings.OLLAMA_URL
        self.model = settings.OLLAMA_MODEL
        self.timeout = settings.OLLAMA_TIMEOUT_SECONDS

    async def converse_and_search(
        self,
        db: Session,
        req: ConversationSearchRequest
    ) -> ConversationSearchResponse:
        """Interpret conversational utterance with prior turns to produce structured visual search."""
        history_text = ""
        for m in req.messages[-4:]:
            history_text += f"{m.role.capitalize()}: {m.content}\n"

        prompt = f"""You are a visual memory search assistant. Maintain search conversation context and interpret the latest user request into search filters.
Conversation History:
{history_text}
Current User Message: "{req.current_query}"

Output ONLY a JSON object:
{{
  "interpreted_search_query": "cumulative search phrase",
  "mime_type": "image/png or null if looking for screenshots",
  "year": 2025 or null,
  "assistant_reply": "Short natural response to user"
}}
JSON:"""

        interpreted_query = req.current_query
        interpreted_filters = {}
        assistant_reply = ""

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
                    parsed = json.loads(data.get("response", "{}"))
                    interpreted_query = parsed.get("interpreted_search_query", req.current_query)
                    assistant_reply = parsed.get("assistant_reply", "")
                    if parsed.get("mime_type"):
                        interpreted_filters["mime_types"] = [parsed["mime_type"]]
                    if parsed.get("year"):
                        y = int(parsed["year"])
                        interpreted_filters["date_from"] = datetime(y, 1, 1)
                        interpreted_filters["date_to"] = datetime(y, 12, 31, 23, 59, 59)
        except Exception as e:
            logger.debug(f"Conversational LLM offline or timed out: {e}. Using conversational rule fallback.")

        # Fallback interpretation if LLM didn't produce a reply
        if not assistant_reply:
            # Combine current query with previous user query if current is a refinement
            prev_user_msgs = [m.content for m in req.messages if m.role == "user"]
            if prev_user_msgs and len(req.current_query.split()) <= 3:
                combined = f"{prev_user_msgs[-1]} {req.current_query}"
                interpreted_query = combined
            else:
                interpreted_query = req.current_query

            if "screenshot" in req.current_query.lower():
                interpreted_filters["mime_types"] = ["image/png"]
            assistant_reply = f"Searching for \"{interpreted_query}\"..."

        # Build search request
        filters_obj = SearchFilters(**interpreted_filters) if interpreted_filters else req.filters

        search_req = SearchRequest(
            query=interpreted_query,
            search_mode="hybrid",
            filters=filters_obj,
            limit=req.limit
        )

        search_resp = await search_service.search(db, search_req)

        count = search_resp.total_found
        if count == 0:
            final_reply = f"I couldn't find any images matching \"{interpreted_query}\"."
        else:
            final_reply = f"Found {count} matching image{'s' if count != 1 else ''}."

        return ConversationSearchResponse(
            assistant_reply=final_reply,
            interpreted_query=interpreted_query,
            interpreted_filters=interpreted_filters,
            search_response=search_resp
        )

conversation_service = ConversationSearchService()
