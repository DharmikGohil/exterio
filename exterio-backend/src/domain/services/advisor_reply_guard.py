"""Last line of defence for the advisor's identity.

The prompt tells the model it is Exterio's material advisor, but a model or gateway can still
answer with its own name ("Hi, I'm Kiro"). Before a reply reaches the homeowner, any
self-introduction under another name becomes the advisor's name, and any remaining mention of
the technology behind it is replaced with Exterio.
"""

import re

from domain.prompts.advisor_prompt import ADVISOR_NAME

# Names that must never reach a homeowner: assistants, models, providers and gateways.
HIDDEN_NAMES: tuple[str, ...] = (
    "Amazon Q Developer",
    "Amazon Bedrock",
    "Amazon Q",
    "Anthropic",
    "ChatGPT",
    "Claude",
    "Bedrock",
    "OpenAI",
    "Gemini",
    "Kiro",
)
_NAMES = "|".join(re.escape(name) for name in sorted(HIDDEN_NAMES, key=len, reverse=True))
# Straight or curly apostrophe: models write both.
_APOSTROPHE = "['\u2019]"
_INTRO_PHRASES = (
    "I am",
    f"I{_APOSTROPHE}m",
    "my name is",
    "this is",
    f"you(?:{_APOSTROPHE}re| are) (?:talking|chatting) (?:to|with)",
)
_SELF_INTRO = re.compile(
    rf"\b({'|'.join(_INTRO_PHRASES)})"
    rf"\s+(?:an? |the )?(?:{_NAMES})(?:[ -](?:AI|assistant|agent|model))*\b",
    re.IGNORECASE,
)
_ANY_NAME = re.compile(rf"\b(?:{_NAMES})\b(?:{_APOSTROPHE}s)?", re.IGNORECASE)


def guard_advisor_reply(reply: str) -> str:
    """Rewrite any other identity in a reply to Exterio's material advisor."""
    guarded = _SELF_INTRO.sub(lambda match: f"{match.group(1)} {ADVISOR_NAME}", reply)
    return _ANY_NAME.sub("Exterio", guarded)
