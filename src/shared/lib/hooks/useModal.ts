import { v4 as uuidv4 } from "uuid";
import { useModalStore } from "@/shared/model/modalStore";
import { ModalStateType } from "@/shared/model/modalStore";

// 스크롤 잠금은 부수효과라 store가 아니라 훅에서 다룬다.
const lockScroll = () => {
  document.body.style.overflow = "hidden";
};

const unlockScroll = () => {
  document.body.style.overflow = "unset";
};

const useModal = () => {
  const addModal = useModalStore((state) => state.addModal);
  const removeModal = useModalStore((state) => state.removeModal);
  const clearModals = useModalStore((state) => state.clearModals);

  const openModal = ({
    type = "confirm",
    title,
    content,
    clickEvent,
  }: ModalStateType) => {
    lockScroll();
    addModal({ id: uuidv4(), type, title, content, clickEvent });
  };

  const closeModal = (id?: string) => {
    if (!id) return;

    removeModal(id);
    if (useModalStore.getState().modals.length === 0) unlockScroll();
  };

  const closeAllModal = () => {
    clearModals();
    unlockScroll();
  };

  return { openModal, closeModal, closeAllModal };
};

export default useModal;
