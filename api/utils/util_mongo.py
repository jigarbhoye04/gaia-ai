def serialize_document(doc):
    doc['_id'] = str(doc['_id'])  # Convert ObjectId to string
    return doc


def serialize_message(message: MessageModel) -> dict:
    message_dict = {
        "type": message.type,
        "response": message.response,
        "date": message.date.isoformat() if message.date else None,
        "loading": message.loading,
        # Add other fields as needed
    }
    return message_dict
