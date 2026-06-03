from app.schemas.requests import UserPreferences
prefs = UserPreferences(user_id="user_123", destination_id="cmonnw3kr0000i04asq31gi8a", destination_name="Djerba", destination_city="Djerba")
print(f"Destination ID: {prefs.destination_id}")
