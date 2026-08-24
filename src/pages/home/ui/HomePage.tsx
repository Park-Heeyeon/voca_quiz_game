import UserHome from "./UserHome";
import VisitorHome from "./VisitorHome";
import { useAuthStore } from "@/shared/model/authStore";

const HomePage: React.FC = () => {
  const isLoggedIn = useAuthStore((state) => !!state.accessToken);

  return (
    <div className="mx-auto w-full max-w-md px-4">
      {isLoggedIn ? <UserHome /> : <VisitorHome />}
    </div>
  );
};

export default HomePage;
