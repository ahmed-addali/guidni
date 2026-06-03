from app.schemas.requests import UserPreferences
prefs = UserPreferences(user_id="user_123", destinationId="cmonnw3kr0000i04asq31gi8a", destinationName="Djerba", destinationCity="Djerba")
print(f"Destination ID: {prefs.destination_id}")
