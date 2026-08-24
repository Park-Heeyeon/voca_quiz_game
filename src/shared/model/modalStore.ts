import { ReactElement } from "react";
import { create } from "zustand";

// 모달의 상태 모양이므로 ui가 아니라 model에 둔다. ui에 두면 model과 서로를 참조한다.
export interface ModalStateType {
  id?: string;
  type?: "custom" | "confirm" | "login";
  content: string | ReactElement<{ clickEvent?: () => void }>;
  title?: string;
  clickEvent?: () => void;
}

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
