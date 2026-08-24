// 라우트 청크를 받는 잠깐 동안만 보인다. 부팅 스플래시와 달리 화면을 덮지 않는다.
const PageLoader = () => (
  <div className="min-h-screen grid place-items-center">
    <span
      role="status"
      aria-label="불러오는 중"
      className="inline-block w-8 h-8 rounded-full border-[3px] border-brand-soft border-t-brand animate-spin"
    />
  </div>
);

export default PageLoader;
