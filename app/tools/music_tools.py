import requests

from .mood_to_genre import MOOD_TO_GENRE

from typing import Any, Dict, List, Optional, Set


def _pick_unique_tracks(tracks: List[Dict[str, Any]], exclude_ids: Set[int], n: int = 5) -> List[Dict[str, Any]]:
    """
    Helper: pick up to n tracks that are not in exclude_ids.
    Uses Deezer track "id" as unique identifier.
    """
    picked: List[Dict[str, Any]] = []
    for t in tracks:
        tid = t.get("id")
        if tid is None:
            continue
        if tid in exclude_ids:
            continue
        picked.append(t)
        exclude_ids.add(tid)
        if len(picked) == n:
            break
    return picked


def search_music_api(
        query: str,
        exclude_track_ids: Optional[List[int]] = None,
        n: int = 5,
        page_size: int = 50,
        start_index: int = 0,
        max_pages: int = 5,
) -> Dict[str, Any]:
    """
    Performs a general search on Deezer API with the given query string.
    Returns a dictionary with status, tracks list, and formatted HTML response.

    Enhancements:
    - History-aware filtering via exclude_track_ids (avoid repeats).
    - Continuation via start_index (for "more songs" -> next results).
    - Pagination to ensure we can still return n unique tracks after filtering.
    """
    exclude_ids: Set[int] = set(exclude_track_ids or [])
    selected: List[Dict[str, Any]] = []
    index = start_index

    try:
        for _ in range(max_pages):
            url = "https://api.deezer.com/search"
            response = requests.get(
                url,
                params={"q": query, "limit": page_size, "index": index},
                timeout=10,
            )
            response.raise_for_status()
            data = response.json()

            tracks: List[Dict[str, Any]] = data.get("data", [])
            if not tracks:
                break

            need = n - len(selected)
            selected.extend(_pick_unique_tracks(tracks, exclude_ids, need))

            if len(selected) >= n:
                break

            # Not enough new tracks after filtering -> go to next page
            index += page_size

    except requests.RequestException:
        return {
            "status": "error",
            "error_message": "Sorry, I couldn't process your request right now. Please try again later.",
        }

    if not selected:
        return {
            "status": "error",
            "error_message": "Sorry, no new songs found matching your search (after filtering repeats).",
        }

    formatted_response = format_tracks_response(selected)

    return {
        "status": "success",
        "tracks": selected,  # IMPORTANT: return only the chosen n tracks
        "selected_track_ids": [t.get("id") for t in selected if t.get("id") is not None],
        "query": query,
        "next_index": index + page_size,  # where to continue next time
        "response_text": formatted_response,
    }


def search_by_artist(
        artist_name: str,
        exclude_track_ids: Optional[List[int]] = None,
        n: int = 5,
        page_size: int = 50,
        start_index: int = 0,
) -> Dict[str, Any]:
    """
    Searches by artist name:
    1) First resolves/normalizes artist name using Deezer /search/artist
    2) Then performs a track search using query artist:"<corrected_name>"
    Supports:
    - exclude_track_ids (avoid repeats)
    - start_index (continue for "more")
    """
    url = f"https://api.deezer.com/search/artist?q={artist_name}"
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        data = response.json()
        if data.get("data"):
            corrected_name = data["data"][0].get("name")
            query = f'artist:"{corrected_name}"'
            result = search_music_api(
                query,
                exclude_track_ids=exclude_track_ids,
                n=n,
                page_size=page_size,
                start_index=start_index,
            )
            # keep context for the agent
            result["context"] = {"type": "artist", "value": corrected_name}
            return result

        return {
            "status": "error",
            "error_message": f"Sorry, I couldn't find an artist matching '{artist_name}'.",
        }

    except requests.RequestException:
        return {"status": "error", "error_message": "Network or API error occurred."}


def search_by_genre(
        genre: str,
        exclude_track_ids: Optional[List[int]] = None,
        n: int = 5,
        page_size: int = 50,
        start_index: int = 0,
) -> Dict[str, Any]:
    """
    Search songs by genre using Deezer API.

    Args:
        genre (str): Genre to search for.

    Returns:
        dict: Status, list of selected tracks (n), and formatted HTML string.
    """
    query = f'genre:"{genre}"'
    result = search_music_api(
        query,
        exclude_track_ids=exclude_track_ids,
        n=n,
        page_size=page_size,
        start_index=start_index,
    )
    result["context"] = {"type": "genre", "value": genre}
    return result


