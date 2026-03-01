import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next'; // 👈 번역 엔진 불러오기
import courses from '../data/courses.json';

export default function CourseDetail() {
  const { courseId } = useParams();
  const { t, i18n } = useTranslation();
  
  const lang = i18n.language === 'ko' ? 'ko' : 'en';
  const course = courses.find(c => c.id === courseId);

  if (!course) {
    return <div className="p-8 text-center text-gray-500">Course not found.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 md:py-8 md:px-8">
      <Link to="/" className="text-indigo-600 font-medium hover:underline flex items-center gap-1 mb-6 md:mb-8 text-sm md:text-base">
        ← {t('common.back')}
      </Link>
      
      {/* 1. 상단 코너 정보 */}
      <div className="flex flex-col md:flex-row gap-6 mb-10 items-start">
        <div className={`w-32 h-32 md:w-48 md:h-48 bg-gradient-to-br ${course.theme} rounded-3xl shadow-lg flex-shrink-0 flex items-end p-5`}>
          <h1 className="text-white text-2xl md:text-3xl font-bold leading-tight break-words">
            {course.title.en}
          </h1>
        </div>
        <div className="flex flex-col justify-center pt-2">
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-gray-900 mb-1">
            {course.title[lang]}
          </h1>
          <p className="text-base md:text-lg text-indigo-600 font-bold mb-3">
            {course.publisher[lang]}
          </p>
          <p className="text-gray-500 leading-relaxed max-w-lg text-sm md:text-base">
            {course.description[lang]}
          </p>
        </div>
      </div>

      {/* 2. 에피소드 리스트 */}
      <div>
        <h2 className="text-xl md:text-2xl font-bold tracking-tight mb-4 border-b border-gray-100 pb-2">
          {t('common.episodes')}
        </h2>
        
        <div className="flex flex-col">
          {course.episodes.map((ep) => (
            <div key={ep.id} className="py-5 border-b border-gray-100 group">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">EPISODE {ep.id}</p>
              <Link to={`/player/${ep.id}`} className="block">
                <h3 className="text-lg md:text-xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors mb-2">
                  {ep.title[lang]}
                </h3>
                <p className="text-sm text-gray-500 line-clamp-2 mb-4 leading-relaxed">
                  {ep.description[lang]}
                </p>
              </Link>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400 font-medium">{ep.duration[lang]}</span>
                <Link to={`/player/${ep.id}`} className="bg-gray-50 hover:bg-gray-100 text-indigo-600 p-2 rounded-full transition-colors flex items-center justify-center w-9 h-9 shadow-sm">
                  ▶
                </Link>
              </div>
            </div>
          ))}
          
          {course.episodes.length === 0 && (
            <p className="text-gray-400 text-sm py-4">No episodes available yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}