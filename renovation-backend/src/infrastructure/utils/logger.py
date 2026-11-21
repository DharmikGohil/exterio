"""Application logger. Use this instead of print()."""

import logging
import sys

LOGGER_NAME = "renovation"


def configure_logging(level: str = "INFO") -> None:
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(logging.Formatter("%(asctime)s %(levelname)s %(name)s %(message)s"))
    root = logging.getLogger(LOGGER_NAME)
    root.handlers = [handler]
    root.setLevel(level.upper())
    root.propagate = False


logger = logging.getLogger(LOGGER_NAME)
