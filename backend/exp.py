import os
import openai
# from dotenv import load_dotenv

# # Load environment variables from .env file (if using)
# load_dotenv()

# Set up your API key
# It's recommended to store your API key as an environment variable
openai.api_key = os.getenv("OPENAI_API_KEY")  # or directly: openai.api_key = "your-api-key"

def get_openai_response(user_input):
    """
    Send a prompt to OpenAI API with a system message and user input
    """
    try:
        # Create the messages array with system and user messages
        messages = [
            {"role": "system", "content": "You are a good guy who is helpful, ethical, and friendly."},
            {"role": "user", "content": user_input}
        ]
        
        # Call the OpenAI API
        response = openai.chat.completions.create(
            model="gpt-4",  # You can use different models like "gpt-3.5-turbo"
            messages=messages,
            max_tokens=500,
            temperature=0.7
        )
        
        # Extract and return the response content
        return response.choices[0].message.content
    
    except Exception as e:
        return f"An error occurred: {str(e)}"

# Example usage
if __name__ == "__main__":
    while True:
        user_question = input("Enter your question: ")
        answer = get_openai_response(user_question)
        print("\nResponse:")
        print(answer)