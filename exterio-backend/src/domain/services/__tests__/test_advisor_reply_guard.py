import pytest

from domain.services.advisor_reply_guard import GuardedTextStream, guard_advisor_reply


@pytest.mark.parametrize(
    ("reply", "expected_start"),
    [
        ("Hi, I'm Kiro. I can help with paint.", "Hi, I'm Exterio's material advisor."),
        ("Hello! I am Claude, an AI assistant.", "Hello! I am Exterio's material advisor, an"),
        ("My name is Kiro AI assistant and", "My name is Exterio's material advisor and"),
        ("You're talking to Amazon Q here.", "You're talking to Exterio's material advisor here."),
        ("i\u2019m kiro, happy to help", "i\u2019m Exterio's material advisor, happy to help"),
    ],
)
def test_another_identity_becomes_the_advisor(reply, expected_start):
    assert guard_advisor_reply(reply).startswith(expected_start)


def test_any_other_mention_of_the_technology_is_hidden():
    actual = guard_advisor_reply("This runs on Anthropic's Claude via Amazon Bedrock.")

    for name in ("Anthropic", "Claude", "Bedrock", "Amazon"):
        assert name not in actual


def test_ordinary_advice_is_left_alone():
    reply = "Textured coating suits a coastal wall. Expect 500 sq ft to cost about INR 22,000."

    assert guard_advisor_reply(reply) == reply


def test_words_that_only_contain_a_name_are_left_alone():
    assert guard_advisor_reply("Use a kirogami-style pattern.") == "Use a kirogami-style pattern."


def _stream(pieces):
    guarded = GuardedTextStream()
    shown = [guarded.push(piece) for piece in pieces]
    shown.append(guarded.finish())
    return shown


def test_a_name_split_across_pieces_never_reaches_the_screen():
    pieces = ["Hi, I'm Ki", "ro", ". Texture paint lasts about seven years on a sunny wall."]

    shown = _stream(pieces)

    assert "".join(shown).startswith("Hi, I'm Exterio's material advisor."), (
        "pieces joined must equal the guarded whole reply"
    )
    assert not any("Ki" in piece and "Kiro" not in piece for piece in shown), (
        "a half name must be held back, not shown"
    )


def test_streamed_pieces_add_up_to_the_guarded_reply():
    reply = "I am Claude. Stone cladding costs more but needs almost no upkeep for decades. " * 3
    pieces = [reply[index : index + 7] for index in range(0, len(reply), 7)]

    actual = "".join(_stream(pieces))

    assert actual == guard_advisor_reply(reply).rstrip()
    assert sum(1 for piece in _stream(pieces) if piece) > 2, "text must flow, not arrive at the end"
