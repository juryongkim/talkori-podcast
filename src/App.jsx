import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Home from './pages/Home';
import CourseDetail from './pages/CourseDetail';
import Player from './pages/Player';

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

// 💻 PC용 사이드바 (기존과 동일)
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
          <Link to="/" className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors font-semibold ${isHome ? 'bg-indigo-50 text-indigo-600' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}>
            <span className="text-xl">🏠</span> {t('menu.explore')}
          </Link>
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-400 cursor-not-allowed font-semibold">
            <span className="text-xl">📚</span> {t('menu.myStudy')}
          </div>
        </div>
      </div>
      <div className="mt-auto border-t border-gray-200 pt-5">
        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block pl-2">{t('common.language')}</label>
        <LanguageSelector />
      </div>
    </aside>
  );
}

// 📱 모바일용 하단 탭 바 (애플 팟캐스트 스타일!)
function BottomNav() {
  const location = useLocation();
  const isHome = location.pathname === '/';
  const { t } = useTranslation();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-gray-200 pb-safe z-50">
      <div className="flex justify-around items-center h-16">
        <Link to="/" className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isHome ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}>
          <span className="text-2xl leading-none">🏠</span>
          <span className="text-[10px] font-bold">{t('menu.explore')}</span>
        </Link>
        <div className="flex flex-col items-center justify-center w-full h-full space-y-1 text-gray-300 cursor-not-allowed">
          <span className="text-2xl leading-none grayscale opacity-50">📚</span>
          <span className="text-[10px] font-bold">Study</span>
        </div>
      </div>
    </nav>
  );
}

function App() {
  return (
    <BrowserRouter>
      <div className="flex min-h-screen bg-white text-gray-900 font-sans antialiased">
        <Sidebar />
        <main className="flex-1 w-full relative pb-16 md:pb-0"> {/* 모바일 하단바 공간(pb-16) 확보 */}
          
          {/* 📱 모바일용 얇고 세련된 상단 헤더 */}
          <header className="md:hidden flex items-center justify-between px-5 py-3 border-b border-gray-100 sticky top-0 bg-white/90 backdrop-blur-xl z-40">
            <Link to="/" className="text-xl font-extrabold tracking-tight text-gray-900 flex items-center gap-1.5">
              🎙️ Talkori
            </Link>
            <LanguageSelector />
          </header>

          <div className="pb-24">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/course/:courseId" element={<CourseDetail />} />
              <Route path="/player/:epId" element={<Player />} />
            </Routes>
          </div>

          {/* 👈 하단 탭 바 장착! */}
          <BottomNav />
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;