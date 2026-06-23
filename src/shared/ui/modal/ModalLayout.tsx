import React from "react";
import { FaTimes } from "react-icons/fa";
import { Button } from "../Button";
import useModal from "@/shared/lib/useModal";
import type { ModalItem } from "@/shared/store/modalStore";

const ModalLayout: React.FC<ModalItem> = ({
  type,
  title,
  content,
  id,
  clickEvent,
}) => {
  const { closeModal } = useModal();

  const onClickConfirm = () => {
    closeModal(id);
    if (clickEvent) {
      clickEvent();
    }
  };

  return (
    <div className="w-full bg-gray-50 border-gray-300 flex flex-col text-center p-8 rounded-2xl shadow-md gap-4 mx-auto">
      {type === "login" && (
        <FaTimes
          className="cursor-pointer text-muted self-end"
          onClick={() => closeModal(id)}
        />
      )}
      {title && (
        <h1 className="font-bold text-xl text-customDepGrayColor">{title}</h1>
      )}
      {typeof content === "string" ? (
        <p>{content}</p>
      ) : (
        React.cloneElement(content, { clickEvent })
      )}
      {type === "confirm" && (
        <Button className="mx-auto" onClick={onClickConfirm}>
          확인
        </Button>
      )}
    </div>
  );
};

export default ModalLayout;
