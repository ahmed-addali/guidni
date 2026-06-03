from qdrant_client.models import Filter, FieldCondition, MatchValue, MatchAny, MatchText, Range, MinShould

def _dict_to_qdrant_filter(filters: dict) -> Filter:
    must_conditions = []
    should_conditions = []
    must_not_conditions = []

    def parse_condition(cond: dict) -> FieldCondition:
        key = cond.get("key")
        if not key:
            raise ValueError("Condition must have a 'key'")
        
        if "match" in cond:
            return FieldCondition(key=key, match=MatchValue(value=cond["match"]))
        elif "any" in cond:
            return FieldCondition(key=key, match=MatchAny(any=cond["any"]))
        elif "text" in cond:
            return FieldCondition(key=key, match=MatchText(text=cond["text"]))
        elif "lte" in cond or "gte" in cond:
            r = Range()
            if "lte" in cond:
                r.lte = cond["lte"]
            if "gte" in cond:
                r.gte = cond["gte"]
            return FieldCondition(key=key, range=r)
        else:
            raise ValueError(f"Unknown condition type for key {key}: {cond}")

    for cond in filters.get("must", []):
        must_conditions.append(parse_condition(cond))
        
    for cond in filters.get("should", []):
        should_conditions.append(parse_condition(cond))
        
    for cond in filters.get("must_not", []):
        must_not_conditions.append(parse_condition(cond))

    min_should = None
    if should_conditions:
        min_should = MinShould(conditions=should_conditions, min_count=1)

    return Filter(
        must=must_conditions if must_conditions else None,
        should=None,  # Typically should in Qdrant means "AT LEAST ONE OF", but we use min_should for better control sometimes, wait, Qdrant Filter accepts `should` as a list.
        must_not=must_not_conditions if must_not_conditions else None,
        min_should=min_should
    )

print(_dict_to_qdrant_filter({"must": [{"key": "price", "lte": 100}]}))
