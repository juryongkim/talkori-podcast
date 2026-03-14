import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import courses from '../data/courses.json';

export default function CourseDetail() {
  const { courseId } = useParams();
  const { t, i18n } = useTranslation();
  const lang = i18n.language === 'ko' ? 'ko' : 'en';

  const isDemoMode = sessionStorage.getItem('talkori_demo_mode') === 'true';
  const course = courses.find((c) => c.id === courseId);

  const [sortOrder, setSortOrder] = useState(isDemoMode ? 'asc' : 'desc'); 
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 15; 
  
  // ✨ [추가됨] 예쁜 프리미엄 모달을 띄우기 위한 상태값 추가!
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  useEffect(() => {
    setCurrentPage(1);
    if (isDemoMode) {
      setSortOrder('asc');
    }
  }, [courseId, sortOrder, isDemoMode]);

  if (!course) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh]">
        <p className="text-xl font-bold text-gray-700">Oops! I can't find the course. 😢</p>
        <Link to="/" className="text-indigo-600 mt-4 hover:underline">Return to Home</Link>
      </div>
    );
  }

  const sortedEpisodes = [...course.episodes].sort((a, b) => {
    if (sortOrder === 'asc') return parseInt(a.id) - parseInt(b.id);
    return parseInt(b.id) - parseInt(a.id);
  });

  const totalPages = Math.ceil(sortedEpisodes.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const displayedEpisodes = sortedEpisodes.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 md:py-10 md:px-8">
      
      {/* 🌟 1. 애플 팟캐스트 스타일 '앨범 헤더' */}
      <div className="flex flex-col md:flex-row gap-6 md:gap-10 items-center md:items-start mb-12 bg-white p-6 md:p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
        <div className={`w-40 h-40 md:w-56 md:h-56 shrink-0 bg-gradient-to-br ${course.theme} rounded-3xl shadow-lg flex items-center justify-center`}>
          <span className="text-7xl md:text-8xl drop-shadow-md">{course.icon}</span>
        </div>
        <div className="flex-1 text-center md:text-left pt-2">
          <span className="inline-block px-3 py-1 bg-indigo-50 text-indigo-600 text-xs font-bold rounded-full mb-3 uppercase tracking-wider">
            {course.publisher[lang]}
          </span>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-gray-900 mb-4">
            {course.title[lang]}
          </h1>
          <p className="text-gray-500 text-base md:text-lg font-medium leading-relaxed max-w-2xl">
            {course.description[lang]}
          </p>
        </div>
      </div>

      {/* 🎛️ 2. 리스트 컨트롤 (정렬) */}
      <div className="flex justify-between items-end border-b border-gray-200 pb-4 mb-6">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">
          Episodes <span className="text-gray-400 text-lg font-medium ml-1">({course.episodes.length})</span>
        </h2>
        <select 
          value={sortOrder} 
          onChange={(e) => setSortOrder(e.target.value)}
          disabled={isDemoMode}
          className={`text-sm font-semibold rounded-lg px-3 py-2 outline-none transition-colors ${
            isDemoMode 
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'text-gray-600 bg-gray-50 border-none cursor-pointer hover:bg-gray-100 focus:ring-0'
          }`}
        >
          <option value="desc">⬇️ Latest</option>
          <option value="asc">⬆️ From episode 1</option>
        </select>
      </div>

      {/* 📚 3. 에피소드 리스트 */}
      <div className="space-y-3 mb-10">
        {displayedEpisodes.map((ep) => {
          const isLocked = isDemoMode && parseInt(ep.id) > 3;

          return (
            <Link 
              key={ep.id} 
              to={isLocked ? "#" : `/player/${course.id}/${ep.id}`}
              onClick={(e) => {
                if (isLocked) {
                  e.preventDefault();
                  // ✨ [수정됨] 투박한 alert 대신 예쁜 모달을 띄웁니다!
                  setShowPremiumModal(true);
                }
              }}
              className={`group flex flex-col md:flex-row items-start md:items-center gap-4 p-4 rounded-2xl border transition-all duration-200 ${
                isLocked 
                ? 'opacity-60 bg-gray-50 border-gray-100 cursor-not-allowed'
                : 'hover:bg-gray-50 border-transparent hover:border-gray-100'
              }`}
            >
              <div className={`hidden md:flex shrink-0 w-12 h-12 rounded-full border items-center justify-center transition-colors shadow-sm ${
                isLocked
                ? 'bg-gray-100 border-gray-200 text-gray-400' 
                : 'bg-white border-gray-200 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white'
              }`}>
                <span className={`text-xl ${!isLocked && 'ml-1'}`}>{isLocked ? '🔒' : '▶'}</span>
              </div>

              <div className="flex-1 w-full">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">
                  Episode {ep.id}
                </p>
                <h3 className={`text-lg font-bold mb-1.5 line-clamp-1 transition-colors ${
                  isLocked ? 'text-gray-500' : 'text-gray-900 group-hover:text-indigo-600'
                }`}>
                  {ep.title[lang]}
                </h3>
                <p className="text-sm text-gray-500 line-clamp-2 mb-2 font-medium">
                  {ep.description[lang]}
                </p>
                
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-semibold text-gray-400 bg-gray-100/80 px-2 py-0.5 rounded-md">
                    ⏱ {ep.duration[lang]}
                  </span>
                  {ep.level && (
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${isLocked ? 'text-gray-400 bg-gray-200/50' : 'text-orange-600 bg-orange-50'}`}>
                      {ep.level}
                    </span>
                  )}
                  {ep.tags && ep.tags.map((tag, idx) => (
                    <span key={idx} className={`text-xs font-semibold px-2 py-0.5 rounded-md ${isLocked ? 'text-gray-400 bg-gray-200/50' : 'text-indigo-500 bg-indigo-50'}`}>
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="md:hidden mt-2 w-full flex justify-end">
                <span className={`text-sm font-bold px-4 py-1.5 rounded-full ${
                  isLocked 
                  ? 'text-gray-500 bg-gray-200' 
                  : 'text-indigo-600 bg-indigo-50'
                }`}>
                  {isLocked ? 'Locked 🔒' : 'Play 🎧'}
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* 🔢 4. 페이지네이션 (Pagination) */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-8 mb-12">
          <button 
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-3 py-2 rounded-lg font-bold text-sm bg-white border border-gray-200 text-gray-600 disabled:opacity-30 hover:bg-gray-50 transition-colors"
          >
            ← Prev
          </button>
          
          <div className="flex gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
              <button
                key={pageNum}
                onClick={() => setCurrentPage(pageNum)}
                className={`w-10 h-10 rounded-lg font-bold text-sm transition-colors ${currentPage === pageNum ? 'bg-indigo-600 text-white shadow-md' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
              >
                {pageNum}
              </button>
            ))}
          </div>

          <button 
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-3 py-2 rounded-lg font-bold text-sm bg-white border border-gray-200 text-gray-600 disabled:opacity-30 hover:bg-gray-50 transition-colors"
          >
            Next →
          </button>
        </div>
      )}

      {/* ==================================================== */}
      {/* ✨ 프리미엄 모달 팝업 UI (Player.jsx에서 그대로 이식) */}
      {/* ==================================================== */}
      {showPremiumModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-[24px] p-8 md:p-10 max-w-sm w-full text-center shadow-2xl transform transition-all scale-100">
            <div className="text-5xl mb-4">🔒</div>
            <h3 className="text-2xl font-extrabold text-gray-900 mb-3 tracking-tight">Premium Content</h3>
            <p className="text-gray-500 text-sm leading-relaxed mb-8">
              This lesson is for premium members only.<br/>
              Upgrade now to get <strong className="text-gray-700">unlimited access to</strong><br/>
              all classes and the wordbook!
            </p>
            <button
              onClick={() => {
                // 워드프레스 부모 창을 결제 페이지로 이동
                window.parent.location.href = 'https://talkori.com/price';
              }}
              className="w-full bg-[#3b32f5] hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition-colors mb-4 shadow-md text-[15px]"
            >
              Upgrade Now 🚀
            </button>
            <button
              onClick={() => setShowPremiumModal(false)}
              className="text-gray-400 text-sm font-medium hover:text-gray-600 transition-colors"
            >
              Maybe later
            </button>
          </div>
        </div>
      )}
      {/* ==================================================== */}

    </div>
  );
}