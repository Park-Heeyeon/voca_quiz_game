import { useModalStore } from "@/shared/store/modalStore";
import useModal from "@/shared/lib/useModal";
import ModalLayout from "./ModalLayout";

const ModalProvider: React.FC = () => {
  const modals = useModalStore((s) => s.modals);
  const { closeModal } = useModal();

  return (
    <>
      {modals.map((modal, idx) => {
        const isBottomModal = idx === 0;
        return (
          <div key={modal.id} className="modal-wrapper">
            {isBottomModal && (
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
