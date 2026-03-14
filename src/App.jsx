import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Home from './pages/Home';
import CourseDetail from './pages/CourseDetail';
import Player from './pages/Player';
import MyStudy from './pages/MyStudy'; 

// 🌐 언어 선택기
function LanguageSelector() {
  const { i18n } = useTranslation();
  const changeLanguage = (e) => i18n.changeLanguage(e.target.value);
  return (
    <select onChange={changeLanguage} value={i18n.language} className="bg-gray-50/50 border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-1.5 cursor-pointer outline-none font-medium backdrop-blur-md">
      <option value="en">🇺🇸 EN</option>
      <option value="ko">🇰🇷 KO</option>
    </select>
  );
}

// ✨ 나가기 버튼 로직 수정 (강제 이동)
function ExitButton() {
  const handleExit = () => {
    window.parent.postMessage('closeTalkori', '*'); 
    window.top.location.href = 'https://talkori.com'; 
  };

  return (
    <button 
      onClick={handleExit} 
      className="text-gray-400 hover:text-red-500 bg-gray-50 hover:bg-red-50 px-3 py-1.5 rounded-xl transition-colors text-sm font-bold flex items-center gap-1"
      title="학습 종료"
    >
      ✕ EXIT
    </button>
  );
}

// 💻 PC용 사이드바
function Sidebar() {
  const location = useLocation();
  const isHome = location.pathname === '/';
  const isMyStudy = location.pathname === '/my-study'; 
  const { t } = useTranslation(); 
  
  // ==========================================
  // ✨ [PC 사이드바용] 데모 모드 감지 및 주소 자동 세팅
  const isDemoMode = sessionStorage.getItem('talkori_demo_mode') === 'true';
  const classroomUrl = isDemoMode ? 'https://talkori.com/class_demo/' : 'https://talkori.com/class/';
  // ==========================================

  return (
    <aside className="hidden md:flex flex-col w-64 border-r border-gray-100 bg-gray-50/30 p-6 h-screen sticky top-0 flex-shrink-0 justify-between z-10">
      <div>
        <Link to="/" className="flex items-center gap-2 mb-10 hover:opacity-80 transition-opacity">
          <span className="text-2xl">🎙️</span>
          <span className="text-xl font-extrabold tracking-tight text-gray-900">Talkori</span>
        </Link>
        <div className="space-y-1">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 pl-3">Menu</p>
          <Link to="/" className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors font-semibold ${isHome ? 'bg-indigo-50 text-indigo-600' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}>
            <span className="text-xl">🏠</span> {t('menu.explore')}
          </Link>
          <Link to="/my-study" className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors font-semibold ${isMyStudy ? 'bg-indigo-50 text-indigo-600' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}>
            <span className="text-xl">📚</span> My Study
          </Link>

          {/* ✨ [추가됨] PC 사이드바: 강의실 이동 버튼 */}
          <div className="pt-4 mt-2">
            <a href={classroomUrl} target="_top" className="flex items-center gap-3 px-3 py-3 text-gray-600 bg-white hover:bg-indigo-50 hover:text-indigo-600 rounded-xl font-bold transition-all border border-gray-200 hover:border-indigo-200 shadow-sm group">
              <span className="text-xl group-hover:scale-110 transition-transform">🎓</span>
              <span>Classroom</span>
            </a>
          </div>

        </div>
      </div>
      
      {/* 하단 컨트롤 영역 */}
      <div className="mt-auto border-t border-gray-200 pt-5 flex items-end justify-between">
        <div>
          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block pl-2">{t('common.language')}</label>
          <LanguageSelector />
        </div>
        <ExitButton />
      </div>
    </aside>
  );
}

function App() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { t } = useTranslation();

  const toggleMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const closeMenu = () => setIsMobileMenuOpen(false);

  // ==========================================
  // ✨ [보안] 외부 접속 차단 (Iframe 락) + 데모 모드 기억/해제!
  // ==========================================
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const mode = params.get('mode');

    if (mode === 'demo') {
      sessionStorage.setItem('talkori_demo_mode', 'true');
    } else if (mode === 'premium') {
      sessionStorage.removeItem('talkori_demo_mode');
    }

    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    
    if (window.self === window.top && !isLocalhost) {
      window.location.href = 'https://talkori.com'; 
    }
  }, []);
  // ==========================================

  // ✨ [모바일 메뉴용] 데모 모드 감지 및 주소 자동 세팅
  const isDemoMode = sessionStorage.getItem('talkori_demo_mode') === 'true';
  const classroomUrl = isDemoMode ? 'https://talkori.com/class_demo/' : 'https://talkori.com/class/';

  return (
    <BrowserRouter>
      <div className="flex bg-white text-gray-900 font-sans antialiased" style={{ minHeight: '100dvh' }}>
        <Sidebar />

        <main className="flex-1 w-full relative">
          
          <header className="md:hidden flex items-center justify-between px-5 py-3 border-b border-gray-100 sticky top-0 bg-white/90 backdrop-blur-xl z-40">
            <div className="flex items-center gap-3">
              <button onClick={toggleMenu} className="text-2xl text-gray-700 focus:outline-none">
                {isMobileMenuOpen ? '✕' : '☰'}
              </button>
              <Link to="/" className="text-xl font-extrabold tracking-tight text-gray-900 flex items-center gap-1.5" onClick={closeMenu}>
                🎙️ Talkori
              </Link>
            </div>
            <LanguageSelector />
          </header>

          {isMobileMenuOpen && (
            <div className="md:hidden fixed inset-0 z-30 flex">
              <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={closeMenu}></div>
              <div className="absolute top-14 left-0 w-64 h-full bg-white shadow-2xl p-6 flex flex-col justify-between" onClick={e => e.stopPropagation()}>
                <div className="space-y-2 mt-4">
                  <Link to="/" onClick={closeMenu} className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-indigo-50 text-gray-900 font-bold text-lg">
                    <span>🏠</span> {t('menu.explore')}
                  </Link>
                  <Link to="/my-study" onClick={closeMenu} className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-indigo-50 text-gray-900 font-bold text-lg">
                    <span>📚</span> My Study
                  </Link>

                  {/* ✨ [추가됨] 모바일 사이드바: 강의실 이동 버튼 */}
                  <div className="pt-4 mt-2">
                    <a href={classroomUrl} target="_top" className="flex items-center gap-3 px-3 py-3 text-gray-700 bg-white hover:bg-indigo-50 hover:text-indigo-600 rounded-xl font-bold text-lg transition-all border border-gray-200 hover:border-indigo-200 shadow-sm group">
                      <span className="group-hover:scale-110 transition-transform">🎓</span>
                      <span>Classroom</span>
                    </a>
                  </div>

                </div>
                
                {/* 모바일 메뉴 하단에도 나가기 버튼 배치 */}
                <div className="mb-20 pt-5 border-t border-gray-100 flex justify-center">
                  <ExitButton />
                </div>
              </div>
            </div>
          )}

          <div className="pb-10">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/course/:courseId" element={<CourseDetail />} />
              <Route path="/player/:courseId/:epId" element={<Player />} />
              <Route path="/my-study" element={<MyStudy />} />
            </Routes>
          </div>
          
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;