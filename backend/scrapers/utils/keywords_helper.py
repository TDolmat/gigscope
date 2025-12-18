"""
Keywords filtering helper for scrapers.
Provides functions to filter offers based on keyword criteria.
"""

from typing import List, Dict, Any, Optional


def parse_keywords(keywords_string: str) -> List[str]:
    """Parse comma-separated keywords string into a list."""
    if not keywords_string:
        return []
    return [k.strip() for k in keywords_string.split(",") if k.strip()]


def filter_offers(
    offers: List[Dict[str, Any]],
    must_include: Optional[List[str]] = None,
    may_include: Optional[List[str]] = None,
    must_not_include: Optional[List[str]] = None
) -> List[Dict[str, Any]]:
    """
    Filter offers based on keyword criteria.
    
    Args:
        offers: List of offer dicts with 'title' and 'description' keys
        must_include: Keywords that ALL must be present in title or description
        may_include: Keywords where at least ONE should be present (used when must_include is empty)
        must_not_include: Keywords that NONE should be present in title or description
    
    Returns:
        Filtered list of offers
    """
    must_include = must_include or []
    may_include = may_include or []
    must_not_include = must_not_include or []
    
    filtered = []
    for offer in offers:
        text = f"{offer.get('title', '')} {offer.get('description', '') or ''}".lower()
        
        # Check must_include (ALL required)
        if must_include:
            if not all(kw.lower() in text for kw in must_include):
                continue
        
        # Check may_include (at least ONE required) - only if must_include is empty
        if may_include and not must_include:
            if not any(kw.lower() in text for kw in may_include):
                continue
        
        # Check must_not_include (NONE allowed)
        if must_not_include:
            if any(kw.lower() in text for kw in must_not_include):
                continue
        
        filtered.append(offer)
    
    return filtered


def deduplicate_offers(offers: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Remove duplicate offers by URL."""
    unique = {offer['url']: offer for offer in offers}
    return list(unique.values())

