"""Pick finished objects out of a JSON array while the JSON is still being written.

A model writes `{"regions": [{...}, {...}, ...]}` a few characters at a time. Each object in
that array is complete as soon as its closing brace arrives, long before the whole reply is, so
it can be used straight away. Strings are tracked, so braces inside a name are not counted.
"""

import json
from collections.abc import Iterator
from typing import Any


class JsonArrayObjectStream:
    """Feed text as it arrives; get back each object of the top-level object's array."""

    def __init__(self) -> None:
        self._buffer: list[str] = []
        self._stack: list[str] = []
        self._in_string = False
        self._escaped = False
        self._object_start: int | None = None
        self._position = 0

    def feed(self, text: str) -> Iterator[dict[str, Any]]:
        for char in text:
            self._buffer.append(char)
            index = self._position
            self._position += 1
            if self._in_string:
                if self._escaped:
                    self._escaped = False
                elif char == "\\":
                    self._escaped = True
                elif char == '"':
                    self._in_string = False
                continue
            if char == '"':
                self._in_string = True
            elif char in "{[":
                # An object directly inside the array of the outermost object is one item.
                if char == "{" and self._stack == ["{", "["]:
                    self._object_start = index
                self._stack.append(char)
            elif char in "}]" and self._stack:
                self._stack.pop()
                if char == "}" and self._stack == ["{", "["] and self._object_start is not None:
                    item = self._parse("".join(self._buffer[self._object_start : index + 1]))
                    self._object_start = None
                    if item is not None:
                        yield item

    @staticmethod
    def _parse(text: str) -> dict[str, Any] | None:
        try:
            value = json.loads(text)
        except json.JSONDecodeError:
            return None
        return value if isinstance(value, dict) else None
