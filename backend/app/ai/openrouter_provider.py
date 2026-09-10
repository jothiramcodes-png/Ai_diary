import json
import logging
import httpx
from typing import Optional, Dict, Any, List
from app.ai.base import AIProvider
from app.ai.local_provider import SmartLocalAIProvider
from app.schemas.ai import (
    AIUnderstandingResult,
    ExtractedEntity,
    ExtractedCommitment
)
from app.core.config import settings

logger = logging.getLogger(__name__)

class OpenRouterProvider(AIProvider):
    def __init__(self):
        self.fallback = SmartLocalAIProvider()
        self.api_key = settings.OPENROUTER_API_KEY
        self.model = settings.OPENROUTER_MODEL or 'openai/gpt-4o-mini'
        self.base_url = 'https://openrouter.ai/api/v1/chat/completions'
        self.headers = {
            'Authorization': f'Bearer {self.api_key}',
            'Content-Type': 'application/json',
            'HTTP-Referer': 'http://localhost:5173',
            'X-Title': 'LifeBook AI'
        }

    async def _call_openrouter(self, messages: List[Dict[str, str]], response_format_json: bool = False, temperature: float = 0.3) -> Optional[str]:
        if not self.api_key:
            return None
        payload: Dict[str, Any] = {
            'model': self.model,
            'messages': messages,
            'temperature': temperature,
        }
        if response_format_json:
            payload['response_format'] = {'type': 'json_object'}

        try:
            async with httpx.AsyncClient(timeout=25.0) as client:
                res = await client.post(self.base_url, headers=self.headers, json=payload)
                if res.status_code == 200:
                    data = res.json()
                    choices = data.get('choices', [])
                    if choices:
                        return choices[0].get('message', {}).get('content', '')
                else:
                    logger.warning(f'OpenRouter API returned status {res.status_code}: {res.text[:200]}')
        except Exception as e:
            logger.error(f'OpenRouter call error: {e}')
        return None

    async def understand_entry(self, text: str, image_context: Optional[str] = None) -> AIUnderstandingResult:
        if not self.api_key:
            return await self.fallback.understand_entry(text, image_context)

        prompt = f'''You are an AI personal life diary parser.
Analyze this journal entry:
\"\"\"{text}\"\"\"
{f'Image context: {image_context}' if image_context else ''}

Extract the following JSON structure:
{{
  \"title\": \"Short memorable title (3-6 words)\",
  \"diary_draft\": \"Well-written, polished first-person journal narrative capturing what happened with emotional resonance\",
  \"category\": \"Category name (e.g. College / Project, Work / Business, Personal, Leisure, Travel, Food)\",
  \"people\": [ {{\"name\": \"Person Name\", \"confidence\": 0.95}} ],
  \"places\": [ {{\"name\": \"Location Name\", \"confidence\": 0.95}} ],
  \"projects\": [ {{\"name\": \"Project/Work Name\", \"confidence\": 0.95}} ],
  \"activities\": [ {{\"name\": \"Activity Name\", \"confidence\": 0.95}} ],
  \"commitments\": [
    {{
      \"description\": \"Specific action or task committed to\",
      \"project\": \"Project or context\",
      \"due_date\": \"Mentioned or inferred deadline (e.g. Tomorrow, Next Wednesday, Upcoming)\",
      \"confidence\": 0.92,
      \"priority\": \"high\"
    }}
  ],
  \"confidence\": 0.95
}}
Return ONLY valid JSON.
'''
        try:
            content = await self._call_openrouter([
                {'role': 'system', 'content': 'You are a structured diary extraction AI. Output strictly valid JSON.'},
                {'role': 'user', 'content': prompt}
            ], response_format_json=True)

            if content:
                data = json.loads(content)
                people = [ExtractedEntity(type="person", name=p.get('name', ''), confidence=p.get('confidence', 0.9)) for p in data.get('people', []) if p.get('name')]
                places = [ExtractedEntity(type="place", name=p.get('name', ''), confidence=p.get('confidence', 0.9)) for p in data.get('places', []) if p.get('name')]
                projects = [ExtractedEntity(type="project", name=p.get('name', ''), confidence=p.get('confidence', 0.9)) for p in data.get('projects', []) if p.get('name')]
                activities = [ExtractedEntity(type="activity", name=ac.get('name', ''), confidence=ac.get('confidence', 0.9)) for ac in data.get('activities', []) if ac.get('name')]
                commitments = [
                    ExtractedCommitment(
                        description=c.get('description', ''),
                        project=c.get('project', 'General'),
                        due_date=c.get('due_date', 'Upcoming'),
                        confidence=c.get('confidence', 0.9),
                        priority=c.get('priority', 'medium')
                    ) for c in data.get('commitments', []) if c.get('description')
                ]
                tags = [data.get('category', 'Personal')]
                tags.extend([p.name for p in people])
                tags.extend([pl.name for pl in places])
                return AIUnderstandingResult(
                    title=data.get('title', 'Reflective Memory'),
                    diary_draft=data.get('diary_draft', text),
                    category=data.get('category', 'Personal'),
                    people=people,
                    places=places,
                    projects=projects,
                    activities=activities,
                    commitments=commitments,
                    tags=tags,
                    confidence=float(data.get('confidence', 0.95)),
                    disambiguation=None
                )
        except Exception as e:
            logger.warning(f'OpenRouter parsing failed, falling back to local provider: {e}')

        return await self.fallback.understand_entry(text, image_context)

    async def generate_diary(self, raw_input: str, entities: Dict[str, Any]) -> str:
        if not self.api_key:
            return await self.fallback.generate_diary(raw_input, entities)

        prompt = f'''Transform this raw voice or text memory into a warm, beautifully reflective first-person journal entry:
Raw input: {raw_input}
Extracted details: {json.dumps(entities)}

Return only the final diary text.'''
        content = await self._call_openrouter([
            {'role': 'system', 'content': 'You are a warm, reflective digital diary writer.'},
            {'role': 'user', 'content': prompt}
        ])
        if content:
            return content.strip()
        return await self.fallback.generate_diary(raw_input, entities)

    async def regenerate_diary(self, text: str, tone: Optional[str] = "reflective", instructions: Optional[str] = None, user_context: Optional[str] = None) -> Dict[str, str]:
        if not self.api_key:
            return await self.fallback.regenerate_diary(text, tone, instructions, user_context)

        system_msg = (
            "You are a master personal journal writer and reflective storyteller. "
            "Your task is to take the user's daily memory or draft and rewrite/regenerate it into an eloquent, "
            f"beautifully written first-person ('I') journal narrative.\n"
            f"Desired tone: {tone or 'warm and reflective'}.\n"
            + (f"User personal background: {user_context}\n" if user_context else "")
            + (f"User instructions: {instructions}\n" if instructions else "")
            + "Output strictly a valid JSON object with:\n"
            "- \"title\": An evocative, memorable 3-6 word journal title\n"
            "- \"content\": The rewritten, elevated first-person diary entry narrative"
        )
        user_msg = f"Original text or memory notes:\n\"\"\"\n{text}\n\"\"\"\n\nPlease regenerate this diary entry now."

        try:
            res_content = await self._call_openrouter([
                {"role": "system", "content": system_msg},
                {"role": "user", "content": user_msg}
            ], response_format_json=True, temperature=0.7)

            if res_content:
                data = json.loads(res_content)
                if data.get("content"):
                    return {
                        "title": data.get("title") or "Memories of Today",
                        "content": data.get("content")
                    }
        except Exception as e:
            logger.warning(f"OpenRouter regenerate_diary failed, using fallback: {e}")

        return await self.fallback.regenerate_diary(text, tone, instructions, user_context)

    async def answer_question(self, query: str, context_entries: List[Dict[str, Any]], user_profile: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        if not self.api_key:
            return await self.fallback.answer_question(query, context_entries, user_profile=user_profile)

        user_name = (user_profile or {}).get('full_name', 'User')
        profile_details = (user_profile or {}).get('preferences', {})
        commitments = (user_profile or {}).get('commitments', [])
        routines = (user_profile or {}).get('routines', [])
        entities = (user_profile or {}).get('entities', [])

        current_date_str = "Thursday, September 10, 2026"

        system_prompt = f'''You are LifeBook AI, the deeply personal, empathetic, and intelligent digital assistant for {user_name}.
You have direct, private access to {user_name}'s personal digital diary, commitments, habits, and life memories.

### CURRENT REFERENCE DATE (TODAY):
- Today is: {current_date_str}.
- Any diary entry dated September 10, 2026 IS TODAY's entry!
- Any diary entry dated September 09, 2026 IS YESTERDAY's entry.

### {user_name}'s Profile & Preferences:
- Name: {user_name}
- Known background / preferences: {json.dumps(profile_details)}

### Active Commitments & Due Dates:
{json.dumps(commitments, indent=2) if commitments else 'None currently pending.'}

### Detected Routines & Habits:
{json.dumps(routines, indent=2) if routines else 'No routine records.'}

### Known People, Places & Projects (Life Graph):
{json.dumps(entities, indent=2) if entities else 'No life graph entities recorded yet.'}

### Complete Diary Memories (chronological order):
{json.dumps(context_entries, indent=2) if context_entries else 'No journal entries recorded yet.'}

Guidelines:
1. Always base your answers directly on {user_name}'s authentic memories, commitments, and profile above. Be factually accurate, thorough, and empathetic.
2. When asked about "today" (e.g. "What did I do today?", "Read today's diary", "Who did I meet today?"), inspect all entries for {current_date_str} and summarize what happened.
3. When asked about personal preferences, tastes, or facts (e.g. "What is my favorite movie?", "What food do I like?", "What did I say about Iron Man?"), search the memory texts carefully (e.g. if an entry mentions "my favourite movie is iron man", state clearly that your favorite movie is Iron Man).
4. When asked about specific people (e.g. Poovarasan, Kisho Varma, Ravi, Anand, Kumar) or places (e.g. Madurai, Marina Beach, College), specify the exact activities, dates, and discussions from the memories.
5. When asked about commitments, deadlines, or "What am I forgetting?", enumerate active commitments with their due dates and projects.
6. If the question cannot be answered from any provided memory, gently explain that no memory has been recorded yet for that specific topic.
7. If the user writes in Tamil, Tanglish, or English, match their language style naturally.
8. Speak warmly, concisely, and supportively as their personal life assistant.
'''
        try:
            content = await self._call_openrouter([
                {'role': 'system', 'content': system_prompt},
                {'role': 'user', 'content': query}
            ], temperature=0.3)

            if content:
                # Find matching entry ID
                matched_id = None
                q_words = [w.lower() for w in query.split() if len(w) > 3 and w.lower() not in ["what", "when", "where", "which", "your", "today", "with"]]
                for e in context_entries:
                    corpus = f"{e.get('title', '')} {e.get('content', '')} {e.get('raw_text', '')}".lower()
                    if any(w in corpus for w in q_words):
                        matched_id = e.get('id')
                        break

                if not matched_id and context_entries:
                    matched_id = context_entries[0].get('id')

                return {
                    'answer': content.strip(),
                    'source_entry_id': matched_id,
                    'confidence': 0.98
                }
        except Exception as e:
            logger.warning(f'OpenRouter answer_question failed, falling back: {e}')

        return await self.fallback.answer_question(query, context_entries, user_profile=user_profile)

    async def generate_memory_story(self, entries: List[Dict[str, Any]], title: str) -> Dict[str, Any]:
        return await self.fallback.generate_memory_story(entries, title)