def search_by_mood(
        mood: str,
        exclude_track_ids: Optional[List[int]] = None,
        n: int = 5,
        page_size: int = 50,
        start_index: int = 0,
) -> Dict[str, Any]:
    """
    Search songs by mood keyword. This is a general search and less precise than artist or genre search.

    Args:
        mood (str): Mood keyword to search for.

    Returns:
        dict: Status, list of selected tracks (n), and formatted HTML string.
    """
    mood_normalized = mood.strip().lower()
    result = search_music_api(
        mood_normalized,
        exclude_track_ids=exclude_track_ids,
        n=n,
        page_size=page_size,
        start_index=start_index,
    )
    result["context"] = {"type": "mood", "value": mood_normalized}
    return result


def search_by_mood_with_genre_fallback(
        mood: str,
        exclude_track_ids: Optional[List[int]] = None,
        n: int = 5,
        page_size: int = 50,
        start_index: int = 0,
) -> Dict[str, Any]:
    """
    Search songs by mood with genre inference fallback.
    Uses MOOD_TO_GENRE mapping to convert mood to genre and tries genre search first.
    If genre search fails to find results, falls back to general mood search.

    Args:
        mood (str): Mood keyword to search for.

    Returns:
        dict: Status, list of selected tracks (n), and formatted HTML string.
    """
    mood_normalized = mood.strip().lower()
    genre = MOOD_TO_GENRE.get(mood_normalized)

    if genre:
        genre_result = search_by_genre(
            genre,
            exclude_track_ids=exclude_track_ids,
            n=n,
            page_size=page_size,
            start_index=start_index,
        )
        if genre_result.get("status") == "success" and genre_result.get("tracks"):
            return genre_result

    return search_by_mood(
        mood_normalized,
        exclude_track_ids=exclude_track_ids,
        n=n,
        page_size=page_size,
        start_index=start_index,
    )


def search_by_track(
        track_title: str,
        exclude_track_ids: Optional[List[int]] = None,
        n: int = 5,
        page_size: int = 50,
        start_index: int = 0,
) -> Dict[str, Any]:
    """
    Search songs by a specific track title using Deezer API.

    Args:
        track_title (str): Track title (or partial title) to search for.

    Returns:
        dict: Status, list of selected tracks (n), and formatted HTML string.
        :param track_title:
        :param exclude_track_ids:
    """
    title_normalized = track_title.strip()
    # Deezer supports searching by plain query; we can bias to track title using: track:"..."
    query = f'track:"{title_normalized}"'

    result = search_music_api(
        query,
        exclude_track_ids=exclude_track_ids,
        n=n,
        page_size=page_size,
        start_index=start_index,
    )

    # Keep context for the agent (internal use)
    result["context"] = {"type": "track", "value": title_normalized}
    return result


def format_tracks_response(tracks: List[Dict[str, Any]]) -> str:
    """
    Formats *already-selected* tracks into an HTML  design table.
    Note: selection (next 5 + history filtering) should happen BEFORE calling this function.
    """
    if not tracks:
        return "<p>Sorry, I couldn't find any songs for your request.</p>"

    response_text = """
<p>Here are some songs for you:</p>
<table border="1" cellpadding="5" cellspacing="0" style="border-collapse: collapse;">
    <thead>
        <tr>
            <th>Title</th>
            <th>Artist</th>
            <th>Link</th>
        </tr>
    </thead>
    <tbody>
"""

    for track in tracks:
        title = track.get("title", "Unknown Title")
        artist = track.get("artist", {}).get("name", "Unknown Artist")
        link = track.get("link", "#")

        response_text += f"""
        <tr>
            <td>{title}</td>
            <td>{artist}</td>
            <td><a href="{link}" target="_blank" rel="noopener noreferrer">Listen</a></td>
        </tr>
"""

    response_text += """
    </tbody>
</table>
"""
    return response_text
