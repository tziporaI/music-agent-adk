import json
from datetime import datetime, timezone
import google.cloud.storage as storage


def _now_iso():
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


class MemoryStore:
    def __init__(self, storage_client: storage.Client, bucket_name: str, prefix: str = "music_memory/"):
        self.client = storage_client
        self.bucket = self.client.bucket(bucket_name)
        self.prefix = prefix.rstrip("/") + "/"

    def _blob(self, session_id: str):
        return self.bucket.blob(f"{self.prefix}{session_id}.json")

    def load(self, session_id: str) -> dict:
        blob = self._blob(session_id)
        if not blob.exists():
            return {
                "seen_track_ids": [],
                "last_context": None,
                "last_query": None,
                "next_index": 0,
                "updated_at": _now_iso(),
            }

        raw = blob.download_as_text(encoding="utf-8")
        try:
            return json.loads(raw)
        except json.JSONDecodeError:
            return {
                "seen_track_ids": [],
                "last_context": None,
                "last_query": None,
                "next_index": 0,
                "updated_at": _now_iso(),
            }

    def save(self, session_id: str, mem: dict) -> None:
        mem["updated_at"] = _now_iso()
        blob = self._blob(session_id)
        blob.upload_from_string(
            json.dumps(mem, ensure_ascii=False),
            content_type="application/json; charset=utf-8",
        )
