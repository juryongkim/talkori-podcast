import { useState, useRef, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import courses from '../data/courses.json';

export default function Player() {
  const { epId } = useParams();
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const lang = i18n.language === 'ko' ? 'ko' : 'en'; 

  const [epData, setEpData] = useState(null);
  const [courseData, setCourseData] = useState(null); // 코스 정보(테마, 아이콘)를 위해 추가
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
        setCourseData(currentCourse); // 코스 테마 색상/아이콘 저장
        const sortedEps = [...currentCourse.episodes].sort((a, b) => parseInt(a.id) - parseInt(b.id));
        const currentIdx = sortedEps.findIndex(ep => ep.id === epId);
        
        if (currentIdx !== -1) {
          setPrevEpId(currentIdx > 0 ? sortedEps[currentIdx - 1].id : null);
          setNextEpId(currentIdx < sortedEps.length - 1 ? sortedEps[currentIdx + 1].id : null);

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

  const handleNavigate = (targetEpId) => {
    if (targetEpId) {
      navigate(`/player/${targetEpId}`);
      window.scrollTo(0, 0); 
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-600 mb-4"></div>
      </div>
    );
  }

  if (!epData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <p className="text-xl font-bold text-gray-700 mb-4">앗! 에피소드를 찾을 수 없어요. 😢</p>
        <Link to={`/course/${epData?.metadata?.course || 'real-reaction'}`} className="text-indigo-600 hover:underline font-bold">
          목록으로 돌아가기
        </Link>
      </div>
    );
  }

  return (
    // 🎨 애플 팟캐스트 스타일 배경색 적용 (약간의 회색 톤으로 Depth 부여)
    <div className="min-h-screen bg-[#F5F5F7] pb-32 pt-2 md:pt-8 px-4 md:px-8">
      
      <div className="max-w-4xl mx-auto">
        
        {/* --- 💻 [PC 전용] 상단 거대 플레이어 히어로 카드 (애플 팟캐스트 스타일) --- */}
        <div className="hidden md:flex bg-white rounded-[2rem] p-8 mb-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 items-center gap-8">
          <div className={`w-48 h-48 shrink-0 bg-gradient-to-br ${courseData?.theme || 'from-indigo-400 to-purple-500'} rounded-3xl shadow-inner flex items-center justify-center`}>
            <span className="text-7xl drop-shadow-md">{courseData?.icon || '🎙️'}</span>
          </div>
          
          <div className="flex-1">
            <Link to={`/course/${epData.metadata.course}`} className="text-indigo-600 hover:text-indigo-800 font-bold text-sm mb-3 inline-flex items-center gap-1 transition-colors">
              ← Back to Course
            </Link>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 mt-1">EPISODE {epData.metadata.id}</p>
            <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 mb-3 leading-tight">
              {epData.metadata.title[lang] || epData.metadata.title.en}
            </h1>
            
            <div className="flex items-center gap-2 mb-6">
              <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">
                ⏱ {epData.metadata.duration[lang]}
              </span>
              {epData.metadata.level && (
                <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md">{epData.metadata.level}</span>
              )}
            </div>

            <div className="flex items-center gap-4">
              <button 
                onClick={togglePlayAll}
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-md text-white ${isPlayingAll ? 'bg-indigo-600' : 'bg-gray-900 hover:scale-105 hover:shadow-lg'}`}
              >
                <span className="text-2xl ml-1">{isPlayingAll ? '⏸' : '▶'}</span>
              </button>
              <button onClick={() => handleNavigate(prevEpId)} disabled={!prevEpId} className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 disabled:opacity-30 transition-colors">
                <span className="text-lg">⏪</span>
              </button>
              <button onClick={() => handleNavigate(nextEpId)} disabled={!nextEpId} className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 disabled:opacity-30 transition-colors">
                <span className="text-lg">⏩</span>
              </button>
            </div>
          </div>
        </div>

        {/* --- 📱 [모바일 전용] 상단 미니 헤더 --- */}
        <div className="md:hidden bg-white/80 backdrop-blur-xl rounded-2xl p-5 mb-6 shadow-sm border border-gray-100/50">
          <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mb-1">EPISODE {epData.metadata.id}</p>
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 leading-tight">
            {epData.metadata.title[lang] || epData.metadata.title.en}
          </h1>
        </div>

        {/* --- 🗂️ iOS 스타일 탭 컨트롤 (Segmented Control) --- */}
        <div className="flex bg-gray-200/50 p-1.5 rounded-2xl mb-6 max-w-sm mx-auto md:mx-0">
          <button 
            onClick={() => handleTabChange('script')}
            className={`flex-1 py-2.5 px-4 text-sm font-bold text-center rounded-xl transition-all duration-200 ${activeTab === 'script' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            📝 대본
          </button>
          <button 
            onClick={() => handleTabChange('voca')}
            className={`flex-1 py-2.5 px-4 text-sm font-bold text-center rounded-xl transition-all duration-200 ${activeTab === 'voca' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            📚 단어장
          </button>
        </div>

        {/* --- 📝 대본 (Script) 렌더링 카드 --- */}
        {activeTab === 'script' && (
          <div className="bg-white rounded-[2rem] shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 overflow-hidden mb-10">
            <div className="p-4 md:p-8 space-y-2">
              {epData.content.map((item, index) => {
                if (item.type === 'FX') return null;
                const isMina = item.speaker.includes('Mina') || item.speaker.includes('MINA');
                const isPlaying = currentIndex === index; 
                const cleanSpeakerName = item.speaker.replace(/\s*\(.*?\)\s*/g, '').trim();

                return (
                  <div 
                    key={index} 
                    ref={(el) => (lineRefs.current[index] = el)}
                    className={`flex flex-col items-start gap-1 p-4 rounded-2xl transition-all duration-300 ${isPlaying ? 'bg-indigo-50/50 shadow-inner' : 'hover:bg-gray-50/50'}`}
                  >
                    <span className={`text-[10px] md:text-xs font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md mb-1 ${isMina ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-600'}`}>
                      {cleanSpeakerName}
                    </span>

                    {item.playable ? (
                      <p 
                        onClick={() => { setIsPlayingAll(false); playLine(index); }}
                        className={`text-[1.35rem] md:text-[1.75rem] font-bold cursor-pointer transition-colors flex items-start gap-2 group leading-[1.3] tracking-tight
                          ${isPlaying ? 'text-indigo-700' : 'text-gray-900 hover:text-indigo-500'}
                        `}
                      >
                        {item.text} 
                        <span className={`text-xl mt-1 opacity-50 transition-all ${isPlaying ? 'text-indigo-600 animate-pulse opacity-100' : 'text-gray-300 group-hover:text-indigo-300 group-hover:opacity-100'}`}>
                          {isPlaying ? '🔊' : '▶'}
                        </span>
                      </p>
                    ) : (
                      <p 
                        onClick={() => { setIsPlayingAll(false); playLine(index); }}
                        className={`text-lg md:text-xl transition-colors cursor-pointer leading-[1.4] tracking-tight
                          ${isPlaying ? 'text-indigo-700 font-bold' : 'text-gray-700 hover:text-gray-500'}
                        `}
                      >
                        {item.text}
                      </p>
                    )}

                    {item.translation && (
                      <p className="text-sm md:text-base text-gray-500 font-medium mt-1 mb-1 pl-3 border-l-2 border-gray-200 leading-snug">
                        {item.translation}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* --- 📚 단어장 (VOCA) 렌더링 카드 --- */}
        {activeTab === 'voca' && (
          <div className="bg-white rounded-[2rem] shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 overflow-hidden mb-10 p-4 md:p-8">
            <div className="space-y-4">
              {!epData.vocabulary || epData.vocabulary.length === 0 ? (
                <div className="text-center py-16 text-gray-400 font-medium">등록된 단어가 없습니다.</div>
              ) : (
                epData.vocabulary.map((voca, idx) => {
                  const isPlayingVoca = playingVocaIndex === idx;
                  return (
                    <div key={idx} className={`p-5 rounded-2xl border transition-all duration-300 ${isPlayingVoca ? 'border-indigo-500 bg-indigo-50/30 shadow-md' : 'border-gray-100 bg-white hover:border-indigo-200 hover:bg-gray-50/50'}`}>
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1">
                          <h3 className={`text-2xl md:text-3xl font-extrabold mb-1 tracking-tight ${isPlayingVoca ? 'text-indigo-700' : 'text-gray-900'}`}>{voca.word}</h3>
                          <p className="text-base md:text-lg font-bold text-indigo-500/80 mb-4">{voca.meaning}</p>
                          {voca.example && (
                            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                              <p className="text-sm md:text-base font-medium text-gray-700 leading-relaxed">{voca.example}</p>
                            </div>
                          )}
                        </div>
                        <button 
                          onClick={() => playVoca(idx)}
                          className={`shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition-all ${isPlayingVoca ? 'bg-indigo-600 text-white shadow-lg scale-95' : 'bg-gray-100 text-gray-600 hover:bg-indigo-50 hover:text-indigo-600'}`}
                        >
                          <span className={`${isPlayingVoca ? 'animate-pulse' : ''} text-xl ml-1`}>{isPlayingVoca ? '🔊' : '▶'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* --- 🇰🇷 한국형 게시판 스타일: 연관 에피소드 리스트 --- */}
        <div className="bg-white rounded-[2rem] shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 overflow-hidden p-6 md:p-8">
          <h3 className="text-xl font-extrabold text-gray-900 mb-5 tracking-tight">주변 에피소드</h3>
          <div className="space-y-1">
            {adjacentEpisodes.map((ep) => {
              const isCurrent = ep.id === epId;
              return (
                <div 
                  key={ep.id} 
                  onClick={() => !isCurrent && handleNavigate(ep.id)}
                  className={`flex items-center gap-4 p-4 rounded-2xl transition-all ${isCurrent ? 'bg-indigo-50/80 cursor-default' : 'hover:bg-gray-50 cursor-pointer'}`}
                >
                  <div className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center text-xs font-bold ${isCurrent ? 'bg-indigo-600 text-white shadow-md' : 'bg-gray-100 text-gray-500'}`}>
                    {isCurrent ? '▶' : ep.id}
                  </div>
                  <div className="flex-1">
                    <p className={`text-base md:text-lg font-bold line-clamp-1 tracking-tight ${isCurrent ? 'text-indigo-700' : 'text-gray-900'}`}>
                      {ep.title[lang]}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* --- 📱 모바일 하단 고정 플레이어 컨트롤러 --- */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-gray-200 p-3 pb-safe z-50 flex items-center justify-between md:hidden shadow-[0_-10px_40px_rgba(0,0,0,0.08)]">
        <button onClick={() => handleNavigate(prevEpId)} disabled={!prevEpId} className="p-3 text-gray-500 disabled:opacity-30 disabled:cursor-not-allowed hover:text-indigo-600">
          <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 20 20"><path d="M8.445 14.832A1 1 0 0010 14v-2.798l5.445 3.63A1 1 0 0017 14V6a1 1 0 00-1.555-.832L10 8.798V6a1 1 0 00-1.555-.832l-6 4a1 1 0 000 1.664l6 4z"/></svg>
        </button>
        <button onClick={togglePlayAll} className={`w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-xl text-white ${isPlayingAll ? 'bg-indigo-600 scale-95' : 'bg-gray-900 hover:scale-105'}`}>
          <span className="text-2xl ml-1">{isPlayingAll ? '⏸' : '▶'}</span>
        </button>
        <button onClick={() => handleNavigate(nextEpId)} disabled={!nextEpId} className="p-3 text-gray-500 disabled:opacity-30 disabled:cursor-not-allowed hover:text-indigo-600">
          <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 20 20"><path d="M11.555 5.168A1 1 0 0010 6v2.798L4.555 5.168A1 1 0 003 6v8a1 1 0 001.555.832L10 11.202V14a1 1 0 001.555.832l6-4a1 1 0 000-1.664l-6-4z"/></svg>
        </button>
      </div>

    </div>
  );
}