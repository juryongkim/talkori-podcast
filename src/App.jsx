import { useState } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Home from './pages/Home';
import CourseDetail from './pages/CourseDetail';
import Player from './pages/Player';
import MyStudy from './pages/MyStudy'; // ✨ 1. 내 학습장 컴포넌트 불러오기!

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

// 💻 PC용 사이드바
function Sidebar() {
  const location = useLocation();
  const isHome = location.pathname === '/';
  const isMyStudy = location.pathname === '/my-study'; // ✨ 현재 내 학습장인지 확인
  const { t } = useTranslation(); 
  
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
          
          {/* ✨ 2. 내 학습장 메뉴 연결 및 활성화 처리 */}
          <Link to="/my-study" className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors font-semibold ${isMyStudy ? 'bg-indigo-50 text-indigo-600' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}>
            <span className="text-xl">📚</span> My Study
          </Link>
        </div>
      </div>
      <div className="mt-auto border-t border-gray-200 pt-5">
        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block pl-2">{t('common.language')}</label>
        <LanguageSelector />
      </div>
    </aside>
  );
}

function App() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { t } = useTranslation();

  const toggleMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const closeMenu = () => setIsMobileMenuOpen(false);

  return (
    <BrowserRouter>
      <div className="flex min-h-screen bg-white text-gray-900 font-sans antialiased">
        <Sidebar />

        <main className="flex-1 w-full relative">
          
          {/* 📱 모바일 상단 헤더 (햄버거 메뉴 포함) */}
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

          {/* 📱 모바일 슬라이드 메뉴 */}
          {isMobileMenuOpen && (
            <div className="md:hidden fixed inset-0 z-30 bg-black/20 backdrop-blur-sm" onClick={closeMenu}>
              <div className="absolute top-14 left-0 w-64 h-full bg-white shadow-2xl p-6 flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="space-y-2 mt-4">
                  <Link to="/" onClick={closeMenu} className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-indigo-50 text-gray-900 font-bold text-lg">
                    <span>🏠</span> {t('menu.explore')}
                  </Link>
                  {/* ✨ 3. 모바일 메뉴에도 My Study 연결 */}
                  <Link to="/my-study" onClick={closeMenu} className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-indigo-50 text-gray-900 font-bold text-lg">
                    <span>📚</span> My Study
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* 메인 라우팅 영역 */}
          <div className="pb-10">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/course/:courseId" element={<CourseDetail />} />
              <Route path="/player/:epId" element={<Player />} />
              {/* ✨ 4. My Study 페이지 라우트 등록! */}
              <Route path="/my-study" element={<MyStudy />} />
            </Routes>
          </div>
          
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;