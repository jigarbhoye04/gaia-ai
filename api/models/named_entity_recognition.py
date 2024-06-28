import spacy
from dotenv import load_dotenv
load_dotenv()

#! Named Entity Recognition

# Load the spaCy model
# python - m spacy download en_core_web_sm
nlp = spacy.load('en_core_web_sm')


def parse_calendar_info(input_text):
    doc = nlp(input_text)

    time = "all day"
    date = "today"

    for ent in doc.ents:
        if ent.label_ == 'TIME':
            time = ent.text
        elif ent.label_ == 'DATE':
            date = ent.text

    return {"time": time, "date": date}
