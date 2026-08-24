import { useModalStore } from "@/shared/store/modalStore";
import ModalLayout from "./ModalLayout";
import useModal from "@/utils/useModal";

const ModalProvider: React.FC = () => {
  const modals = useModalStore((state) => state.modals);
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
                    modal.clickEvent(); // 클릭 이벤트가 있을 경우 호출
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
