
# skills/reminders.py
# A simple, session-based reminder system for J.A.R.V.I.S.

_reminders = []

def set_reminder(reminder_text: str):
    """
    Adds a reminder to the session's list.
    """
    _reminders.append(reminder_text)
    return f"Very well, Sir. I will remind you to '{reminder_text}'."

def get_reminders():
    """
    Retrieves all reminders for the current session.
    """
    if not _reminders:
        return "You have no reminders pending, Sir. A rare moment of clarity, perhaps?"
    
    response = "Here are your pending reminders, Sir:\n"
    for i, reminder in enumerate(_reminders, 1):
        response += f"{i}. {reminder}\n"
    return response.strip()

