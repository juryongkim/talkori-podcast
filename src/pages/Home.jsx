import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next'; // 👈 번역 엔진 불러오기
import courses from '../data/courses.json';

export default function Home() {
  const { t, i18n } = useTranslation();
  
  // 현재 선택된 언어 (예: 'en' 또는 'ko')
  // 만약 선택된 언어가 ko가 아니라면 기본적으로 en을 쓰도록 안전장치를 둡니다.
  const lang = i18n.language === 'ko' ? 'ko' : 'en';

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 md:py-12 md:px-8">
      <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-8">
        {t('menu.explore')}
      </h1>
      
      <div className="mb-10">
        <h2 className="text-xl md:text-2xl font-bold tracking-tight mb-4 border-b border-gray-100 pb-2">
          Talkori Courses
        </h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5">
          {courses.map((course) => {
            const isComingSoon = course.status === 'coming-soon';

            return isComingSoon ? (
              <div key={course.id} className="group block opacity-50 cursor-not-allowed">
                <div className={`aspect-square bg-gradient-to-br ${course.theme} rounded-2xl shadow-sm mb-3 flex flex-col justify-end p-4`}>
                  <span className="text-3xl mb-1">{course.icon}</span>
                  <h3 className="text-white font-bold leading-tight break-words">{course.title.en}</h3>
                </div>
                <h3 className="text-sm font-bold text-gray-900">{course.title[lang]}</h3>
                <p className="text-xs text-gray-500 mt-0.5">Coming Soon</p>
              </div>
            ) : (
              <Link key={course.id} to={`/course/${course.id}`} className="group block">
                <div className={`aspect-square bg-gradient-to-br ${course.theme} rounded-2xl shadow-sm mb-3 flex flex-col justify-end p-4 transition-transform transform group-hover:scale-[1.03] group-hover:shadow-md`}>
                  <span className="text-3xl mb-1">{course.icon}</span>
                  {/* 카드의 큰 제목은 항상 영어로, 아래 작은 제목을 선택 언어로 보여줍니다 */}
                  <h3 className="text-white font-bold leading-tight break-words">{course.title.en}</h3>
                </div>
                <h3 className="text-sm font-bold text-gray-900 group-hover:underline">{course.title[lang]}</h3>
                <p className="text-xs text-gray-500 mt-0.5">{course.publisher[lang]}</p>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}