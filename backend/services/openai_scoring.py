"""
OpenAI service for scoring offers based on user preferences.
"""
import json
import random
from typing import List, Dict, Any, Optional
from dataclasses import dataclass


@dataclass
class OfferScore:
    """Score for a single offer"""
    fit_score: float  # 0-10: How well it matches keywords/preferences
    attractiveness_score: float  # 0-10: Budget, client quality, etc.
    overall_score: float  # 0-10: Combined score


DEFAULT_SCORING_PROMPT = """Jesteś ekspertem w ocenie ofert pracy dla freelancerów. Oceń każdą ofertę na podstawie następujących kryteriów:

**Słowa kluczowe użytkownika:**
- Musi zawierać: {must_contain}
- Może zawierać: {may_contain}
- Nie może zawierać: {must_not_contain}

**Dla każdej oferty zwróć 3 oceny w skali 0-10:**
1. **fit_score** (Dopasowanie): Jak dobrze oferta pasuje do podanych słów kluczowych i preferencji
2. **attractiveness_score** (Atrakcyjność): Jak atrakcyjna jest oferta (budżet, jakość klienta, klarowność opisu)
3. **overall_score** (Ocena ogólna): Średnia ważona powyższych z naciskiem na dopasowanie

**Format odpowiedzi:**
Zwróć JSON array z obiektami dla każdej oferty w tej samej kolejności:
[
  {{"offer_index": 0, "fit_score": 8.5, "attractiveness_score": 7.0, "overall_score": 8.0}},
  {{"offer_index": 1, "fit_score": 6.0, "attractiveness_score": 9.0, "overall_score": 7.0}},
  ...
]

**Oferty do oceny:**
{offers_json}

Odpowiedz TYLKO poprawnym JSON array, bez żadnego dodatkowego tekstu."""


