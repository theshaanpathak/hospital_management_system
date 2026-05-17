from groq import Groq

client = Groq(api_key="")

response = client.chat.completions.create(
    model="llama-3.1-8b-instant",
    messages=[
        {"role": "user", "content": "What are OPD timings?"}
    ]
)

print(response.choices[0].message.content)
