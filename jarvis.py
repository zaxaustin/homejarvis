
# J.A.R.V.I.S. - Just A Rather Very Intelligent System
# Core Application

from skills.weather import get_weather_for_city
from skills.reminders import set_reminder, get_reminders

def main():
    """The main loop for the J.A.R.V.I.S. application."""
    print("J.A.R.V.I.S. is online. How may I be of service, Sir?")

    while True:
        command_input = input("> ").lower().strip()
        
        if command_input.startswith("remind me to "):
            reminder_text = command_input[13:] # Get the text after "remind me to "
            response = set_reminder(reminder_text)
            print(response)
            continue

        parts = command_input.split(" ", 1)
        command = parts[0]
        
        if command == "exit":
            print("Logging off. Do try not to set anything on fire while I'm away.")
            break
            
        elif command == "weather":
            if len(parts) > 1:
                city = parts[1]
                weather_report = get_weather_for_city(city)
                print(weather_report)
            else:
                print("Of course, Sir. For which city shall I retrieve the weather report?")
        
        elif command == "reminders":
            response = get_reminders()
            print(response)

        else:
            print("I'm sorry, Sir, I'm not yet equipped to handle that request.")

if __name__ == "__main__":
    main()
