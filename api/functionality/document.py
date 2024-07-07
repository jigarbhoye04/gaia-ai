import PyPDF2
import io


def convert_pdf_to_text(pdf_file):
    text:str = ''
    pdf_reader = PyPDF2.PdfReader(io.BytesIO(pdf_file))
    for page_num in range(len(pdf_reader.pages)):
        text += pdf_reader.pages[page_num].extract_text()
    return text
