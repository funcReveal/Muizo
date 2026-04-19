import { STORAGE_KEYS } from "@domain/room/constants";

export const getStoredQuestionCount = () => {
  const saved = Number(localStorage.getItem(STORAGE_KEYS.questionCount));
  return Number.isFinite(saved) ? saved : null;
};

export const setStoredQuestionCount = (value: number) =>
  localStorage.setItem(STORAGE_KEYS.questionCount, String(value));
