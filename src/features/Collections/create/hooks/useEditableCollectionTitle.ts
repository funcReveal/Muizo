import { useCallback, useState } from "react";

type EditableCollectionTitleState = {
  title: string;
  draft: string;
  isEditing: boolean;
};

const normalizeTitle = (value: string) => value.trim();

export function useEditableCollectionTitle(initialTitle = "") {
  const normalizedInitialTitle = normalizeTitle(initialTitle);

  const [state, setState] = useState<EditableCollectionTitleState>({
    title: normalizedInitialTitle,
    draft: normalizedInitialTitle,
    isEditing: false,
  });

  const setTitle = useCallback((value: string) => {
    setState((current) => ({
      ...current,
      title: value,
      draft: value,
    }));
  }, []);

  const setDraft = useCallback((value: string) => {
    setState((current) => ({
      ...current,
      draft: value,
    }));
  }, []);

  const startEdit = useCallback(() => {
    setState((current) => ({
      ...current,
      draft: current.title,
      isEditing: true,
    }));
  }, []);

  const save = useCallback(() => {
    setState((current) => {
      const nextTitle = normalizeTitle(current.draft);

      if (!nextTitle) {
        return {
          ...current,
          draft: current.title,
          isEditing: false,
        };
      }

      return {
        title: nextTitle,
        draft: nextTitle,
        isEditing: false,
      };
    });
  }, []);

  const cancel = useCallback(() => {
    setState((current) => ({
      ...current,
      draft: current.title,
      isEditing: false,
    }));
  }, []);

  const reset = useCallback(() => {
    setState({
      title: "",
      draft: "",
      isEditing: false,
    });
  }, []);

  const initializeIfEmpty = useCallback((value: string) => {
    const nextTitle = normalizeTitle(value);
    if (!nextTitle) return;

    setState((current) => {
      if (current.title.trim()) return current;

      return {
        title: nextTitle,
        draft: nextTitle,
        isEditing: false,
      };
    });
  }, []);

  return {
    title: state.title,
    draft: state.draft,
    isEditing: state.isEditing,
    setTitle,
    setDraft,
    startEdit,
    save,
    cancel,
    reset,
    initializeIfEmpty,
  };
}
