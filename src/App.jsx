import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import CourseDetail from './pages/CourseDetail';
import Player from './pages/Player';

// 📱 왼쪽 사이드바 컴포넌트 (PC에서만 보임)
function Sidebar() {
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <aside className="hidden md:flex flex-col w-64 border-r border-gray-100 bg-gray-50/30 p-6 h-screen sticky top-0 flex-shrink-0">
      <Link to="/" className="flex items-center gap-2 mb-10 hover:opacity-80 transition-opacity">
        <span className="text-2xl">🎙️</span>
        <span className="text-xl font-extrabold tracking-tight text-gray-900">Talkori</span>
      </Link>

      <div className="space-y-1">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 pl-3">Menu</p>
        <Link 
          to="/" 
          className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-colors font-medium ${isHome ? 'bg-indigo-50 text-indigo-600' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}
        >
          <span className="text-lg">🏠</span> 둘러보기
        </Link>
        <div className="flex items-center gap-3 px-3 py-2 rounded-xl text-gray-400 cursor-not-allowed font-medium">
          <span className="text-lg">📚</span> 내 학습장 (준비중)
        </div>
      </div>
    </aside>
  );
}

function App() {
  return (
    <BrowserRouter>
      {/* 화면 전체를 가로로 나눕니다 (사이드바 + 메인 콘텐츠) */}
      <div className="flex min-h-screen bg-white text-gray-900 font-sans antialiased selection:bg-indigo-100">
        
        {/* 1. PC용 사이드바 */}
        <Sidebar />

        {/* 2. 메인 화면 영역 (오른쪽) */}
        <main className="flex-1 w-full relative">
          
          {/* 모바일용 상단 헤더 (PC에선 숨김) */}
          <header className="md:hidden flex items-center justify-between p-4 border-b border-gray-100 sticky top-0 bg-white/80 backdrop-blur-md z-50">
            <Link to="/" className="text-lg font-extrabold tracking-tight text-gray-900 flex items-center gap-1">
              🎙️ Talkori
            </Link>
          </header>

          {/* 실제 페이지들이 렌더링되는 곳 */}
          <div className="pb-24">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/course/:courseId" element={<CourseDetail />} />
              <Route path="/player/:epId" element={<Player />} />
            </Routes>
          </div>
          
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;