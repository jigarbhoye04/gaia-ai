def split_text_into_chunks(text, chunk_size=300, overlap=30):
    """
    Splits text into chunks of `chunk_size` with an `overlap` between chunks.
    """
    words = text.split()
    chunks = []
    for i in range(0, len(words), chunk_size - overlap):
        chunk = " ".join(words[i : i + chunk_size])
        chunks.append(chunk)
    return chunks
