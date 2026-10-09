from datetime import date


SLOT_PLAN: tuple[tuple[str, bool], ...] = (
    ("physical", False),
    ("learning", False),
    ("social", False),
    ("creative", True),
    ("habit", True),
)


def stable_number(value: str) -> int:
    result = 0
    for character in value:
        result = (result * 31 + ord(character)) & 0xFFFFFFFF
    return result


def pick_daily_missions(
    child_id: str,
    mission_date: date | str,
    templates: list[dict],
) -> list[dict]:
    """Pick the same five missions as the frontend for a child and date."""
    date_text = mission_date.isoformat() if isinstance(mission_date, date) else mission_date
    used: set[str] = set()
    selected_missions: list[dict] = []

    for slot, (area, _is_bonus) in enumerate(SLOT_PLAN):
        candidates = sorted(
            (
                template
                for template in templates
                if template.get("area") == area and str(template.get("id")) not in used
            ),
            key=lambda template: str(template.get("id")),
        )
        if not candidates:
            continue

        selected = candidates[stable_number(f"{child_id}:{date_text}:{slot}") % len(candidates)]
        template_id = str(selected["id"])
        used.add(template_id)
        is_bonus = bool(selected.get("is_bonus", False))
        selected_missions.append(
            {
                "mission_date": date_text,
                "slot": slot,
                "template_id": template_id,
                "title_snapshot": selected["title"],
                "description_snapshot": selected["description"],
                "area": selected["area"],
                "estimated_minutes": selected["estimated_minutes"],
                "is_bonus": is_bonus,
                "status": "assigned",
                "points": 5 if is_bonus else 10,
            }
        )

    return selected_missions
