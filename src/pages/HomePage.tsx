import { useUserStore } from "@/shared/store/userStore";
import { UserHome, VisitorHome } from "@/features/home";

const HomePage: React.FC = () => {
  const isLoggedIn = useUserStore((s) => s.isLoggedIn);
  return (
    <div className="mx-auto w-full max-w-xs sm:max-w-sm md:max-w-md">
      {isLoggedIn ? <UserHome /> : <VisitorHome />}
    </div>
  );
};

export default HomePage;
