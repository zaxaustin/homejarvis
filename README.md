# J.A.R.V.I.S. - Just A Rather Very Intelligent System

## About

This project is a modular, extensible personal assistant that runs locally on your desktop. It uses a local Large Language Model (LLM) through Ollama to understand and respond to user queries, and can be extended with a variety of tools to perform different tasks.

## Features

*   **Conversational AI:** Chat with J.A.R.V.I.S. in natural language.
*   **Weather:** Get the current weather for any city.
*   **Reminders:** Set and view reminders.
*   **Web Search:** Search Wikipedia for up-to-date information.
*   **Vision:** Analyze a screenshot of your desktop to answer questions about what you're looking at.

## Architecture

The project is built with a modular architecture, making it easy to understand, maintain, and extend:

*   `main.py`: The main execution logic for the agent.
*   `toolkit.py`: Defines the tools the agent can use.
*   `memory.py`: Manages the agent's conversational memory.

## Setup

### 1. Prerequisites

*   **Python 3:** Make sure you have Python 3 installed on your system.
*   **Ollama:** This project requires Ollama to run the local LLM. You can download it from [https://ollama.ai/](https://ollama.ai/).

### 2. Install Ollama and Models

Once Ollama is installed, you'll need to pull the models for the agent to use.

*   **For text-based tasks,** we recommend `llama3.2:3b` for a good balance of performance and resource usage:
    ```bash
    ollama run llama3.2:3b
    ```
*   **For vision-related tasks (analyzing images),** you will also need to pull the `llava` model:
    ```bash
    ollama run llava
    ```

### 3. Clone and Set Up the Project

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/jarvis.git
    cd jarvis
    ```

2.  **Create a virtual environment:**
    ```bash
    python3 -m venv .venv
    source .venv/bin/activate
    ```

3.  **Install the dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

## Usage

To start the assistant, run the following command:

```bash
python3 main.py
```

You can then chat with J.A.R.V.I.S. in the terminal. To exit, type `exit`.

### Using the Vision Feature

To have J.A.R.V.I.S. analyze your desktop, follow these steps:

1.  Take a screenshot of your screen.
2.  Save the screenshot as `desktop.png` in the root of the project directory.
3.  Ask J.A.R.V.I.S. a question about it, for example:
    *   "What's on my desktop?"
    *   "Can you read the text in the open window?"
    *   "Describe the image I'm looking at."

## Extending

To add a new skill to J.A.R.V.I.S., you can create a new function in `toolkit.py` and decorate it with `@tool`. The function's docstring will be used to describe the tool to the LLM, so make sure it's clear and descriptive.
