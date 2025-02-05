# import asyncio
# from sentence_transformers import SentenceTransformer


# class EmbeddingModel:
#     _model = None

#     @classmethod
#     async def get_model(cls):
#         if cls._model is None:
#             loop = asyncio.get_event_loop()
#             cls._model = await loop.run_in_executor(
#                 None, SentenceTransformer, "all-MiniLM-L6-v2"
#             )
#         return cls._model


from sentence_transformers import SentenceTransformer


class EmbeddingModel:
    _model = None

    @classmethod
    def get_model(cls):
        if cls._model is None:
            cls._model = SentenceTransformer("all-MiniLM-L6-v2")
        return cls._model
