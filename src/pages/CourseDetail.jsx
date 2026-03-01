import { Link, useParams } from 'react-router-dom';
import courses from '../data/courses.json'; // 👈 마스터 장부 불러오기!

export default function CourseDetail() {
  const { courseId } = useParams();
  
  // 장부에서 URL과 일치하는 코너 데이터를 찾습니다 (예: real-reaction)
  const course = courses.find(c => c.id === courseId);

  // 만약 잘못된 주소로 들어오면 에러 메시지를 보여줍니다.
  if (!course) {
    return <div className="p-8 text-center text-gray-500">코너를 찾을 수 없습니다.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 md:px-8">
      <Link to="/" className="text-indigo-600 font-medium hover:underline flex items-center gap-1 mb-8">
        ← 둘러보기
      </Link>
      
      {/* 1. 상단 코너 정보 (동적으로 변경됨) */}
      <div className="flex flex-col md:flex-row gap-6 mb-10 items-start">
        <div className={`w-32 h-32 md:w-48 md:h-48 bg-gradient-to-br ${course.theme} rounded-2xl shadow-lg flex-shrink-0 flex items-end p-4`}>
          <h1 className="text-white text-2xl md:text-3xl font-bold leading-tight break-words">
            {course.title}
          </h1>
        </div>
        <div className="flex flex-col justify-center pt-2">
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 mb-1">{course.koreanTitle}</h1>
          <p className="text-lg text-indigo-600 font-bold mb-3">{course.publisher}</p>
          <p className="text-gray-500 leading-relaxed max-w-lg text-sm">
            {course.description}
          </p>
        </div>
      </div>

      {/* 2. 에피소드 리스트 (동적으로 그려짐) */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight mb-4 border-b border-gray-100 pb-2">에피소드</h2>
        
        <div className="flex flex-col">
          {course.episodes.map((ep) => (
            <div key={ep.id} className="py-4 border-b border-gray-100 group">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">EPISODE {ep.id}</p>
              <Link to={`/player/${ep.id}`} className="block">
                <h3 className="text-lg font-bold text-gray-900 group-hover:text-indigo-600 transition-colors mb-2">
                  {ep.title}
                </h3>
                <p className="text-sm text-gray-500 line-clamp-2 mb-3">
                  {ep.description}
                </p>
              </Link>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400 font-medium">{ep.duration}</span>
                <Link to={`/player/${ep.id}`} className="bg-gray-100 hover:bg-gray-200 text-indigo-600 p-2 rounded-full transition-colors flex items-center justify-center w-8 h-8">
                  ▶
                </Link>
              </div>
            </div>
          ))}
          
          {course.episodes.length === 0 && (
            <p className="text-gray-400 text-sm py-4">아직 등록된 에피소드가 없습니다.</p>
          )}
        </div>
      </div>
    </div>
  );
}