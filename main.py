# main.py - Agent Runner and main execution logic

import ollama
import json
from memory import TrimmingSession
from toolkit import _tools

# --- System Prompt ---
# This prompt guides the LLM to use the tools correctly.
SYSTEM_PROMPT = """
You are J.A.R.V.I.S., a helpful and intelligent assistant.

You have access to the following tools. When you believe a tool is necessary to answer a user's question, you must respond in the following format, with the arguments as a valid JSON object:

TOOL: <tool_name>('{<json_arguments>}')

For example, to get the weather in London, you would respond with:

TOOL: get_weather_for_city('{"city_name": "London"}')

Here are the available tools:

{tools}

If you can answer the user's question without using a tool, you should respond directly in a conversational manner.
"""

def get_tools_prompt():
    """Formats the tool descriptions for the system prompt."""
    tool_docs = ""
    for name, tool in _tools.items():
        tool_docs += f"- {name}: {tool.__doc__}\n"
    return SYSTEM_PROMPT.format(tools=tool_docs)

class LocalAgent:
    def __init__(self, model_name="llama3.2:3b"):
        self.client = ollama.Client()
        self.model = model_name
        self.memory = TrimmingSession()
        print(f"Agent initialized with model: {self.model}")

    def process_query(self, user_query):
        self.memory.add_message("user", user_query)

        while True:
            messages = [{"role": "system", "content": get_tools_prompt()}] + self.memory.get_context()

            response = self.client.chat(model=self.model, messages=messages)
            assistant_response = response['message']['content']

            if assistant_response.strip().startswith("TOOL:"):
                tool_call = assistant_response.strip()[5:]
                tool_name = tool_call.split("(")[0]

                try:
                    # Safely parse the arguments using JSON
                    arg_str = tool_call[len(tool_name)+1:-1]
                    args = json.loads(arg_str)

                    tool_result = _tools[tool_name](**args)
                    self.memory.add_message("assistant", f"TOOL: {tool_name}('{json.dumps(args)}')")
                    self.memory.add_message("user", f"TOOL_RESULT: {tool_result}")
                except Exception as e:
                    self.memory.add_message("user", f"TOOL_ERROR: {e}")
            else:
                self.memory.add_message("assistant", assistant_response)
                return assistant_response

# --- Main Execution Block ---
if __name__ == "__main__":
    agent = LocalAgent()
    print("J.A.R.V.I.S. is online. How may I be of service, Sir?")
    while True:
        query = input("> ")
        if query.lower().strip() == "exit":
            print("Logging off. Do try not to set anything on fire while I'm away.")
            break
        answer = agent.process_query(query)
        print(f"<- J.A.R.V.I.S.: {answer}")
