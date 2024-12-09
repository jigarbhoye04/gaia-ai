import PyPDF2
import io


def convert_pdf_to_text(pdf_file, max_chars=5500):
    text = ""
    pdf_reader = PyPDF2.PdfReader(io.BytesIO(pdf_file))

    for page_num in range(len(pdf_reader.pages)):
        text += pdf_reader.pages[page_num].extract_text()

        # Optional: Check if text exceeds max_chars and truncate if necessary
        if max_chars and len(text) > max_chars:
            text = text[:max_chars]
            break

    return text
