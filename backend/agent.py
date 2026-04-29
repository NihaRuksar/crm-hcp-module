import os
import re
import json
from datetime import date, datetime
from dotenv import load_dotenv
from langchain_groq import ChatGroq

load_dotenv()

llm = ChatGroq(
    model="llama-3.3-70b-versatile",
    api_key=os.getenv("GROQ_API_KEY")
)


def fix_spacing(text):
    """Fix common LLM spacing issues - insert space before capitals in camelCase words."""
    if not text or not isinstance(text, str):
        return text
    # Insert space before uppercase letters that follow lowercase letters
    fixed = re.sub(r'([a-z])([A-Z])', r'\1 \2', text)
    # Insert space after period if missing
    fixed = re.sub(r'\.(\w)', r'. \1', fixed)
    # Insert space after comma if missing
    fixed = re.sub(r',(\w)', r', \1', fixed)
    return fixed.strip()


def fix_dict_spacing(data):
    """Recursively fix spacing in all string values of a dict."""
    if isinstance(data, dict):
        return {k: fix_dict_spacing(v) for k, v in data.items()}
    elif isinstance(data, list):
        return [fix_dict_spacing(i) for i in data]
    elif isinstance(data, str):
        return fix_spacing(data)
    return data


def extract_json(raw):
    """Robustly extract JSON from LLM output regardless of markdown wrapping."""
    raw = raw.strip()
    raw = re.sub(r'```(?:json)?\s*', '', raw)
    raw = raw.replace('```', '').strip()
    match = re.search(r'\{.*\}', raw, re.DOTALL)
    if match:
        return json.loads(match.group())
    return json.loads(raw)


