from typing import Any, Callable, Dict, List


class Pipeline:
    def __init__(self, steps: List[Callable[[Dict[str, Any]], Any]]):
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

    async def _execute_step(
        self, step: Callable[[Dict[str, Any]], Any], data: Dict[str, Any]
    ) -> Dict[str, Any]:
        try:
            return await step(data)
        except Exception as e:
            raise RuntimeError(f"Error in step {step.__name__}: {e}") from e
