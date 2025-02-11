import asyncio
from transformers import pipeline
import spacy
from dotenv import load_dotenv
from sumy.parsers.plaintext import PlaintextParser
from sumy.nlp.tokenizers import Tokenizer
from sumy.summarizers.lsa import LsaSummarizer
import nltk

load_dotenv()


def split_text_into_chunks(text, chunk_size=250, overlap=30):
    """
    Splits text into chunks of `chunk_size` with an `overlap` between chunks.
    """
    words = text.split()
    chunks = []
    for i in range(0, len(words), chunk_size - overlap):
        chunk = " ".join(words[i : i + chunk_size])
        chunks.append(chunk)
    return chunks


# Load the zero-shot classification pipeline
zero_shot_classifier = pipeline(
    "zero-shot-classification", model="MoritzLaurer/bge-m3-zeroshot-v2.0"
)

candidate_labels = [
    "add to calendar",
    "set a reminder",
    "send email",
    "generate image",
    "search internet",
    "flowchart",
    "weather",
    "other",
]

candidate_labels_output = ["i don't know this", "i know this"]


def classify_event_type(user_input):
    return classify_text(user_input, candidate_labels)


def classify_output(user_input):
    return classify_text(user_input, candidate_labels_output)


# Async wrapper for the blocking Hugging Face pipeline call
async def classify_text(user_input, candidate_labels):
    if not user_input or not candidate_labels:
        return {"error": "Invalid input or candidate labels."}

    try:
        # Use asyncio.to_thread to run the blocking pipeline function in a separate thread
        result = await asyncio.to_thread(
            zero_shot_classifier, user_input, candidate_labels
        )

        label_scores = dict(zip(result["labels"], result["scores"]))
        highest_label = max(label_scores, key=label_scores.get)

        return {
            "label_scores": label_scores,
            "highest_label": highest_label,
            "highest_score": label_scores[highest_label],
        }
    except Exception as e:
        return {"error": str(e)}


#! Named Entity Recognition

# Load the spaCy model
# python - m spacy download en_core_web_sm
# nlp = spacy.load("en_core_web_sm")


# def parse_calendar_info(input_text):
#     doc = nlp(input_text)

#     time = "all day"
#     date = "today"

#     for ent in doc.ents:
#         if ent.label_ == "TIME":
#             time = ent.text
#         elif ent.label_ == "DATE":
#             date = ent.text

#     return {"time": time, "date": date}


def summarise_text(long_text):
    nltk.download("punkt")
    parser = PlaintextParser.from_string(long_text, Tokenizer("english"))
    summarizer = LsaSummarizer()
    summary = summarizer(parser.document, 4)
    short_text = "".join(str(sentence) for sentence in summary)
    print(short_text)
    return short_text


# Example to run the function asynchronously
async def main():
    result = await classify_event_type(
        "Can you find a time for my meeting and send me a reminder?"
    )

    summarise_text("""The lion (Panthera leo) is a large cat of the genus Panthera, native to Africa and India. It has a muscular, broad-chested body; a short, rounded head; round ears; and a hairy tuft at the end of its tail. It is sexually dimorphic; adult male lions are larger than females and have a prominent mane. It is a social species, forming groups called prides. A lion's pride consists of a few adult males, related females, and cubs. Groups of female lions usually hunt together, preying mostly on large ungulates. The lion is an apex and keystone predator; although some lions scavenge when opportunities occur and have been known to hunt humans, lions typically do not actively seek out and prey on humans.

    The lion inhabits grasslands, savannahs, and shrublands. It is usually more diurnal than other wild cats, but when persecuted, it adapts to being active at night and at twilight. During the Neolithic period, the lion ranged throughout Africa and Eurasia, from Southeast Europe to India, but it has been reduced to fragmented populations in sub-Saharan Africa and one population in western India. It has been listed as Vulnerable on the IUCN Red List since 1996 because populations in African countries have declined by about 43% since the early 1990s. Lion populations are untenable outside designated protected areas. Although the cause of the decline is not fully understood, habitat loss and conflicts with humans are the greatest causes for concern.

    One of the most widely recognised animal symbols in human culture, the lion has been extensively depicted in sculptures and paintings, on national flags, and in literature and films. Lions have been kept in menageries since the time of the Roman Empire and have been a key species sought for exhibition in zoological gardens across the world since the late 18th century. Cultural depictions of lions were prominent in Ancient Egypt, and depictions have occurred in virtually all ancient and medieval cultures in the lion's historic and current range.

    """)

    print(result)


if __name__ == "__main__":
    asyncio.run(main())
