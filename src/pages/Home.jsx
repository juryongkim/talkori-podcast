import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 md:px-8">
      {/* 애플 특유의 거대한 볼드체 헤더 */}
      <h1 className="text-4xl font-extrabold tracking-tight mb-8">둘러보기</h1>
      
      <div className="mb-10">
        <h2 className="text-2xl font-bold tracking-tight mb-4 border-b border-gray-100 pb-2">추천 코너</h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Real Reaction 앨범 카드 */}
          <Link to="/course/real-reaction" className="group block">
            <div className="aspect-square bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-md mb-3 flex flex-col justify-end p-4 transition-transform transform group-hover:scale-[1.02]">
              <span className="text-3xl mb-1">😲</span>
              <h3 className="text-white font-bold leading-tight">Real<br/>Reaction</h3>
            </div>
            <h3 className="text-sm font-bold text-gray-900 group-hover:underline">리얼 리액션</h3>
            <p className="text-xs text-gray-500 mt-0.5">Talkori Original</p>
          </Link>

          {/* K-Pop 카드 (준비 중) */}
          <div className="group block opacity-50">
            <div className="aspect-square bg-gradient-to-br from-pink-400 to-rose-500 rounded-2xl shadow-md mb-3 flex flex-col justify-end p-4">
              <span className="text-3xl mb-1">🎵</span>
              <h3 className="text-white font-bold leading-tight">K-Pop<br/>Korean</h3>
            </div>
            <h3 className="text-sm font-bold text-gray-900">K-Pop 한국어</h3>
            <p className="text-xs text-gray-500 mt-0.5">Coming Soon</p>
          </div>
        </div>
      </div>
    </div>
  );
}