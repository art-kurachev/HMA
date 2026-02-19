from pydantic import BaseModel


class FeedbackRequest(BaseModel):
    telegram_id: int
    mix_db_id: int
    rating: bool
    reason: str
