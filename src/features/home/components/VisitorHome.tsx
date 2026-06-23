import { useNavigate } from "react-router-dom";
import LogoImg from "@public/images/logo_img.png";
import { Button } from "@/shared/ui";
import useModal from "@/shared/lib/useModal";
import { LoginModal } from "@/features/auth";

const VisitorHome: React.FC = () => {
  const navigate = useNavigate();
  const { openModal } = useModal();

  return (
    <>
      <div className="img-container flex justify-center mt-40 md:mt-32">
        <img src={LogoImg} alt="Main Logo" className="w-full h-auto max-h-80" />
      </div>
      <div className="btn-container mt-10 flex flex-col items-center gap-2">
        <Button
          className="w-[70%]"
          onClick={() =>
            openModal({
              type: "login",
              title: "Login",
              content: <LoginModal />,
            })
          }
        >
          로그인
        </Button>
        <Button
          variant="secondary"
          className="w-[70%]"
          onClick={() => navigate("/signup")}
        >
          회원가입
        </Button>
      </div>
    </>
  );
};

export default VisitorHome;