def run_agent(
    user_message,
    tool_hint="log_interaction",
    interaction_id=None,
    current_data=None,
):
    today = date.today().strftime("%Y-%m-%d")
    now = datetime.now().strftime("%H:%M")

    # ── TOOL 1: LOG INTERACTION ──────────────────────────────────────────────
    if tool_hint == "log_interaction":
        prompt = f"""You are a CRM AI assistant for life science field reps.
Extract HCP interaction details from this message and return ONLY valid JSON.

Message: "{user_message}"
Today date: {today}
Current time: {now}

CRITICAL SPACING RULE: Every string value MUST have proper spaces between ALL words.
Never join words together. Write naturally like normal English sentences.
Bad example: "goodenough" — Good example: "good enough"
Bad example: "discussionnextweek" — Good example: "discussion next week"
Bad example: "TheHCPwasenthusiastic" — Good example: "The HCP was enthusiastic"

Return ONLY this exact JSON with no markdown, no backticks, no extra text:
{{
  "hcp": "Dr. Full Name",
  "type": "Meeting",
  "date": "{today}",
  "time": "{now}",
  "location": "location if mentioned, or empty string",
  "topics": "topics discussed with spaces between all words",
  "products": "product names with spaces between all words",
  "sentiment": "positive",
  "outcomes": "outcomes described with spaces between all words",
  "followup": "follow up actions with spaces between all words",
  "materials": ["Brochure"],
  "samples": [],
  "summary": "A two sentence summary with proper spaces between every single word.",
  "suggestions": ["Schedule follow-up in 2 weeks", "Send product PDF"]
}}

Rules:
- Always prefix doctor names with Dr. if not already
- If today is mentioned use date: {today}
- sentiment must be exactly: positive, neutral, or negative
- Every string value must have proper English spacing between words
- Return ONLY the JSON object"""

        response = llm.invoke(prompt)
        raw = response.content

        try:
            data = extract_json(raw)
            data = fix_dict_spacing(data)
            return {"tool_used": "log_interaction", "result": data}
        except Exception as e:
            print(f"[log_interaction] parse failed: {e}\nRaw: {raw}")
            return {
                "tool_used": "log_interaction",
                "result": {
                    "hcp": "Dr. Smith",
                    "type": "Meeting",
                    "date": today,
                    "time": now,
                    "location": "",
                    "topics": user_message,
                    "products": "",
                    "sentiment": "positive",
                    "outcomes": "",
                    "followup": "",
                    "materials": [],
                    "samples": [],
                    "summary": user_message,
                    "suggestions": [],
                },
            }

    # ── TOOL 2: EDIT INTERACTION ─────────────────────────────────────────────
    elif tool_hint == "edit_interaction":
        current = json.dumps(current_data or {})
        prompt = f"""You are a CRM AI assistant. The user wants to edit specific fields of an existing HCP interaction.

Current interaction data:
{current}

User edit instruction: "{user_message}"

Your job:
1. Read what the user wants to change
2. Return ONLY the fields that need to change with their NEW values
3. Return null for every field that should NOT change
4. If hcp field is being changed, always prefix the name with "Dr." if not already present
5. All string values must have proper spaces between words

CRITICAL SPACING RULE: Every changed string value MUST have proper spaces between ALL words.

Return ONLY this JSON with no markdown, no backticks, no extra text:
{{
  "hcp": null,
  "type": null,
  "date": null,
  "time": null,
  "location": null,
  "topics": null,
  "products": null,
  "sentiment": null,
  "outcomes": null,
  "followup": null,
  "materials": null,
  "samples": null,
  "summary": null
}}

Example: if user says "change sentiment to negative", return:
{{"hcp": null, "type": null, "date": null, "time": null, "location": null, "topics": null, "products": null, "sentiment": "negative", "outcomes": null, "followup": null, "materials": null, "samples": null, "summary": null}}

Return ONLY the JSON."""

        response = llm.invoke(prompt)
        raw = response.content

        try:
            changes = extract_json(raw)
            changes = fix_dict_spacing(changes)
            if changes.get('hcp') and not changes['hcp'].startswith('Dr.'):
                changes['hcp'] = 'Dr. ' + changes['hcp']
            # Remove null values so only changed fields remain
            changed_fields = {k: v for k, v in changes.items() if v is not None}
            return {
                "tool_used": "edit_interaction",
                "result": {
                    "interaction_id": interaction_id or 0,
                    "changes": changes,
                    "changed_fields": list(changed_fields.keys()),
                },
            }
        except Exception as e:
            print(f"[edit_interaction] parse failed: {e}\nRaw: {raw}")
            return {"tool_used": "edit_interaction", "result": {"changes": {}, "changed_fields": []}}

    # ── TOOL 3: FETCH HCP PROFILE ────────────────────────────────────────────
    elif tool_hint == "fetch_hcp_profile":
        prompt = f"""Generate a realistic HCP profile for a life science CRM.
HCP Name or query: {user_message}

SPACING RULE: All string values must have proper spaces between words.

Return ONLY this JSON, no markdown, no backticks:
{{
  "name": "{user_message}",
  "specialty": "Cardiology",
  "hospital": "Apollo Hospital",
  "city": "Mumbai",
  "past_interactions": 5,
  "last_visit": "{today}",
  "preferred_contact": "Meeting",
  "notes": "Interested in new cardiovascular drugs. Responds well to clinical data."
}}"""

        response = llm.invoke(prompt)
        raw = response.content

        try:
            data = extract_json(raw)
            data = fix_dict_spacing(data)
            return {"tool_used": "fetch_hcp_profile", "result": data}
        except Exception as e:
            print(f"[fetch_hcp_profile] parse failed: {e}\nRaw: {raw}")
            return {
                "tool_used": "fetch_hcp_profile",
                "result": {
                    "name": user_message,
                    "specialty": "General Medicine",
                    "hospital": "City Hospital",
                    "city": "Chennai",
                    "past_interactions": 3,
                    "last_visit": today,
                    "preferred_contact": "Meeting",
                    "notes": "Key opinion leader in the region.",
                },
            }

    # ── TOOL 4: SCHEDULE FOLLOW-UP ───────────────────────────────────────────
    elif tool_hint == "schedule_followup":
        prompt = f"""You are a CRM AI assistant. Create a follow-up plan.

Context: "{user_message}"
Today: {today}

SPACING RULE: All string values must have proper spaces between words.

Return ONLY this JSON, no markdown, no backticks:
{{
  "followup_date": "2026-05-12",
  "followup_type": "Meeting",
  "priority": "High",
  "action_items": [
    "Send clinical trial data PDF",
    "Schedule product demo",
    "Follow up on prescription numbers"
  ],
  "message": "Based on the interaction a follow-up meeting is recommended in 2 weeks."
}}"""

        response = llm.invoke(prompt)
        raw = response.content

        try:
            data = extract_json(raw)
            data = fix_dict_spacing(data)
            return {"tool_used": "schedule_followup", "result": data}
        except Exception as e:
            print(f"[schedule_followup] parse failed: {e}\nRaw: {raw}")
            return {
                "tool_used": "schedule_followup",
                "result": {
                    "followup_date": today,
                    "followup_type": "Meeting",
                    "priority": "Medium",
                    "action_items": ["Follow up with HCP", "Send product information"],
                    "message": "Follow-up scheduled based on interaction.",
                },
            }

    # ── TOOL 5: ANALYZE SENTIMENT ────────────────────────────────────────────
    elif tool_hint == "analyze_sentiment":
        prompt = f"""Analyze the sentiment of this HCP interaction for a life science CRM.

Text: "{user_message}"

SPACING RULE: All string values must have proper spaces between words.

Return ONLY this JSON, no markdown, no backticks:
{{
  "sentiment": "positive",
  "confidence": 0.92,
  "score": 8,
  "reasoning": "The HCP showed strong interest and engaged actively during the discussion.",
  "sales_implication": "High likelihood of prescription increase in next quarter.",
  "recommended_action": "Send follow-up email with clinical data within 48 hours."
}}"""

        response = llm.invoke(prompt)
        raw = response.content

        try:
            data = extract_json(raw)
            data = fix_dict_spacing(data)
            return {"tool_used": "analyze_sentiment", "result": data}
        except Exception as e:
            print(f"[analyze_sentiment] parse failed: {e}\nRaw: {raw}")
            return {
                "tool_used": "analyze_sentiment",
                "result": {
                    "sentiment": "positive",
                    "confidence": 0.85,
                    "score": 7,
                    "reasoning": "Positive interaction detected.",
                    "sales_implication": "Good potential for conversion.",
                    "recommended_action": "Schedule follow-up meeting.",
                },
            }

    else:
        return {"tool_used": tool_hint, "result": {"message": "Unknown tool: " + str(tool_hint)}}