import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import courses from '../data/courses.json';

export default function CourseDetail() {
  const { courseId } = useParams();
  const { t, i18n } = useTranslation();
  const lang = i18n.language === 'ko' ? 'ko' : 'en';

  const course = courses.find((c) => c.id === courseId);

  // 🎯 페이지네이션 및 정렬 상태 관리
  const [sortOrder, setSortOrder] = useState('desc'); // 기본값: desc(최신순), asc(1화부터)
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 15; // 한 페이지에 보여줄 에피소드 수 (대표님이 원하신 스윗스팟!)

  // 코스가 바뀌면 1페이지로 초기화
  useEffect(() => {
    setCurrentPage(1);
  }, [courseId, sortOrder]);

  if (!course) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh]">
        <p className="text-xl font-bold text-gray-700">앗! 코스를 찾을 수 없어요. 😢</p>
        <Link to="/" className="text-indigo-600 mt-4 hover:underline">홈으로 돌아가기</Link>
      </div>
    );
  }

  // 정렬 로직
  const sortedEpisodes = [...course.episodes].sort((a, b) => {
    if (sortOrder === 'asc') return parseInt(a.id) - parseInt(b.id);
    return parseInt(b.id) - parseInt(a.id);
  });

  // 페이지네이션 계산
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
          className="text-sm font-semibold text-gray-600 bg-gray-50 border-none rounded-lg px-3 py-2 cursor-pointer hover:bg-gray-100 focus:ring-0 outline-none transition-colors"
        >
          <option value="desc">⬇️ 최신순</option>
          <option value="asc">⬆️ 1화부터</option>
        </select>
      </div>

      {/* 📚 3. 에피소드 리스트 */}
      <div className="space-y-3 mb-10">
        {displayedEpisodes.map((ep) => (
          <Link 
            key={ep.id} 
            to={`/player/${ep.id}`}
            className="group flex flex-col md:flex-row items-start md:items-center gap-4 p-4 rounded-2xl hover:bg-gray-50 border border-transparent hover:border-gray-100 transition-all duration-200"
          >
            {/* 플레이 버튼 (애플 팟캐스트 스타일) */}
            <div className="hidden md:flex shrink-0 w-12 h-12 bg-white rounded-full border border-gray-200 items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors shadow-sm">
              <span className="text-xl ml-1">▶</span>
            </div>

            <div className="flex-1 w-full">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">
                Episode {ep.id}
              </p>
              <h3 className="text-lg font-bold text-gray-900 group-hover:text-indigo-600 transition-colors mb-1.5 line-clamp-1">
                {ep.title[lang]}
              </h3>
              <p className="text-sm text-gray-500 line-clamp-2 mb-2 font-medium">
                {ep.description[lang]}
              </p>
              
              {/* 🏷️ 새로 추가된 태그 및 난이도 뱃지 보여주기! */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold text-gray-400 bg-gray-100/80 px-2 py-0.5 rounded-md">
                  ⏱ {ep.duration[lang]}
                </span>
                {ep.level && (
                  <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md">
                    {ep.level}
                  </span>
                )}
                {ep.tags && ep.tags.map((tag, idx) => (
                  <span key={idx} className="text-xs font-semibold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-md">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
            
            {/* 모바일용 플레이 버튼 */}
            <div className="md:hidden mt-2 w-full flex justify-end">
              <span className="text-sm font-bold text-indigo-600 bg-indigo-50 px-4 py-1.5 rounded-full">Play 🎧</span>
            </div>
          </Link>
        ))}
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

    </div>
  );
}