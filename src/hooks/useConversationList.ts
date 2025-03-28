import { useDispatch, useSelector } from "react-redux";

import {
  fetchConversations,
  type PaginationMeta,
} from "@/redux/slices/conversationsSlice";
import type { AppDispatch, RootState } from "@/redux/store";
import { useCallback } from "react";

export const useConversationList = () => {
  const conversations = useSelector(
    (state: RootState) => state.conversations.conversations,
  );
  const loading = useSelector(
    (state: RootState) => state.conversations.loading,
  );
  const error = useSelector((state: RootState) => state.conversations.error);
  const paginationMeta = useSelector(
    (state: RootState) => state.conversations.paginationMeta,
  ) as PaginationMeta | null;

  return { conversations, loading, error, paginationMeta };
};

export const useFetchConversations = () => {
  const dispatch: AppDispatch = useDispatch();

  return useCallback(
    async (
      page: number = 1,
      limit: number = 20,
      append: boolean = true,
    ) => {
      return dispatch(fetchConversations({ page, limit, append }));
    },
    [dispatch]
  );
};