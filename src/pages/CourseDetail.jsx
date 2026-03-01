import { Link, useParams } from 'react-router-dom';

export default function CourseDetail() {
  const { courseId } = useParams();

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 md:px-8">
      {/* 뒤로 가기 */}
      <Link to="/" className="text-indigo-600 font-medium hover:underline flex items-center gap-1 mb-8">
        ← 둘러보기
      </Link>
      
      {/* 프로그램 정보 */}
      <div className="flex flex-col md:flex-row gap-6 mb-10 items-start">
        <div className="w-32 h-32 md:w-48 md:h-48 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg flex-shrink-0 flex items-end p-4">
          <h1 className="text-white text-2xl md:text-3xl font-bold leading-tight">Real<br/>Reaction</h1>
        </div>
        <div className="flex flex-col justify-center pt-2">
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 mb-1">리얼 리액션</h1>
          <p className="text-lg text-indigo-600 font-bold mb-3">Talkori</p>
          <p className="text-gray-500 leading-relaxed max-w-lg text-sm">
            한국인의 찐 리액션과 뉘앙스를 완벽하게 마스터하세요! 교과서에는 없는 진짜 살아있는 한국어 대화가 펼쳐집니다.
          </p>
        </div>
      </div>

      {/* 에피소드 리스트 */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight mb-4 border-b border-gray-100 pb-2">에피소드</h2>
        
        <div className="flex flex-col">
          {/* 에피소드 1화 */}
          <div className="py-4 border-b border-gray-100 group">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">EPISODE 001</p>
            <Link to="/player/001" className="block">
              <h3 className="text-lg font-bold text-gray-900 group-hover:text-indigo-600 transition-colors mb-2">말도 안 돼! (No way!)</h3>
              <p className="text-sm text-gray-500 line-clamp-2 mb-3">John이 지하철에서 비둘기를 만났다? 진짜 놀랐을 때 쓰는 한국어 리액션을 배워봅시다.</p>
            </Link>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400 font-medium">3분 20초</span>
              {/* 재생 버튼 아이콘 */}
              <Link to="/player/001" className="bg-gray-100 hover:bg-gray-200 text-indigo-600 p-2 rounded-full transition-colors flex items-center justify-center w-8 h-8">
                ▶
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}