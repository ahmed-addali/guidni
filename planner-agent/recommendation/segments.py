"""
Context segmentation — builds segment keys from destination + user context.

Simplified approach:
  - Global segment: just the destination (e.g. "djerba")
  - User segment: destination + userId (e.g. "djerba_u:abc123")

Time/season was removed because users browse to plan future trips,
not for immediate consumption. A user at 11pm may be booking a morning
activity for next week.
"""


def build_segment_key(destination_id: str) -> str:
    """
    Build a global context segment key.
    All anonymous users (and cold-start fallback) use this.

    Example: "djerba"
    """
    return destination_id


def build_user_segment_key(destination_id: str, user_id: str) -> str:
    """
    Build a user-specific segment key.
    Each logged-in user gets their own arms in this segment.

    Example: "djerba_u:cm12abc..."
    """
    return f"{destination_id}_u:{user_id}"
