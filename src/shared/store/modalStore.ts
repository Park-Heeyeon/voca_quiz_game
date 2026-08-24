import { create } from "zustand";
import { ModalStateType } from "@/types";

interface ModalStore {
  modals: ModalStateType[];
  addModal: (modal: ModalStateType) => void;
  removeModal: (id: string) => void;
  clearModals: () => void;
}

export const useModalStore = create<ModalStore>((set) => ({
  modals: [],
  addModal: (modal) => set((state) => ({ modals: [...state.modals, modal] })),
  removeModal: (id) =>
    set((state) => ({ modals: state.modals.filter((m) => m.id !== id) })),
  clearModals: () => set({ modals: [] }),
}));
