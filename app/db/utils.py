def serialize_document(document: dict) -> dict:
    """
    Serialize a MongoDB document by converting the '_id' field to a string.

    Args:
        document (dict): The MongoDB document.

    Returns:
        dict: The serialized document with an 'id' field as a string.
    """
    document["id"] = str(document.pop("_id"))
    return document
