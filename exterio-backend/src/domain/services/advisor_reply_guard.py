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


# Text a rewrite can still change once more arrives: the longest hidden name with an article
# before it and "assistant agent" after it fits well inside this.
STREAM_HOLD_BACK_CHARS = 48


class GuardedTextStream:
    """`guard_advisor_reply` for an answer that arrives in pieces.

    A name can be split across pieces ("Ki" + "ro"), so the last few words are held back until
    the text after them shows they cannot be part of a rewrite. Pieces come out at word
    boundaries; `finish` releases the rest.
    """

    def __init__(self) -> None:
        self._raw = ""
        self._sent = 0

    @property
    def text(self) -> str:
        """The whole answer so far, guarded."""
        return guard_advisor_reply(self._raw).strip()

    def push(self, piece: str) -> str:
        """Adds raw text and returns the guarded text that is now safe to show."""
        self._raw += piece
        guarded = guard_advisor_reply(self._raw)
        safe_end = guarded.rfind(" ", 0, max(0, len(guarded) - STREAM_HOLD_BACK_CHARS)) + 1
        return self._release(guarded, safe_end)

    def finish(self) -> str:
        """Returns whatever has not been shown yet."""
        guarded = guard_advisor_reply(self._raw).rstrip()
        return self._release(guarded, len(guarded))

    def _release(self, guarded: str, end: int) -> str:
        if end <= self._sent:
            return ""
        piece = guarded[self._sent : end]
        self._sent = end
        return piece