def score_offers_with_openai(
    offers: List[Dict[str, Any]],
    must_contain: List[str],
    may_contain: List[str],
    must_not_contain: List[str],
    api_key: str,
    custom_prompt: Optional[str] = None,
) -> List[OfferScore]:
    """
    Score offers using OpenAI API.
    
    Args:
        offers: List of offer dictionaries with title, description, etc.
        must_contain: Required keywords
        may_contain: Optional keywords
        must_not_contain: Excluded keywords
        api_key: OpenAI API key
        custom_prompt: Custom scoring prompt (uses default if not provided)
    
    Returns:
        List of OfferScore objects in the same order as input offers
    """
    if not api_key:
        raise ValueError("OpenAI API key is required")
    
    if not offers:
        return []
    
    try:
        import openai
        client = openai.OpenAI(api_key=api_key)
    except ImportError:
        raise ImportError("openai package is not installed. Run: pip install openai")
    
    # Prepare offers for the prompt (simplified version)
    offers_for_prompt = []
    for i, offer in enumerate(offers):
        offers_for_prompt.append({
            "index": i,
            "title": offer.get("title", ""),
            "description": offer.get("description", "")[:500],  # Truncate long descriptions
            "budget": offer.get("budget", "N/A"),
            "platform": offer.get("platform", "unknown"),
            "client_location": offer.get("client_location", "N/A"),
        })
    
    # Build the prompt
    prompt_template = custom_prompt or DEFAULT_SCORING_PROMPT
    prompt = prompt_template.format(
        must_contain=", ".join(must_contain) if must_contain else "brak",
        may_contain=", ".join(may_contain) if may_contain else "brak",
        must_not_contain=", ".join(must_not_contain) if must_not_contain else "brak",
        offers_json=json.dumps(offers_for_prompt, ensure_ascii=False, indent=2)
    )
    
    try:
        response = client.chat.completions.create(
            model="gpt-4.1-mini",
            messages=[
                {"role": "system", "content": "Jesteś asystentem oceniającym oferty pracy. Odpowiadasz tylko w formacie JSON."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
            max_tokens=2000,
        )
        
        # Parse the response
        content = response.choices[0].message.content.strip()
        
        # Clean up the response if it has markdown code blocks
        if content.startswith("```"):
            content = content.split("```")[1]
            if content.startswith("json"):
                content = content[4:]
        content = content.strip()
        
        scores_data = json.loads(content)
        
        # Convert to OfferScore objects
        scores = []
        for score_item in scores_data:
            scores.append(OfferScore(
                fit_score=float(score_item.get("fit_score", 5.0)),
                attractiveness_score=float(score_item.get("attractiveness_score", 5.0)),
                overall_score=float(score_item.get("overall_score", 5.0)),
            ))
        
        # Ensure we have scores for all offers
        while len(scores) < len(offers):
            scores.append(OfferScore(fit_score=5.0, attractiveness_score=5.0, overall_score=5.0))
        
        return scores[:len(offers)]
        
    except json.JSONDecodeError as e:
        print(f"Error parsing OpenAI response: {e}")
        # Return default scores on error
        return [OfferScore(fit_score=5.0, attractiveness_score=5.0, overall_score=5.0) for _ in offers]
    except Exception as e:
        print(f"OpenAI API error: {e}")
        raise


def score_offers_mock(
    offers: List[Dict[str, Any]],
    must_contain: List[str],
    may_contain: List[str],
    must_not_contain: List[str],
) -> List[OfferScore]:
    """
    Mock scoring for testing without OpenAI API calls.
    Generates semi-random scores based on simple keyword matching.
    """
    scores = []
    
    for offer in offers:
        title = offer.get("title", "").lower()
        description = offer.get("description", "").lower()
        text = f"{title} {description}"
        
        # Calculate fit score based on keyword presence
        fit_score = 5.0  # Base score
        
        # Boost for must_contain keywords
        for keyword in must_contain:
            if keyword.lower() in text:
                fit_score += 1.5
        
        # Small boost for may_contain keywords
        for keyword in may_contain:
            if keyword.lower() in text:
                fit_score += 0.5
        
        # Penalty for must_not_contain keywords
        for keyword in must_not_contain:
            if keyword.lower() in text:
                fit_score -= 2.0
        
        # Clamp to 0-10
        fit_score = max(0.0, min(10.0, fit_score))
        
        # Random attractiveness (simulating budget/client quality evaluation)
        attractiveness_score = random.uniform(4.0, 9.0)
        
        # Overall is weighted average
        overall_score = (fit_score * 0.6 + attractiveness_score * 0.4)
        
        # Add some randomness
        overall_score += random.uniform(-0.5, 0.5)
        overall_score = max(0.0, min(10.0, overall_score))
        
        scores.append(OfferScore(
            fit_score=round(fit_score, 1),
            attractiveness_score=round(attractiveness_score, 1),
            overall_score=round(overall_score, 1),
        ))
    
    return scores


def select_offers_with_diversity(
    scored_offers: List[Dict[str, Any]],
    max_offers: int,
) -> List[Dict[str, Any]]:
    """
    Select top offers while ensuring platform diversity.
    
    Args:
        scored_offers: List of offers with scores, each having 'platform' and 'overall_score'
        max_offers: Maximum number of offers to select
    
    Returns:
        List of selected offers, maintaining diversity across platforms
    """
    if not scored_offers:
        return []
    
    if len(scored_offers) <= max_offers:
        return scored_offers
    
    # Group offers by platform
    by_platform = {}
    for offer in scored_offers:
        platform = offer.get("platform", "unknown")
        if platform not in by_platform:
            by_platform[platform] = []
        by_platform[platform].append(offer)
    
    # Sort each platform's offers by overall score
    for platform in by_platform:
        by_platform[platform].sort(key=lambda x: x.get("overall_score", 0), reverse=True)
    
    selected = []
    platforms = list(by_platform.keys())
    
    # First pass: ensure at least one offer from each platform (if they have matching offers)
    for platform in platforms:
        if by_platform[platform] and len(selected) < max_offers:
            selected.append(by_platform[platform].pop(0))
    
    # Second pass: fill remaining slots with top-scored offers across all platforms
    remaining_offers = []
    for platform in platforms:
        remaining_offers.extend(by_platform[platform])
    
    remaining_offers.sort(key=lambda x: x.get("overall_score", 0), reverse=True)
    
    for offer in remaining_offers:
        if len(selected) >= max_offers:
            break
        selected.append(offer)
    
    # Sort final selection by overall score
    selected.sort(key=lambda x: x.get("overall_score", 0), reverse=True)
    
    return selected

