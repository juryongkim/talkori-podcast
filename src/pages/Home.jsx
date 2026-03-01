import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import courses from '../data/courses.json';

export default function Home() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language === 'ko' ? 'ko' : 'en';

  // 첫 번째 코스를 '메인 히어로 배너'로 사용하고, 나머지를 일반 리스트로 분리합니다.
  const featuredCourse = courses[0];
  const regularCourses = courses.slice(1);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 md:py-10 md:px-8">
      <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-8">
        {t('menu.explore')}
      </h1>
      
      {/* 🌟 1. 애플 팟캐스트 스타일 '히어로 배너' (휑한 공간 채우기) */}
      {featuredCourse && (
        <div className="mb-12">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 pl-1">Featured Show</p>
          <Link to={`/course/${featuredCourse.id}`} className="group block relative overflow-hidden rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-transform transform hover:scale-[1.01] hover:shadow-[0_20px_40px_rgb(0,0,0,0.1)]">
            <div className={`w-full h-64 md:h-80 bg-gradient-to-r ${featuredCourse.theme} p-8 md:p-12 flex flex-col justify-end relative overflow-hidden`}>
              {/* 장식용 거대한 아이콘 배경 */}
              <span className="absolute -right-10 -top-10 text-[15rem] opacity-20 transform rotate-12 group-hover:rotate-6 transition-transform duration-700">
                {featuredCourse.icon}
              </span>
              
              <div className="relative z-10 max-w-2xl">
                <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md text-white text-xs font-bold rounded-full mb-4">
                  {featuredCourse.publisher[lang]}
                </span>
                <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-3 leading-tight drop-shadow-md">
                  {featuredCourse.title[lang]}
                </h2>
                <p className="text-white/90 text-sm md:text-lg line-clamp-2 md:line-clamp-none font-medium drop-shadow-sm">
                  {featuredCourse.description[lang]}
                </p>
              </div>
            </div>
          </Link>
        </div>
      )}

      {/* 📚 2. 일반 코스 목록 */}
      <div className="mb-10">
        <h2 className="text-xl md:text-2xl font-bold tracking-tight mb-5 border-b border-gray-100 pb-2">
          Talkori Courses
        </h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
          {/* 이미 메인에 띄운 featuredCourse 도 목록에 다시 작게 보여주려면 courses 전체를 map 돌려도 됩니다. (여기서는 전체를 다시 보여줍니다) */}
          {courses.map((course) => {
            const isComingSoon = course.status === 'coming-soon';

            return isComingSoon ? (
              <div key={course.id} className="group block opacity-50 cursor-not-allowed">
                <div className={`aspect-square bg-gradient-to-br ${course.theme} rounded-2xl shadow-sm mb-3 flex flex-col justify-end p-5`}>
                  <span className="text-4xl mb-2">{course.icon}</span>
                  <h3 className="text-white font-bold leading-tight break-words">{course.title.en}</h3>
                </div>
                <h3 className="text-sm md:text-base font-bold text-gray-900">{course.title[lang]}</h3>
                <p className="text-xs text-gray-500 mt-1 font-medium">Coming Soon</p>
              </div>
            ) : (
              <Link key={course.id} to={`/course/${course.id}`} className="group block">
                <div className={`aspect-square bg-gradient-to-br ${course.theme} rounded-2xl shadow-sm mb-3 flex flex-col justify-end p-5 transition-transform transform group-hover:scale-[1.03] group-hover:shadow-md`}>
                  <span className="text-4xl mb-2">{course.icon}</span>
                  <h3 className="text-white font-bold leading-tight break-words">{course.title.en}</h3>
                </div>
                <h3 className="text-sm md:text-base font-bold text-gray-900 group-hover:underline line-clamp-1">{course.title[lang]}</h3>
                <p className="text-xs text-gray-500 mt-1 font-medium line-clamp-1">{course.publisher[lang]}</p>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}