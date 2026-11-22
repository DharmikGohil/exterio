import json

from infrastructure.services.ai.streaming_json import JsonArrayObjectStream

REPLY = json.dumps(
    {
        "regions": [
            {"label": "wall", "polygon": [{"x": 1, "y": 2}, {"x": 3, "y": 4}]},
            {"label": "other", "name": 'Odd {name] with "quotes"', "polygon": []},
            {"label": "door", "polygon": [[5, 6]]},
        ]
    }
)


def test_each_object_comes_out_as_soon_as_it_is_complete():
    stream = JsonArrayObjectStream()
    seen_at = []

    for index, char in enumerate(REPLY):
        for item in stream.feed(char):
            seen_at.append((index, item["label"]))

    assert [label for _, label in seen_at] == ["wall", "other", "door"]
    assert seen_at[0][0] < len(REPLY) // 2, "the first part must come out early, not at the end"


def test_braces_and_quotes_inside_strings_do_not_confuse_it():
    stream = JsonArrayObjectStream()

    items = [
        item for piece in (REPLY[:40], REPLY[40:90], REPLY[90:]) for item in stream.feed(piece)
    ]

    assert items[1]["name"] == 'Odd {name] with "quotes"'
    assert len(items) == 3


def test_prose_or_a_code_fence_before_the_json_is_ignored():
    stream = JsonArrayObjectStream()

    items = list(stream.feed("```json\n" + REPLY + "\n```"))

    assert [item["label"] for item in items] == ["wall", "other", "door"]
