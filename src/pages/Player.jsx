import { useState, useRef, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import courses from '../data/courses.json'; // 👈 주변 에피소드를 찾기 위해 장부 불러오기

export default function Player() {
  const { epId } = useParams();
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const lang = i18n.language === 'ko' ? 'ko' : 'en'; 

  const [epData, setEpData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('script');

  const [currentIndex, setCurrentIndex] = useState(null);
  const [playingVocaIndex, setPlayingVocaIndex] = useState(null);
  const [isPlayingAll, setIsPlayingAllState] = useState(false);
  
  const audioRef = useRef(null);
  const autoPlayRef = useRef(false);
  const lineRefs = useRef([]);
  const lastPlayedIndexRef = useRef(0); 

  const CDN_BASE_URL = "https://talkori.b-cdn.net/podcast/reaction";

  // --- 🇰🇷 한국형 게시판 리스트 로직 ---
  const [adjacentEpisodes, setAdjacentEpisodes] = useState([]);
  const [prevEpId, setPrevEpId] = useState(null);
  const [nextEpId, setNextEpId] = useState(null);

  useEffect(() => {
    if (epData && epData.metadata.course) {
      const currentCourse = courses.find(c => c.id === epData.metadata.course);
      if (currentCourse) {
        // ID순으로 정렬 (1화부터)
        const sortedEps = [...currentCourse.episodes].sort((a, b) => parseInt(a.id) - parseInt(b.id));
        const currentIdx = sortedEps.findIndex(ep => ep.id === epId);
        
        if (currentIdx !== -1) {
          // 이전/다음 화 ID 저장 (하단 컨트롤러용)
          setPrevEpId(currentIdx > 0 ? sortedEps[currentIdx - 1].id : null);
          setNextEpId(currentIdx < sortedEps.length - 1 ? sortedEps[currentIdx + 1].id : null);

          // 앞뒤로 총 5개 가져오기 로직
          let startIdx = Math.max(0, currentIdx - 2);
          let endIdx = Math.min(sortedEps.length, startIdx + 5);
          if (endIdx - startIdx < 5) {
             startIdx = Math.max(0, endIdx - 5);
          }
          setAdjacentEpisodes(sortedEps.slice(startIdx, endIdx));
        }
      }
    }
  }, [epData, epId]);

  const setIsPlayingAll = (value) => {
    setIsPlayingAllState(value);
    autoPlayRef.current = value;
  };

  useEffect(() => {
    if (audioRef.current) audioRef.current.pause();
    setIsLoading(true);
    setEpData(null);
    setCurrentIndex(null);
    setPlayingVocaIndex(null);
    setIsPlayingAll(false);
    lastPlayedIndexRef.current = 0;
    setActiveTab('script');

    import(`../data/ep${epId}.json`)
      .then((module) => {
        setEpData(module.default);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("데이터 로드 실패:", err);
        setIsLoading(false);
      });
      
    return () => {
      if (audioRef.current) audioRef.current.pause();
    };
  }, [epId]);

  const handleTabChange = (tab) => {
    if (audioRef.current) audioRef.current.pause();
    setIsPlayingAll(false);
    setCurrentIndex(null);
    setPlayingVocaIndex(null);
    setActiveTab(tab);
  };

  const playLine = (index) => {
    if (audioRef.current) audioRef.current.pause();
    setPlayingVocaIndex(null);

    const item = epData.content[index];
    lastPlayedIndexRef.current = index; 
    
    if (!item || !item.audio) {
      if (autoPlayRef.current && index < epData.content.length - 1) {
        playLine(index + 1);
      } else {
        setIsPlayingAll(false);
        setCurrentIndex(null);
      }
      return;
    }

    const audioUrl = `${CDN_BASE_URL}/ep${epId}/${item.audio}`;
    const audio = new Audio(audioUrl);

    audio.onended = () => {
      if (autoPlayRef.current) {
        playLine(index + 1);
      } else {
        setCurrentIndex(null);
      }
    };

    audioRef.current = audio;
    audio.play().catch(e => console.error("재생 에러:", e));
    setCurrentIndex(index);

    if (lineRefs.current[index] && activeTab === 'script') {
      lineRefs.current[index].scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  const playVoca = (index) => {
    if (audioRef.current) audioRef.current.pause();
    setIsPlayingAll(false);
    setCurrentIndex(null);

    const item = epData.vocabulary[index];
    if (!item || !item.audio) return;

    const audioUrl = `${CDN_BASE_URL}/ep${epId}/${item.audio}`;
    const audio = new Audio(audioUrl);

    audio.onended = () => setPlayingVocaIndex(null);
    audioRef.current = audio;
    audio.play().catch(e => console.error("단어 재생 에러:", e));
    setPlayingVocaIndex(index);
  };

  const togglePlayAll = () => {
    if (activeTab === 'voca') setActiveTab('script');
    
    if (isPlayingAll) {
      if (audioRef.current) audioRef.current.pause();
      setIsPlayingAll(false);
    } else {
      setIsPlayingAll(true);
      const startIdx = currentIndex !== null ? currentIndex : lastPlayedIndexRef.current;
      playLine(startIdx);
    }
  };

  // 🎧 이전/다음 화 이동 핸들러
  const handleNavigate = (targetEpId) => {
    if (targetEpId) {
      navigate(`/player/${targetEpId}`);
      window.scrollTo(0, 0); // 새 에피소드 이동 시 스크롤 위로
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-600 mb-4"></div>
      </div>
    );
  }

  if (!epData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh]">
        <p className="text-xl font-bold text-gray-700 mb-4">앗! 에피소드를 찾을 수 없어요. 😢</p>
        <Link to={`/course/${epData?.metadata?.course || 'real-reaction'}`} className="text-indigo-600 hover:underline">
          목록으로 돌아가기
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 md:py-10 pb-32"> {/* 하단 컨트롤러 공간 확보(pb-32) */}
      
      {/* 상단 플레이어 고정 헤더 */}
      <div className="bg-white p-6 md:p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 mb-6 text-center z-10">
        <Link to={`/course/${epData.metadata.course || 'real-reaction'}`} className="text-gray-400 absolute left-6 top-6 hover:text-gray-600 flex items-center gap-1 text-sm font-medium">
          ← List
        </Link>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 mt-2 md:mt-0">EPISODE {epData.metadata.id}</p>
        
        <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 mb-1.5">
          {epData.metadata.title[lang] || epData.metadata.title.en}
        </h1>
        <div className="flex justify-center items-center gap-2 mb-4">
          {epData.metadata.level && (
            <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md">{epData.metadata.level}</span>
          )}
        </div>
      </div>

      {/* 🗂️ 탭 스위치 (Script vs Voca) */}
      <div className="flex border-b border-gray-200 mb-8 px-2 sticky top-[60px] md:top-0 bg-white/95 backdrop-blur-md z-20 pt-2">
        <button 
          onClick={() => handleTabChange('script')}
          className={`flex-1 pb-3 text-sm md:text-base font-bold text-center border-b-2 transition-colors duration-200 ${activeTab === 'script' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-400 hover:text-gray-600 hover:border-gray-200'}`}
        >
          📝 대본 (Script)
        </button>
        <button 
          onClick={() => handleTabChange('voca')}
          className={`flex-1 pb-3 text-sm md:text-base font-bold text-center border-b-2 transition-colors duration-200 ${activeTab === 'voca' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-400 hover:text-gray-600 hover:border-gray-200'}`}
        >
          📚 단어장 ({epData.vocabulary?.length || 0})
        </button>
      </div>

      {/* 📝 대본 (Script) 렌더링 */}
      {activeTab === 'script' && (
        <div className="px-2 md:px-4 space-y-8 pb-10">
          {epData.content.map((item, index) => {
            if (item.type === 'FX') return null;
            const isMina = item.speaker.includes('Mina') || item.speaker.includes('MINA');
            const isPlaying = currentIndex === index; 
            const cleanSpeakerName = item.speaker.replace(/\s*\(.*?\)\s*/g, '').trim();

            return (
              <div 
                key={index} 
                ref={(el) => (lineRefs.current[index] = el)}
                className={`flex flex-col items-start gap-1.5 p-3 -mx-3 rounded-2xl transition-all duration-500 ${isPlaying ? 'bg-indigo-50/60 border-l-[3px] border-indigo-500 pl-5 shadow-sm' : 'border-l-[3px] border-transparent pl-5'}`}
              >
                <span className={`text-[11px] font-bold uppercase tracking-wider ${isMina ? 'text-indigo-500' : 'text-gray-400'}`}>
                  {cleanSpeakerName}
                </span>

                {item.playable ? (
                  <p 
                    onClick={() => { setIsPlayingAll(false); playLine(index); }}
                    className={`text-xl md:text-2xl font-bold cursor-pointer rounded-lg transition-colors flex items-start gap-2 group leading-tight
                      ${isPlaying ? 'text-indigo-700' : 'text-gray-900 hover:text-indigo-500'}
                    `}
                  >
                    {item.text} 
                    <span className={`text-base mt-1 transition-colors ${isPlaying ? 'text-indigo-600 animate-pulse' : 'text-gray-200 group-hover:text-indigo-300'}`}>
                      {isPlaying ? '🔊' : '▶'}
                    </span>
                  </p>
                ) : (
                  <p 
                    onClick={() => { setIsPlayingAll(false); playLine(index); }}
                    className={`text-lg md:text-xl px-2 py-1 -ml-2 rounded-lg transition-colors cursor-pointer leading-tight
                      ${isPlaying ? 'text-indigo-700 font-bold' : 'text-gray-700 hover:text-gray-500'}
                    `}
                  >
                    {item.text}
                  </p>
                )}

                {item.translation && (
                  <p className="text-sm md:text-base text-gray-500 font-medium mt-1 mb-1 pl-3 border-l-2 border-gray-200">
                    {item.translation}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 📚 단어장 (VOCA) 렌더링 */}
      {activeTab === 'voca' && (
        <div className="px-2 md:px-4 space-y-4 pb-10">
          {!epData.vocabulary || epData.vocabulary.length === 0 ? (
            <div className="text-center py-10 text-gray-400 font-medium">단어가 없습니다.</div>
          ) : (
            epData.vocabulary.map((voca, idx) => {
              const isPlayingVoca = playingVocaIndex === idx;
              return (
                <div key={idx} className={`p-5 rounded-2xl border transition-all duration-300 ${isPlayingVoca ? 'border-indigo-500 bg-indigo-50/40 shadow-md' : 'border-gray-100 bg-white shadow-sm hover:shadow-md'}`}>
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <h3 className={`text-2xl font-extrabold mb-1 ${isPlayingVoca ? 'text-indigo-700' : 'text-gray-900'}`}>{voca.word}</h3>
                      <p className="text-base font-semibold text-gray-500 mb-4">{voca.meaning}</p>
                      {voca.example && (
                        <div className="bg-gray-50 rounded-xl p-3.5 border border-gray-100/80">
                          <p className="text-sm font-medium text-gray-700 leading-relaxed">{voca.example}</p>
                        </div>
                      )}
                    </div>
                    <button 
                      onClick={() => playVoca(idx)}
                      className={`shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition-all ${isPlayingVoca ? 'bg-indigo-600 text-white shadow-lg scale-95' : 'bg-indigo-50 text-indigo-600'}`}
                    >
                      <span className={`${isPlayingVoca ? 'animate-pulse' : ''} text-xl ml-1`}>{isPlayingVoca ? '🔊' : '▶'}</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* --- 🇰🇷 한국형 게시판 스타일: 연관 에피소드 리스트 --- */}
      <div className="mt-8 pt-8 border-t border-gray-200">
        <h3 className="text-lg font-bold text-gray-900 mb-4 px-2">주변 에피소드</h3>
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          {adjacentEpisodes.map((ep) => {
            const isCurrent = ep.id === epId;
            return (
              <div 
                key={ep.id} 
                onClick={() => !isCurrent && handleNavigate(ep.id)}
                className={`flex items-center gap-3 p-4 border-b border-gray-100 last:border-0 transition-colors ${isCurrent ? 'bg-indigo-50/50 cursor-default' : 'hover:bg-gray-50 cursor-pointer'}`}
              >
                <div className={`w-8 text-center text-xs font-bold ${isCurrent ? 'text-indigo-600' : 'text-gray-400'}`}>
                  {isCurrent ? '▶' : ep.id}
                </div>
                <div className="flex-1">
                  <p className={`text-sm font-bold line-clamp-1 ${isCurrent ? 'text-indigo-700' : 'text-gray-800'}`}>
                    {ep.title[lang]}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* --- 📱 모바일 하단 고정 플레이어 컨트롤러 --- */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-gray-200 p-3 pb-safe z-50 flex items-center justify-between md:hidden shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
        
        {/* 이전 화 버튼 */}
        <button 
          onClick={() => handleNavigate(prevEpId)}
          disabled={!prevEpId}
          className="p-3 text-gray-500 disabled:opacity-30 disabled:cursor-not-allowed hover:text-indigo-600 transition-colors"
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M8.445 14.832A1 1 0 0010 14v-2.798l5.445 3.63A1 1 0 0017 14V6a1 1 0 00-1.555-.832L10 8.798V6a1 1 0 00-1.555-.832l-6 4a1 1 0 000 1.664l6 4z"/></svg>
        </button>

        {/* 중앙 재생 버튼 */}
        <button 
          onClick={togglePlayAll}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-lg text-white ${isPlayingAll ? 'bg-indigo-600 scale-95' : 'bg-gray-900 hover:scale-105'}`}
        >
          <span className="text-xl ml-1">{isPlayingAll ? '⏸' : '▶'}</span>
        </button>

        {/* 다음 화 버튼 */}
        <button 
          onClick={() => handleNavigate(nextEpId)}
          disabled={!nextEpId}
          className="p-3 text-gray-500 disabled:opacity-30 disabled:cursor-not-allowed hover:text-indigo-600 transition-colors"
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M11.555 5.168A1 1 0 0010 6v2.798L4.555 5.168A1 1 0 003 6v8a1 1 0 001.555.832L10 11.202V14a1 1 0 001.555.832l6-4a1 1 0 000-1.664l-6-4z"/></svg>
        </button>
      </div>

    </div>
  );
}