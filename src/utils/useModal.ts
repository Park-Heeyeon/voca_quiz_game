import { modalState } from "@/atom/modalState";
import { ModalStateType } from "@/types";
import { useSetRecoilState } from "recoil";
import { v4 as uuidv4 } from "uuid"; // uuid 패키지에서 uuidv4를 임포트

const useModal = () => {
  const setModals = useSetRecoilState(modalState);

  const openModal = ({
    type = "confirm",
    title,
    content,
    clickEvent,
  }: ModalStateType) => {
    const newModal = { id: uuidv4(), type, title, content, clickEvent };

    setModals((prev) => [...prev, newModal]);
  };

  const closeModal = (id?: string) => {
    if (!id) return;
    setModals((prev) => prev.filter((item) => item.id !== id));
  };

  const closeAllModal = () => {
    setModals([]);
  };

  return { openModal, closeModal, closeAllModal };
};
export default useModal;
