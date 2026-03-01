import { Link } from 'react-router-dom';
import courses from '../data/courses.json'; // 👈 마스터 장부 불러오기!

export default function Home() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 md:px-8">
      <h1 className="text-4xl font-extrabold tracking-tight mb-8">둘러보기</h1>
      
      <div className="mb-10">
        <h2 className="text-2xl font-bold tracking-tight mb-4 border-b border-gray-100 pb-2">Talkori 코너</h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* 장부(courses.json)에 있는 데이터를 반복문(map)으로 그립니다 */}
          {courses.map((course) => {
            const isComingSoon = course.status === 'coming-soon';

            return isComingSoon ? (
              // 아직 오픈 안 된 코너 (클릭 안 됨)
              <div key={course.id} className="group block opacity-50 cursor-not-allowed">
                <div className={`aspect-square bg-gradient-to-br ${course.theme} rounded-2xl shadow-md mb-3 flex flex-col justify-end p-4`}>
                  <span className="text-3xl mb-1">{course.icon}</span>
                  <h3 className="text-white font-bold leading-tight break-words">{course.title}</h3>
                </div>
                <h3 className="text-sm font-bold text-gray-900">{course.koreanTitle}</h3>
                <p className="text-xs text-gray-500 mt-0.5">Coming Soon</p>
              </div>
            ) : (
              // 활성화된 코너 (클릭하면 넘어감)
              <Link key={course.id} to={`/course/${course.id}`} className="group block">
                <div className={`aspect-square bg-gradient-to-br ${course.theme} rounded-2xl shadow-md mb-3 flex flex-col justify-end p-4 transition-transform transform group-hover:scale-[1.02]`}>
                  <span className="text-3xl mb-1">{course.icon}</span>
                  <h3 className="text-white font-bold leading-tight break-words">{course.title}</h3>
                </div>
                <h3 className="text-sm font-bold text-gray-900 group-hover:underline">{course.koreanTitle}</h3>
                <p className="text-xs text-gray-500 mt-0.5">{course.publisher}</p>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}