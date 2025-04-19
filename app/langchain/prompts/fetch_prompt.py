FETCH_PROMPT = """
You have been provided with information extracted from the following URLs:
{urls}

--- Begin Extracted Web Content ---
{page_content}
--- End of Extracted Content ---

Use this content to answer the user's query with high factual accuracy. You must adhere to the following instructions:

1. **Use the extracted content as the primary source of truth**. Do not hallucinate or fabricate information.
2. **Maintain a neutral, unbiased, and objective tone** in your response.
3. **Cite your sources clearly and consistently** using markdown-style links, e.g., [1](https://example.com).
4. If multiple URLs are referenced, **enumerate the citations** (e.g., [1], [2], etc.) and match them to the respective links.
5. Avoid including raw content directly unless quoting; **summarize or paraphrase** where appropriate.
6. Do not mention GAIA Webpage Fetch or internal tool names in your answer. The response should appear natural to the user.
7. If the fetched content is insufficient or irrelevant, explicitly mention that more information is needed.

Use this information responsibly to generate an informed, clear, and source-backed response to the user.
"""
