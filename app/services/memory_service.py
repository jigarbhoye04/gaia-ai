"""Memory service layer for handling all memory operations."""

import asyncio
from typing import Any, Dict, List, Optional

from app.config.loggers import llm_logger as logger
from app.memory.client import get_memory_client
from app.models.memory_models import (
    MemoryEntry,
    MemorySearchResult,
    MemoryRelation,
)


class MemoryService:
    """Service class for managing memory operations."""

    def __init__(self):
        """Initialize the memory service."""
        self.client = get_memory_client()
        self.logger = logger

    def _validate_user_id(self, user_id: Optional[str]) -> Optional[str]:
        """
        Validate and return user_id.

        Args:
            user_id: User identifier

        Returns:
            Validated user_id or None
        """
        if not user_id:
            self.logger.warning("No user_id provided for memory operation")
            return None

        # Handle different user_id formats
        if isinstance(user_id, dict):
            # If user_id is accidentally a user object
            user_id = user_id.get("user_id") or user_id.get("id")

        return str(user_id) if user_id else None

    def _parse_memory_result(self, result: Dict[str, Any]) -> Optional[MemoryEntry]:
        """
        Parse a single memory result from Mem0 API response.

        Args:
            result: Memory result dictionary

        Returns:
            MemoryEntry or None if parsing fails
        """
        if not isinstance(result, dict):
            self.logger.warning(f"Expected dict, got {type(result)}: {result}")
            return None

        # Handle both memory structure formats
        content = (
            result.get("memory") or result.get("text") or result.get("content", "")
        )

        if not content:
            self.logger.warning(f"No content found in memory result: {result}")
            return None

        try:
            # Extract all the fields that match the output structure
            memory_entry = MemoryEntry(
                id=result.get("id"),
                content=content,
                user_id=result.get("user_id", ""),
                metadata=result.get("metadata") or {},
                categories=result.get("categories", []),
                created_at=result.get("created_at"),
                updated_at=result.get("updated_at"),
                expiration_date=result.get("expiration_date"),
                internal_metadata=result.get("internal_metadata"),
                deleted_at=result.get("deleted_at"),
                relevance_score=result.get("score") or result.get("relevance_score"),
            )

            self.logger.debug(f"Successfully parsed memory: {memory_entry.id}")
            return memory_entry

        except Exception as e:
            self.logger.error(
                f"Error creating MemoryEntry from data: {e}, raw data: {result}"
            )
            return None

    def _parse_memory_list(
        self, memories: List[Dict[str, Any]], user_id: str
    ) -> List[MemoryEntry]:
        """
        Parse a list of memory results.

        Args:
            memories: List of memory dictionaries
            user_id: User ID to associate with memories

        Returns:
            List of MemoryEntry objects
        """
        parsed_memories = []
        for memory_data in memories:
            try:
                if memory_entry := self._parse_memory_result(memory_data):
                    memory_entry.user_id = user_id
                    parsed_memories.append(memory_entry)
            except Exception as e:
                self.logger.warning(f"Failed to parse memory: {e}")
                continue

        self.logger.debug(
            f"Successfully parsed {len(parsed_memories)}/{len(memories)} memories"
        )
        return parsed_memories

    def _extract_memories_from_response(self, response: Any) -> List[Dict[str, Any]]:
        """
        Extract memories list from various response formats.

        Args:
            response: API response in various formats

        Returns:
            List of memory dictionaries
        """
        if isinstance(response, list):
            return response

        if isinstance(response, dict):
            # Check for 'memories' key (v1.1 format with graph data)
            if "memories" in response:
                return response["memories"]

            # Check for 'results' key (standard format)
            if "results" in response:
                return response["results"]

            # Check if response itself is a single memory
            if "id" in response and ("memory" in response or "content" in response):
                return [response]

        self.logger.warning(f"Unexpected response format: {type(response)}")
        return []

    def _extract_relationships_from_response(
        self, response: Any
    ) -> List[Dict[str, Any]]:
        """
        Extract relationships list from API response.

        Args:
            response: API response in various formats

        Returns:
            List of relationship dictionaries
        """
        if isinstance(response, dict) and "relations" in response:
            return response.get("relations", [])
        return []

    def _parse_relationships(
        self, relations: List[Dict[str, Any]]
    ) -> List[MemoryRelation]:
        """
        Parse relationships from Mem0 API response.

        Args:
            relations: List of relationship dictionaries

        Returns:
            List of MemoryRelation objects
        """
        parsed_relations = []
        for relation_data in relations:
            try:
                relation = MemoryRelation(
                    source=relation_data.get("source", ""),
                    source_type=relation_data.get("source_type", ""),
                    relationship=relation_data.get("relationship", ""),
                    target=relation_data.get("target", ""),
                    target_type=relation_data.get("target_type", ""),
                )
                parsed_relations.append(relation)
            except Exception as e:
                self.logger.warning(f"Failed to parse relationship: {e}")
                continue

        self.logger.debug(
            f"Successfully parsed {len(parsed_relations)}/{len(relations)} relationships"
        )
        return parsed_relations

    async def store_memory(
        self,
        content: str,
        user_id: Optional[str],
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Optional[MemoryEntry]:
        """
        Store a single memory.

        Args:
            content: Memory content to store
            user_id: User identifier
            metadata: Additional metadata

        Returns:
            MemoryEntry if successful, None otherwise
        """
        user_id = self._validate_user_id(user_id)
        if not user_id:
            return None

        try:
            # Store as a simple user message for mem0 to infer memory from
            # Use asyncio.to_thread to run synchronous Mem0 client in thread pool
            result = await asyncio.to_thread(
                self.client.add,
                messages=[{"role": "user", "content": content}],
                user_id=user_id,
                metadata=metadata or {},
                infer=True,
            )

            self.logger.info(f"Memory stored for user {user_id}")

            # Mem0 cloud API returns a dict with 'results' array
            if not isinstance(result, dict) or "results" not in result:
                self.logger.warning(f"Unexpected response format from mem0: {result}")
                return None

            results = result.get("results", [])
            if not results:
                return None

            # Get the first result (usually only one when inferring)
            first_result = results[0]

            # Use the standardized parsing method for consistency
            memory_entry = self._parse_memory_result(first_result)

            # Ensure the user_id is set correctly
            if memory_entry:
                memory_entry.user_id = user_id
                # If the memory doesn't have content, use the original content
                if not memory_entry.content:
                    memory_entry.content = content
                # Ensure metadata is preserved
                if not memory_entry.metadata and metadata:
                    memory_entry.metadata = metadata

            return memory_entry

        except Exception as e:
            self.logger.error(f"Error storing memory: {e}")
            return None

    async def search_memories(
        self,
        query: str,
        user_id: Optional[str],
        limit: int = 5,
    ) -> MemorySearchResult:
        """
        Search for relevant memories.

        Args:
            query: Search query
            user_id: User identifier
            limit: Maximum number of results

        Returns:
            MemorySearchResult with matching memories
        """
        user_id = self._validate_user_id(user_id)
        if not user_id:
            return MemorySearchResult()

        try:
            results = await asyncio.to_thread(
                self.client.search,
                query=query,
                user_id=user_id,
                limit=limit,
            )

            memories = self._parse_memory_list(memories=results, user_id=user_id)

            return MemorySearchResult(
                memories=memories,
                total_count=len(memories),
                page=1,
                page_size=limit,
            )

        except Exception as e:
            self.logger.error(f"Error searching memories: {e}")
            return MemorySearchResult()

    async def get_all_memories(
        self,
        user_id: Optional[str],
        page: int = 1,
        page_size: int = 10,
    ) -> MemorySearchResult:
        """
        Get all memories for a user with pagination.

        Args:
            user_id: User identifier
            page: Page number
            page_size: Results per page

        Returns:
            MemorySearchResult with user's memories
        """
        user_id = self._validate_user_id(user_id)
        if not user_id:
            return MemorySearchResult()

        try:
            response = await asyncio.to_thread(
                self.client.get_all,
                enable_graph=True,
                user_id=user_id,
                output_format="v1.1",
            )

            memories_list = self._extract_memories_from_response(response)

            # Extract relationships from response (if available)
            relations_list = self._extract_relationships_from_response(response)

            logger.info(relations_list)

            # Parse memories and relationships
            memory_entries = self._parse_memory_list(memories_list, user_id)
            relationships = self._parse_relationships(relations_list)

            # Calculate pagination
            start_index = (page - 1) * page_size
            end_index = start_index + page_size
            paginated_memories = memory_entries[start_index:end_index]

            self.logger.info(
                f"Successfully processed {len(memory_entries)} memories and {len(relationships)} relationships for user {user_id}, "
                f"returning page {page} ({len(paginated_memories)} items)"
            )

            return MemorySearchResult(
                memories=paginated_memories,
                relations=relationships,
                total_count=len(memory_entries),
                page=page,
                page_size=page_size,
                has_next=end_index < len(memory_entries),
            )

        except Exception as e:
            self.logger.error(f"Error retrieving all memories: {e}")
            return MemorySearchResult()

    async def delete_memory(self, memory_id: str, user_id: Optional[str]) -> bool:
        """
        Delete a specific memory.

        Args:
            memory_id: Memory identifier
            user_id: User identifier (for validation only)

        Returns:
            True if successful, False otherwise
        """
        user_id = self._validate_user_id(user_id)
        if not user_id:
            return False

        try:
            # Mem0 cloud API doesn't require user_id for delete
            await asyncio.to_thread(self.client.delete, memory_id=memory_id)
            self.logger.info(f"Memory {memory_id} deleted for user {user_id}")
            return True

        except Exception as e:
            self.logger.error(f"Error deleting memory {memory_id}: {e}")
            return False


# Create singleton instance
memory_service = MemoryService()
