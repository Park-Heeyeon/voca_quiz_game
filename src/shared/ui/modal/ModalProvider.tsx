import { useModalStore } from "@/shared/store/modalStore";
import useModal from "@/shared/lib/useModal";
import ModalLayout from "./ModalLayout";
import { isOverlayTarget } from "./overlayTarget";

const ModalProvider: React.FC = () => {
  const modals = useModalStore((s) => s.modals);
  const { closeModal } = useModal();

  return (
    <>
      {modals.map((modal, idx) => {
        const isTopModal = isOverlayTarget(idx, modals.length);
        return (
          <div key={modal.id} className="modal-wrapper">
            {isTopModal && (
              <div
                className="modal-overlay"
                onClick={() => {
                  closeModal(modal.id);
                  if (modal.clickEvent) {
                    modal.clickEvent();
                  }
                }}
              />
            )}
            <div className="modal-content w-3/4 max-w-[350px]">
              <ModalLayout {...modal} />
            </div>
          </div>
        );
      })}
    </>
  );
};

export default ModalProvider;
