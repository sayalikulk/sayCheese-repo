import { api } from "./api";
import { locationDate } from "./weather";

export async function getRecommendation({ date, activity, mood, location, currentTime, timezone }) {
  return await api.post("/recommendations", {
    date: date || locationDate(currentTime, timezone),
    activity,
    mood,
    location,
  });
}