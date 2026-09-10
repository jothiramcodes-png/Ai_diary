import os
from typing import Optional, Dict, Any, List
from app.ai.base import AIProvider
from app.ai.local_provider import SmartLocalAIProvider
from app.schemas.ai import AIUnderstandingResult
from app.core.config import settings

class RealAIProvider(AIProvider):
    def __init__(self):
        self.fallback = SmartLocalAIProvider()
        self.api_key = settings.OPENAI_API_KEY or settings.GEMINI_API_KEY

    async def understand_entry(self, text: str, image_context: Optional[str] = None) -> AIUnderstandingResult:
        if not self.api_key:
            return await self.fallback.understand_entry(text, image_context)
        # If API key exists, could call OpenAI / Gemini JSON mode, with fallback if error
        try:
            return await self.fallback.understand_entry(text, image_context)
        except Exception:
            return await self.fallback.understand_entry(text, image_context)

    async def generate_diary(self, raw_input: str, entities: Dict[str, Any]) -> str:
        return await self.fallback.generate_diary(raw_input, entities)

    async def regenerate_diary(self, text: str, tone: Optional[str] = "reflective", instructions: Optional[str] = None, user_context: Optional[str] = None) -> Dict[str, str]:
        return await self.fallback.regenerate_diary(text, tone, instructions, user_context)

    async def answer_question(self, query: str, context_entries: List[Dict[str, Any]]) -> Dict[str, Any]:
        return await self.fallback.answer_question(query, context_entries)

    async def generate_memory_story(self, entries: List[Dict[str, Any]], title: str) -> Dict[str, Any]:
        return await self.fallback.generate_memory_story(entries, title)
