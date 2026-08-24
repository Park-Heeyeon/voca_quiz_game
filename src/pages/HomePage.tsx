import { useRecoilValue } from "recoil";
import { isLoggedInState } from "@/atom/isLoggedInState";
import { UserHome, VisitorHome } from "@/components";

const HomePage: React.FC = () => {
  const isLoggedIn = useRecoilValue(isLoggedInState);

  return (
    <div className="mx-auto w-full max-w-md px-4">
      {isLoggedIn ? <UserHome /> : <VisitorHome />}
    </div>
  );
};

export default HomePage;
