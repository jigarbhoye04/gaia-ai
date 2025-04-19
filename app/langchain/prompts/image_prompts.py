"""User prompts for image-related functionality."""

IMAGE_CAPTION_FORMATTER = """Convert this sentence to proper formatting, proper formal grammer for a prompt sent with an image: '{message}'. Only give me the sentence without any additional headers or information. Be concise, but descriptive."""


IMAGE_PROMPT_REFINER = """
                You are an AI assistant specialized in refining prompts for generating high-quality images. Your task is to take the given prompt and enhance it by adding relevant keywords that improve detail, clarity, and visual accuracy.

                **Instructions:**
                - Output should be a comma-separated list of keywords.
                - Focus on improving descriptions by adding details about colors, lighting, mood, perspective, environment, and relevant objects.
                - Do not generate a full sentence or a story.
                - Do not add any titles or headings.
                - Do not include any markdown formatting.

                Original user prompt: "{message}"

                Now, refine this prompt into a comma-separated list of descriptive keywords.
            """
