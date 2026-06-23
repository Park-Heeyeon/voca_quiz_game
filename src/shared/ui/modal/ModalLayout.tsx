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
    <div className="w-full bg-white border border-line rounded-card shadow-card p-7 flex flex-col gap-4 animate-pop-in">
      {(title || type === "login") && (
        <div className="flex items-center justify-between">
          <h1 className="font-display font-bold text-xl text-ink">
            {title}
          </h1>
          {type === "login" && (
            <button
              aria-label="닫기"
              className="grid place-items-center w-8 h-8 rounded-full text-ink-soft hover:bg-cloud transition"
              onClick={() => closeModal(id)}
            >
              <FaTimes />
            </button>
          )}
        </div>
      )}

      {typeof content === "string" ? (
        <p className="text-center text-ink-soft leading-relaxed">{content}</p>
      ) : (
        React.cloneElement(content, { clickEvent })
      )}

      {type === "confirm" && (
        <Button className="w-full" onClick={onClickConfirm}>
          확인
        </Button>
      )}
    </div>
  );
};

export default ModalLayout;
