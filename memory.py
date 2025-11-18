# memory.py - Memory management classes

from collections import deque

class TrimmingSession:
    """
    Manages conversational history with a rolling window, keeping the last 'N' turns.
    """
    def __init__(self, max_turns=5):
        """
        Initializes the session to keep the last `max_turns` of conversation.
        A "turn" consists of a user message and an assistant response.
        """
        # A deque is used for efficient appends and pops from both ends.
        self.history = deque(maxlen=max_turns * 2) # Storing user and assistant messages separately
        print(f"TrimmingSession initialized to keep the last {max_turns} turns.")

    def add_message(self, role: str, content: str):
        """
        Adds a message to the conversation history.
        """
        self.history.append({"role": role, "content": content})

    def get_context(self):
        """
        Returns the current conversational context as a list of messages.
        """
        return list(self.history)
