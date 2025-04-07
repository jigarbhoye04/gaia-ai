from typing import Any, Callable, Dict, AsyncGenerator, Sequence, Union, TypeVar

T = TypeVar("T")


class Pipeline:
    def __init__(self, steps: Sequence[Callable[[Dict[str, Any]], Any]]):
        """
        Initialize the pipeline with a list of async step functions.

        Args:
            steps (List[Callable[[Dict[str, Any]], Any]]): The sequence of pipeline steps.
        """
        self.steps = steps

    async def run(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Execute each step sequentially, passing the modified data along.

        Args:
            data (Dict[str, Any]): Initial data for the pipeline.

        Returns:
            Dict[str, Any]: The data after processing all steps.
        """
        for step in self.steps:
            data = await self._execute_step(step, data)
        return data

    async def run_with_yield(
        self, data: Dict[str, Any]
    ) -> AsyncGenerator[Union[Dict[str, Any], T], None]:
        """
        Execute each step sequentially, yielding intermediate results during processing.

        This allows for streaming output from any step that yields content.

        Args:
            data (Dict[str, Any]): Initial data for the pipeline.

        Yields:
            Union[Dict[str, Any], T]: Intermediate results or final processed data.
        """
        for step in self.steps:
            result = await self._execute_step(step, data)

            # If the result is an async generator, yield its contents
            if hasattr(result, "__aiter__"):
                async for item in result:
                    yield item
                # Update data with the last result if possible
                if isinstance(data, dict) and hasattr(result, "get_context"):
                    data = await result.get_context()
            else:
                # If the result is not a generator, update data
                data = result

        # Return the final context
        yield data

    async def _execute_step(
        self, step: Callable[[Dict[str, Any]], Any], data: Dict[str, Any]
    ) -> Dict[str, Any]:
        try:
            return await step(data)
        except Exception as e:
            raise RuntimeError(f"Error in step {step.__name__}: {e}") from e
