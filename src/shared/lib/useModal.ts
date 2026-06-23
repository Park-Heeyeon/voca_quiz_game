import { useModalStore, type ModalItem } from "@/shared/store/modalStore";

const useModal = () => {
  const open = useModalStore((s) => s.open);
  const close = useModalStore((s) => s.close);
  const closeAll = useModalStore((s) => s.closeAll);

  const openModal = (modal: Omit<ModalItem, "id">) => open(modal);
  const closeModal = (id?: string) => close(id);
  const closeAllModal = () => closeAll();

  return { openModal, closeModal, closeAllModal };
};

export default useModal;
