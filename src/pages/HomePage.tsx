import { UserHome, VisitorHome } from "@/components";
import { useAuthStore } from "@/shared/store/authStore";

const HomePage: React.FC = () => {
  const isLoggedIn = useAuthStore((state) => !!state.accessToken);

  return (
    <div className="mx-auto w-full max-w-md px-4">
      {isLoggedIn ? <UserHome /> : <VisitorHome />}
    </div>
  );
};

export default HomePage;
