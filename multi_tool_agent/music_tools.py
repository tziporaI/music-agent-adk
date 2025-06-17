import requests
from .mood_to_genre import MOOD_TO_GENRE


def search_music_api(query: str) -> dict:
    """
    Performs a general search on Deezer API with the given query string.
    Returns a dictionary with status, tracks list, and formatted HTML response.
    """
    url = f"https://api.deezer.com/search?q={query}"
    try:
        response = requests.get(url)
        response.raise_for_status()
        data = response.json()
    except requests.RequestException:
        return {
            "status": "error",
            "error_message": "Sorry, I couldn't process your request right now. Please try again later."
        }

    tracks = data.get("data", [])
    if not tracks:
        return {
            "status": "error",
            "error_message": "Sorry, no songs found matching your search."
        }

    formatted_response = format_tracks_response(tracks)
    return {
        "status": "success",
        "tracks": tracks,
        "response_text": formatted_response
    }


def search_by_artist(artist_name: str) -> dict:
    url = f"https://api.deezer.com/search/artist?q={artist_name}"
    try:
        response = requests.get(url)
        response.raise_for_status()
        data = response.json()
        if data.get("data"):
            corrected_name = data["data"][0].get("name")
            query = f'artist:"{corrected_name}"'
            return search_music_api(query)
        else:
            return {
                "status": "error",
                "error_message": f"Sorry, I couldn't find an artist matching '{artist_name}'."
            }
    except requests.RequestException:
        return {
            "status": "error",
            "error_message": "Network or API error occurred."
        }


def search_by_genre(genre: str) -> dict:
    """
    Search songs by genre using Deezer API.

    Args:
        genre (str): Genre to search for.

    Returns:
        dict: Status, list of tracks, and formatted HTML string.
    """
    query = f'genre:"{genre}"'
    return search_music_api(query)


def search_by_mood(mood: str) -> dict:
    """
    Search songs by mood keyword. This is a general search and less precise than artist or genre search.

    Args:
        mood (str): Mood keyword to search for.

    Returns:
        dict: Status, list of tracks, and formatted HTML string.
    """
    mood_normalized = mood.strip().lower()
    return search_music_api(mood_normalized)


def search_by_mood_with_genre_fallback(mood: str) -> dict:
    """
    Search songs by mood with genre inference fallback.
    Uses MOOD_TO_GENRE mapping to convert mood to genre and tries genre search first.
    If genre search fails to find results, falls back to general mood search.

    Args:
        mood (str): Mood keyword to search for.

    Returns:
        dict: Status, list of tracks, and formatted HTML string.
    """
    mood_normalized = mood.strip().lower()
    genre = MOOD_TO_GENRE.get(mood_normalized)

    if genre:
        genre_result = search_by_genre(genre)
        if genre_result.get("status") == "success" and genre_result.get("tracks"):
            return genre_result

    return search_by_mood(mood_normalized)


def format_tracks_response(tracks):
    if not tracks:
        return "<p>Sorry, I couldn't find any songs for your request.</p>"

    artist_name = tracks[0].get("artist", {}).get("name", "this artist")

    response_text = f"""
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

    count = 0
    for track in tracks:
        if count >= 5:
            break

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
        count += 1

    response_text += """
    </tbody>
</table>
"""
    return response_text
