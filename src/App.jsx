import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Home from './pages/Home';
import CourseDetail from './pages/CourseDetail';
import Player from './pages/Player';

// 🌐 [새로 만든 부품] 언어 선택기 (PC/모바일 공통 사용)
function LanguageSelector() {
  const { i18n } = useTranslation();

  const changeLanguage = (e) => {
    i18n.changeLanguage(e.target.value);
  };

  return (
    <select 
      onChange={changeLanguage}
      value={i18n.language}
      className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-1.5 md:p-2.5 cursor-pointer outline-none font-medium"
    >
      <option value="en">🇺🇸 EN</option>
      <option value="ko">🇰🇷 KO</option>
    </select>
  );
}

// 💻 PC용 왼쪽 사이드바 컴포넌트
function Sidebar() {
  const location = useLocation();
  const isHome = location.pathname === '/';
  const { t } = useTranslation(); 

  return (
    <aside className="hidden md:flex flex-col w-64 border-r border-gray-100 bg-gray-50/30 p-6 h-screen sticky top-0 flex-shrink-0 justify-between">
      <div>
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
            <span className="text-lg">🏠</span> {t('menu.explore')}
          </Link>
          <div className="flex items-center gap-3 px-3 py-2 rounded-xl text-gray-400 cursor-not-allowed font-medium">
            <span className="text-lg">📚</span> {t('menu.myStudy')}
          </div>
        </div>
      </div>

      <div className="mt-auto border-t border-gray-200 pt-4">
        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block pl-2">
          {t('common.language')}
        </label>
        {/* 👈 PC 사이드바용 언어 선택기 부착 */}
        <LanguageSelector />
      </div>
    </aside>
  );
}

function App() {
  return (
    <BrowserRouter>
      <div className="flex min-h-screen bg-white text-gray-900 font-sans antialiased selection:bg-indigo-100">
        <Sidebar />
        
        <main className="flex-1 w-full relative">
          {/* 📱 모바일용 상단 헤더 */}
          <header className="md:hidden flex items-center justify-between p-4 border-b border-gray-100 sticky top-0 bg-white/80 backdrop-blur-md z-50">
            <Link to="/" className="text-xl font-extrabold tracking-tight text-gray-900 flex items-center gap-1">
              🎙️ Talkori
            </Link>
            
            {/* 👈 [여기가 핵심!] 모바일 헤더 우측에 언어 선택기 부착 */}
            <LanguageSelector />
            
          </header>

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