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
  const [courseData, setCourseData] = useState(null);
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

  // --- 🇰🇷 주변 에피소드 리스트 로직 ---
  const [adjacentEpisodes, setAdjacentEpisodes] = useState([]);
  const [prevEpId, setPrevEpId] = useState(null);
  const [nextEpId, setNextEpId] = useState(null);

  useEffect(() => {
    if (epData && epData.metadata.course) {
      const currentCourse = courses.find(c => c.id === epData.metadata.course);
      if (currentCourse) {
        setCourseData(currentCourse);
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
    window.scrollTo({ top: 0, behavior: 'smooth' }); // 탭 바꿀 때 맨 위로
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

    // 스크롤 위치 조정 (스티키 헤더에 가리지 않게 중앙으로)
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

  if (isLoading || !epData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#F5F5F7]">
        {isLoading ? (
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-600 mb-4"></div>
        ) : (
          <p className="text-xl font-bold text-gray-700">에피소드를 찾을 수 없어요. 😢</p>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F7] pb-32">
      
      {/* 🌟 통합 스티키(Sticky) 헤더: PC & 모바일 공통으로 상단에 딱 붙습니다! */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-2xl border-b border-gray-200/50 shadow-sm px-4 md:px-8 pt-4 md:pt-6 pb-0 transition-all">
        <div className="max-w-4xl mx-auto">
          
          {/* 헤더 상단: 뒤로가기 & 뱃지 */}
          <div className="flex justify-between items-start mb-2 md:mb-4">
            <Link to={`/course/${epData.metadata.course}`} className="text-indigo-600 hover:text-indigo-800 font-bold text-sm inline-flex items-center gap-1 transition-colors">
              ← Back
            </Link>
            <div className="flex gap-2">
              <span className="hidden md:inline-block text-xs font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">⏱ {epData.metadata.duration[lang]}</span>
              {epData.metadata.level && (
                <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md">{epData.metadata.level}</span>
              )}
            </div>
          </div>

          {/* 헤더 중앙: 제목 & 플레이어 컨트롤 */}
          <div className="flex items-center justify-between gap-4 mb-4 md:mb-6">
            <div className="flex-1">
              <p className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">EPISODE {epData.metadata.id}</p>
              <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight text-gray-900 leading-tight line-clamp-2">
                {epData.metadata.title[lang] || epData.metadata.title.en}
              </h1>
            </div>

            {/* PC 전용 우측 재생 컨트롤 (모바일은 하단바 유지) */}
            <div className="hidden md:flex items-center gap-3 shrink-0">
              <button onClick={() => handleNavigate(prevEpId)} disabled={!prevEpId} className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 disabled:opacity-30 transition-colors">
                <span className="text-lg">⏪</span>
              </button>
              <button onClick={togglePlayAll} className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-md text-white ${isPlayingAll ? 'bg-indigo-600' : 'bg-gray-900 hover:scale-105 hover:shadow-lg'}`}>
                <span className="text-2xl ml-1">{isPlayingAll ? '⏸' : '▶'}</span>
              </button>
              <button onClick={() => handleNavigate(nextEpId)} disabled={!nextEpId} className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 disabled:opacity-30 transition-colors">
                <span className="text-lg">⏩</span>
              </button>
            </div>
          </div>

          {/* 헤더 하단: 탭 (스크롤해도 헤더와 함께 따라다님) */}
          <div className="flex gap-6 border-t border-gray-100/50 pt-1">
            <button 
              onClick={() => handleTabChange('script')}
              className={`pb-3 text-sm md:text-base font-extrabold transition-all duration-300 border-b-[3px] ${activeTab === 'script' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
            >
              📝 대본
            </button>
            <button 
              onClick={() => handleTabChange('voca')}
              className={`pb-3 text-sm md:text-base font-extrabold transition-all duration-300 border-b-[3px] ${activeTab === 'voca' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
            >
              📚 단어장
            </button>
          </div>

        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 md:py-12">
        
        {/* --- 🎵 옵션 A: 애플 뮤직 가사창 감성의 스크립트 --- */}
        {activeTab === 'script' && (
          <div className="space-y-10 md:space-y-14">
            {epData.content.map((item, index) => {
              if (item.type === 'FX') return null;
              const isMina = item.speaker.includes('Mina') || item.speaker.includes('MINA');
              const isPlaying = currentIndex === index; 
              const cleanSpeakerName = item.speaker.replace(/\s*\(.*?\)\s*/g, '').trim();

              return (
                <div 
                  key={index} 
                  ref={(el) => (lineRefs.current[index] = el)}
                  // 🔥 핵심: 재생 중인 문장은 또렷하게, 안 읽은 문장은 흐리고 반투명하게!
                  className={`flex flex-col items-start gap-2 transition-all duration-700 ease-in-out ${isPlaying ? 'opacity-100 scale-100 transform-none' : 'opacity-30 scale-95 hover:opacity-60 cursor-pointer'}`}
                  onClick={() => { setIsPlayingAll(false); playLine(index); }}
                >
                  <span className={`text-xs md:text-sm font-extrabold uppercase tracking-widest transition-colors ${isPlaying ? (isMina ? 'text-indigo-600' : 'text-gray-900') : 'text-gray-500'}`}>
                    {cleanSpeakerName}
                  </span>

                  {/* 재생 가능(한국어) 대사 */}
                  {item.playable ? (
                    <p className={`text-3xl md:text-5xl font-extrabold tracking-tighter leading-[1.2] transition-colors ${isPlaying ? 'text-gray-900' : 'text-gray-500'}`}>
                      {item.text}
                    </p>
                  ) : (
                    // 재생 불가능(영어) 대사
                    <p className={`text-2xl md:text-4xl font-bold tracking-tight leading-[1.2] transition-colors ${isPlaying ? 'text-gray-800' : 'text-gray-400'}`}>
                      {item.text}
                    </p>
                  )}

                  {/* 번역문 */}
                  {item.translation && (
                    <p className={`text-lg md:text-xl font-medium mt-2 transition-colors ${isPlaying ? 'text-gray-500' : 'text-gray-400'}`}>
                      {item.translation}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* --- 📚 단어장 (VOCA) --- */}
        {activeTab === 'voca' && (
          <div className="space-y-6">
            {!epData.vocabulary || epData.vocabulary.length === 0 ? (
              <div className="text-center py-20 text-gray-400 font-medium">등록된 단어가 없습니다.</div>
            ) : (
              epData.vocabulary.map((voca, idx) => {
                const isPlayingVoca = playingVocaIndex === idx;
                return (
                  <div key={idx} className={`p-6 md:p-8 rounded-[2rem] border transition-all duration-300 ${isPlayingVoca ? 'border-indigo-500 bg-white shadow-xl scale-[1.02]' : 'border-transparent bg-white/60 shadow-sm hover:bg-white hover:shadow-md cursor-pointer'}`} onClick={() => playVoca(idx)}>
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <h3 className={`text-3xl md:text-4xl font-extrabold mb-2 tracking-tight ${isPlayingVoca ? 'text-indigo-700' : 'text-gray-900'}`}>{voca.word}</h3>
                        <p className="text-lg md:text-xl font-bold text-indigo-500/80 mb-4">{voca.meaning}</p>
                        {voca.example && (
                          <div className="bg-gray-50/80 rounded-2xl p-4 md:p-5">
                            <p className="text-base md:text-lg font-medium text-gray-700 leading-relaxed">{voca.example}</p>
                          </div>
                        )}
                      </div>
                      <button 
                        className={`shrink-0 w-14 h-14 rounded-full flex items-center justify-center transition-all ${isPlayingVoca ? 'bg-indigo-600 text-white shadow-lg' : 'bg-gray-100 text-gray-400 hover:bg-indigo-50 hover:text-indigo-600'}`}
                      >
                        <span className={`${isPlayingVoca ? 'animate-pulse' : ''} text-2xl ml-1`}>{isPlayingVoca ? '🔊' : '▶'}</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* --- 🇰🇷 연관 에피소드 리스트 --- */}
        <div className="mt-16 pt-10 border-t border-gray-200/50">
          <h3 className="text-xl font-extrabold text-gray-900 mb-6 tracking-tight">주변 에피소드</h3>
          <div className="bg-white/60 backdrop-blur-md rounded-[2rem] border border-gray-100/50 overflow-hidden shadow-sm p-4 md:p-6">
            <div className="space-y-2">
              {adjacentEpisodes.map((ep) => {
                const isCurrent = ep.id === epId;
                return (
                  <div 
                    key={ep.id} 
                    onClick={() => !isCurrent && handleNavigate(ep.id)}
                    className={`flex items-center gap-4 p-4 rounded-2xl transition-all ${isCurrent ? 'bg-white shadow-md border border-gray-100 cursor-default' : 'hover:bg-white cursor-pointer border border-transparent hover:shadow-sm'}`}
                  >
                    <div className={`w-12 h-12 shrink-0 rounded-full flex items-center justify-center text-sm font-bold ${isCurrent ? 'bg-indigo-600 text-white shadow-md' : 'bg-gray-100 text-gray-500'}`}>
                      {isCurrent ? '▶' : ep.id}
                    </div>
                    <div className="flex-1">
                      <p className={`text-lg font-bold line-clamp-1 tracking-tight ${isCurrent ? 'text-indigo-700' : 'text-gray-800'}`}>
                        {ep.title[lang]}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>

      {/* --- 📱 모바일 하단 고정 플레이어 컨트롤러 --- */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-2xl border-t border-gray-200/50 p-3 pb-safe z-50 flex items-center justify-between md:hidden shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
        <button onClick={() => handleNavigate(prevEpId)} disabled={!prevEpId} className="p-3 text-gray-500 disabled:opacity-30 hover:text-indigo-600">
          <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 20 20"><path d="M8.445 14.832A1 1 0 0010 14v-2.798l5.445 3.63A1 1 0 0017 14V6a1 1 0 00-1.555-.832L10 8.798V6a1 1 0 00-1.555-.832l-6 4a1 1 0 000 1.664l6 4z"/></svg>
        </button>
        <button onClick={togglePlayAll} className={`w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-xl text-white ${isPlayingAll ? 'bg-indigo-600 scale-95' : 'bg-gray-900 hover:scale-105'}`}>
          <span className="text-2xl ml-1">{isPlayingAll ? '⏸' : '▶'}</span>
        </button>
        <button onClick={() => handleNavigate(nextEpId)} disabled={!nextEpId} className="p-3 text-gray-500 disabled:opacity-30 hover:text-indigo-600">
          <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 20 20"><path d="M11.555 5.168A1 1 0 0010 6v2.798L4.555 5.168A1 1 0 003 6v8a1 1 0 001.555.832L10 11.202V14a1 1 0 001.555.832l6-4a1 1 0 000-1.664l-6-4z"/></svg>
        </button>
      </div>

    </div>
  );
}