import { create } from "zustand";
import type { ReactElement } from "react";
import { v4 as uuidv4 } from "uuid";

export type ModalItem = {
  id: string;
  type?: "custom" | "confirm" | "login";
  title?: string;
  content: string | ReactElement<{ clickEvent?: () => void }>;
  clickEvent?: () => void;
};

type ModalState = {
  modals: ModalItem[];
  open: (modal: Omit<ModalItem, "id">) => void;
  close: (id?: string) => void;
  closeAll: () => void;
};

export const useModalStore = create<ModalState>((set) => ({
  modals: [],
  open: (modal) =>
    set((state) => {
      document.body.style.overflow = "hidden";
      const newModal: ModalItem = {
        type: "confirm",
        ...modal,
        id: uuidv4(),
      };
      return { modals: [...state.modals, newModal] };
    }),
  close: (id) =>
    set((state) => {
      if (!id) return state;
      const modals = state.modals.filter((m) => m.id !== id);
      if (modals.length === 0) document.body.style.overflow = "unset";
      return { modals };
    }),
  closeAll: () => {
    document.body.style.overflow = "unset";
    set({ modals: [] });
  },
}));
