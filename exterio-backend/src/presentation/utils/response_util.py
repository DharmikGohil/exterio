"""Serialisation helpers for values that do not go through a response schema."""

from dataclasses import fields, is_dataclass
from enum import Enum
from typing import Any

from pydantic.alias_generators import to_camel


def to_camel_json(value: Any) -> Any:
    """Recursively convert dataclasses, enums and containers to camelCase JSON."""
    if is_dataclass(value) and not isinstance(value, type):
        return {
            to_camel(field.name): to_camel_json(getattr(value, field.name))
            for field in fields(value)
        }
    if isinstance(value, Enum):
        return value.value
    if isinstance(value, dict):
        return {to_camel(str(key)): to_camel_json(item) for key, item in value.items()}
    if isinstance(value, (list, tuple, set, frozenset)):
        return [to_camel_json(item) for item in value]
    return value
