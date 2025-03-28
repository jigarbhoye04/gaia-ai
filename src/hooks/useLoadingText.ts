"use client";
import { useDispatch, useSelector } from "react-redux";

import { resetLoadingText,setLoadingText } from "@/redux/slices/loadingTextSlice";
import { AppDispatch, RootState } from "@/redux/store";

export const useLoadingText = () => {
    const dispatch: AppDispatch = useDispatch();
    const loadingText = useSelector((state: RootState) => state.loadingText.loadingText);

    const updateLoadingText = (text: string) => {
        dispatch(setLoadingText(text));
    };

    const resetText = () => {
        dispatch(resetLoadingText());
    };

    return {
        loadingText,
        setLoadingText: updateLoadingText,
        resetLoadingText: resetText,
    };
};