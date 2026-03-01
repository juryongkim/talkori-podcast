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
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaylistOpen, setIsPlaylistOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('script');
  const [playingVocaIndex, setPlayingVocaIndex] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(null);
  const [isPlayingAll, setIsPlayingAllState] = useState(false);
  
  // ✨ 글로벌 배속 상태 관리 (0.8x, 1.0x, 1.2x, 1.5x)
  const [playbackRate, setPlaybackRate] = useState(1.0);
  
  const audioRef = useRef(null);
  const autoPlayRef = useRef(false);
  const lineRefs = useRef([]);
  const lastPlayedIndexRef = useRef(0); 

  const CDN_BASE_URL = "https://talkori.b-cdn.net/podcast/reaction";

  // ==========================================
  // [로컬 스토리지 북마크 로직]
  // ==========================================
  const [savedVoca, setSavedVoca] = useState(() => {
    const saved = localStorage.getItem('talkori_saved_voca');
    return saved ? JSON.parse(saved) : [];
  });

  const [savedScript, setSavedScript] = useState(() => {
    const saved = localStorage.getItem('talkori_saved_script');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('talkori_saved_voca', JSON.stringify(savedVoca));
  }, [savedVoca]);

  useEffect(() => {
    localStorage.setItem('talkori_saved_script', JSON.stringify(savedScript));
  }, [savedScript]);

  const getTodayDate = () => {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    const dateOffset = new Date(now.getTime() - offset);
    return dateOffset.toISOString().split('T')[0];
  };

  const toggleVocaBookmark = (voca, e) => {
    e.stopPropagation();
    const isSaved = savedVoca.some(v => v.word === voca.word);
    if (isSaved) {
      setSavedVoca(savedVoca.filter(v => v.word !== voca.word));
    } else {
      setSavedVoca([...savedVoca, { ...voca, epId, dateSaved: getTodayDate() }]); 
    }
  };

  const toggleScriptBookmark = (item, e) => {
    e.stopPropagation();
    const isSaved = savedScript.some(s => s.text === item.text);
    if (isSaved) {
      setSavedScript(savedScript.filter(s => s.text !== item.text));
    } else {
      setSavedScript([...savedScript, { ...item, epId, dateSaved: getTodayDate() }]); 
    }
  };

  // ==========================================
  // ✨ 배속 변경 함수 (버튼 누를 때마다 순환)
  // ==========================================
  const cyclePlaybackRate = () => {
    const rates = [0.8, 1.0, 1.2, 1.5];
    const nextIndex = (rates.indexOf(playbackRate) + 1) % rates.length;
    const newRate = rates[nextIndex];
    setPlaybackRate(newRate);
    
    // 현재 재생 중인 오디오가 있다면 즉시 배속 적용
    if (audioRef.current) {
      audioRef.current.playbackRate = newRate;
    }
  };

  // ==========================================

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
    setIsPlaylistOpen(false); 

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
    window.scrollTo({ top: 0, behavior: 'smooth' }); // 탭 이동 시 스크롤 위로
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
    
    // ✨ 오디오 생성 시점에 배속 적용
    audio.playbackRate = playbackRate;

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

    // ✨ 단어 오디오에도 배속 적용
    audio.playbackRate = playbackRate;

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

  const handleLineClick = (index) => {
    setIsPlayingAll(false);
    playLine(index);
  };

  const currentCourse = epData ? courses.find(c => c.id === epData.metadata.course) : null;
  const playlistEps = currentCourse ? [...currentCourse.episodes].sort((a,b) => parseInt(a.id) - parseInt(b.id)) : [];

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen w-full bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600 mb-4"></div>
      </div>
    );
  }

  if (!epData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen w-full bg-gray-50">
        <p className="text-xl font-bold text-gray-700 mb-4">앗! 에피소드를 찾을 수 없어요. 😢</p>
        <Link to="/course/real-reaction" className="text-indigo-600 hover:underline">목록으로 돌아가기</Link>
      </div>
    );
  }

  const displayTitle = typeof epData.metadata.title === 'object' ? (epData.metadata.title[lang] || epData.metadata.title.en) : epData.metadata.title;

  const PlaylistContent = () => (
    <div className="flex flex-col h-full bg-white">
      <div className="p-6 border-b border-gray-100 shrink-0">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">{currentCourse?.icon || '🎙️'}</span>
          <h2 className="text-lg font-extrabold text-gray-900 leading-tight">
            {currentCourse?.title[lang] || 'Talkori Course'}
          </h2>
        </div>
        <p className="text-sm font-bold text-gray-400">총 {playlistEps.length}개의 에피소드</p>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-1">
        {playlistEps.map((ep) => {
          const isCurrent = ep.id === epId;
          return (
            <div key={ep.id} onClick={() => { if(!isCurrent) navigate(`/player/${ep.id}`); }} className={`flex flex-col p-3 rounded-xl cursor-pointer transition-all ${isCurrent ? 'bg-indigo-50 border border-indigo-100' : 'hover:bg-gray-50 border border-transparent'}`}>
              <div className="flex items-center justify-between mb-1">
                <span className={`text-[10px] font-bold uppercase tracking-widest ${isCurrent ? 'text-indigo-600' : 'text-gray-400'}`}>EPISODE {ep.id}</span>
                {isCurrent && <span className="text-[10px] bg-indigo-600 text-white px-1.5 py-0.5 rounded animate-pulse">PLAYING</span>}
              </div>
              <p className={`text-sm font-bold line-clamp-2 leading-snug ${isCurrent ? 'text-indigo-900' : 'text-gray-700'}`}>{ep.title[lang]}</p>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="flex w-full min-h-screen bg-gray-50">
      
      <aside className="hidden lg:flex flex-col w-[320px] xl:w-[380px] bg-white border-r border-gray-200 h-screen sticky top-0 shrink-0 shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-10">
        <PlaylistContent />
      </aside>

      {isPlaylistOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setIsPlaylistOpen(false)}></div>
          <div className="relative w-4/5 max-w-sm bg-white h-full ml-auto shadow-2xl flex flex-col transform transition-transform animate-slide-in-right">
            <button onClick={() => setIsPlaylistOpen(false)} className="absolute top-4 right-4 z-10 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 font-bold">✕</button>
            <PlaylistContent />
          </div>
        </div>
      )}

      <main className="flex-1 w-full relative">
        <div className="max-w-3xl mx-auto md:px-4 py-0 md:py-8 pb-32">
          
          {/* ==================================================== */}
          {/* ✨ 반응형 스티키 플레이어 헤더 (모바일 슬림화 / PC 기존유지) */}
          {/* ==================================================== */}
          <div className="bg-white pt-2 pb-0 px-2 md:p-6 rounded-b-2xl md:rounded-3xl shadow-sm border-b md:border border-gray-200 mb-4 md:mb-6 sticky top-0 md:top-4 z-20 transition-all">
            
            {/* 💻 [PC 전용 레이아웃] */}
            <div className="hidden md:block text-center relative">
              <Link to={`/course/${epData.metadata.course || 'real-reaction'}`} className="text-gray-400 absolute left-2 top-2 hover:text-gray-600 text-sm font-bold">
                ← List
              </Link>
              
              {/* PC 전용 배속 버튼 */}
              <button onClick={cyclePlaybackRate} className="absolute right-2 top-1 text-gray-500 bg-gray-100 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-gray-200 transition-colors">
                배속: {playbackRate}x
              </button>

              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">EPISODE {epId}</p>
              <h1 className="text-xl font-extrabold tracking-tight text-gray-900 mb-1 line-clamp-2 px-16">
                {displayTitle}
              </h1>
              <p className="text-indigo-600 font-medium text-sm mb-6">Real Reaction</p>
              
              <div className="flex items-center justify-center gap-8 mb-4">
                <button className="text-gray-400 hover:text-gray-600 font-bold text-xl">⏪</button>
                <button onClick={togglePlayAll} className={`${isPlayingAll ? 'bg-indigo-600' : 'bg-gray-900'} text-white w-14 h-14 rounded-full flex items-center justify-center hover:bg-indigo-500 transition-colors shadow-md text-xl`}>
                  {isPlayingAll ? '⏸' : '▶'}
                </button>
                <button className="text-gray-400 hover:text-gray-600 font-bold text-xl">⏩</button>
              </div>
            </div>

            {/* 📱 [모바일 전용 슬림 레이아웃] */}
            <div className="md:hidden flex flex-col gap-2 pt-1 pb-1">
              
              {/* 모바일 1열: 뒤로가기 / 제목 / 목차 버튼 */}
              <div className="flex items-center justify-between w-full">
                <Link to={`/course/${epData.metadata.course || 'real-reaction'}`} className="text-gray-500 p-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
                </Link>
                
                <div className="flex-1 flex flex-col items-center mx-2 overflow-hidden">
                  <p className="text-[9px] font-bold text-indigo-500 uppercase tracking-widest">EPISODE {epId}</p>
                  <h1 className="text-sm font-extrabold text-gray-900 truncate w-full text-center">
                    {displayTitle}
                  </h1>
                </div>

                <button onClick={() => setIsPlaylistOpen(true)} className="text-indigo-600 bg-indigo-50 p-1.5 px-2.5 rounded-md text-xs font-bold">
                  ☰
                </button>
              </div>

              {/* 모바일 2열: 배속 조절 / 재생 컨트롤 */}
              <div className="flex items-center justify-between px-3 mt-1">
                <button onClick={cyclePlaybackRate} className="text-[11px] font-bold text-gray-600 bg-gray-100 px-2 py-1.5 rounded-md w-12 text-center shadow-sm">
                  {playbackRate}x
                </button>
                
                <div className="flex items-center gap-6">
                  <button className="text-gray-400 text-sm">⏪</button>
                  <button onClick={togglePlayAll} className={`${isPlayingAll ? 'bg-indigo-600' : 'bg-gray-900'} text-white w-10 h-10 rounded-full flex items-center justify-center shadow-md`}>
                    <span className="text-sm">{isPlayingAll ? '⏸' : '▶'}</span>
                  </button>
                  <button className="text-gray-400 text-sm">⏩</button>
                </div>
                
                <div className="w-12"></div> {/* 우측 밸런스 여백 */}
              </div>
            </div>

            {/* --- 공통 탭 (PC/모바일 동일) --- */}
            <div className="flex border-t border-gray-100 pt-3 mt-2 md:mt-2 md:pt-4 mx-2 md:mx-0">
              <button onClick={() => handleTabChange('script')} className={`flex-1 pb-2 text-sm md:text-base font-bold transition-colors ${activeTab === 'script' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}>
                📝 대본 (Script)
              </button>
              <button onClick={() => handleTabChange('voca')} className={`flex-1 pb-2 text-sm md:text-base font-bold transition-colors ${activeTab === 'voca' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}>
                📚 단어장 (Vocabulary)
              </button>
            </div>
          </div>
          {/* ==================================================== */}

          {/* 콘텐츠 영역 (스크립트 & 단어장) */}
          <div className="bg-white md:rounded-3xl shadow-sm border-y md:border border-gray-200 p-4 md:p-8 pb-32">
            <h2 className="hidden md:block text-sm font-bold text-gray-400 uppercase tracking-widest mb-6 border-b border-gray-100 pb-2">
              {activeTab === 'script' ? 'Interactive Script' : 'Vocabulary List'}
            </h2>
            
            {activeTab === 'script' && (
              <div className="space-y-6">
                {epData.content.map((item, index) => {
                  if (item.type === 'FX') return null;
                  const isMina = item.speaker.toUpperCase().includes('MINA');
                  const isPlaying = currentIndex === index; 
                  const isSaved = savedScript.some(s => s.text === item.text);

                  return (
                    <div key={index} ref={(el) => (lineRefs.current[index] = el)} className={`relative flex flex-col items-start gap-1 p-2 -mx-2 rounded-xl transition-all duration-300 ${isPlaying ? 'bg-indigo-50/50 border-l-4 border-indigo-400 pl-4' : 'border-l-4 border-transparent pl-4 hover:bg-gray-50/50'}`}>
                      <div className="flex justify-between items-center w-full">
                        <span className={`text-xs font-bold uppercase ${isMina ? 'text-indigo-500' : 'text-gray-400'}`}>
                          {item.speaker} {item.emotion && <span className="font-normal opacity-70">({item.emotion})</span>}
                        </span>
                        {item.playable && (
                          <button onClick={(e) => toggleScriptBookmark(item, e)} className={`text-xl transition-transform hover:scale-110 ${isSaved ? 'text-yellow-400' : 'text-gray-300 hover:text-yellow-400'}`}>
                            {isSaved ? '★' : '☆'}
                          </button>
                        )}
                      </div>

                      {item.playable ? (
                        <p onClick={() => handleLineClick(index)} className={`text-xl font-bold cursor-pointer rounded-lg transition-colors flex items-center gap-2 group pr-8 ${isPlaying ? 'text-indigo-600' : 'text-gray-900 hover:text-indigo-500'}`}>
                          {item.text} <span className={`text-sm transition-colors ${isPlaying ? 'text-indigo-600 animate-pulse' : 'text-gray-300 group-hover:text-indigo-400'}`}>{isPlaying ? '🔊' : '▶'}</span>
                        </p>
                      ) : (
                        <p onClick={() => handleLineClick(index)} className={`text-lg px-2 py-1 -ml-2 rounded-lg transition-colors cursor-pointer pr-8 ${isPlaying ? 'text-indigo-600 font-bold' : 'text-gray-800 hover:text-gray-600'}`}>
                          {item.text}
                        </p>
                      )}

                      {item.translation && <p className="text-sm text-gray-500 font-medium mb-1 pl-2 border-l-2 border-gray-200">{item.translation}</p>}
                      {item.insight && (
                        <div className="mt-2 bg-white/80 border border-indigo-100 p-3 rounded-lg w-full shadow-sm">
                          <h4 className="font-bold text-indigo-900 text-sm flex items-center gap-1">💡 {item.insight.title}</h4>
                          <p className="text-indigo-800/80 text-sm mt-1 leading-relaxed">{item.insight.description}</p>
                          {item.insight.usage_tip && <p className="text-indigo-600/70 text-xs mt-2 font-medium bg-indigo-50 inline-block px-2 py-1 rounded">Tip: {item.insight.usage_tip}</p>}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {activeTab === 'voca' && (
              <div className="space-y-4">
                {!epData.vocabulary || epData.vocabulary.length === 0 ? (
                  <div className="text-center py-10 text-gray-400 font-medium">등록된 단어가 없습니다.</div>
                ) : (
                  epData.vocabulary.map((voca, idx) => {
                    const isPlayingVoca = playingVocaIndex === idx;
                    const isSaved = savedVoca.some(v => v.word === voca.word);

                    return (
                      <div key={idx} className={`flex flex-col items-start gap-1 p-4 rounded-xl transition-all duration-300 border ${isPlayingVoca ? 'bg-indigo-50/50 border-indigo-200 shadow-sm' : 'bg-white border-gray-100 hover:border-indigo-100'}`}>
                        <div className="flex justify-between items-start w-full mb-1">
                          <h3 className={`text-xl font-extrabold flex items-center gap-2 ${isPlayingVoca ? 'text-indigo-700' : 'text-gray-900'}`}>
                            {voca.word}
                            <button onClick={(e) => toggleVocaBookmark(voca, e)} className={`text-xl transition-transform hover:scale-110 mb-1 ${isSaved ? 'text-yellow-400' : 'text-gray-300 hover:text-yellow-400'}`}>
                              {isSaved ? '★' : '☆'}
                            </button>
                          </h3>
                          <button onClick={() => playVoca(idx)} className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${isPlayingVoca ? 'bg-indigo-600 text-white' : 'bg-gray-50 text-gray-400 hover:bg-indigo-50 hover:text-indigo-600'}`}>
                            <span className="text-sm">{isPlayingVoca ? '🔊' : '▶'}</span>
                          </button>
                        </div>
                        <p className="text-sm font-bold text-indigo-500 mb-2">{voca.meaning}</p>
                        {voca.example && <div className="bg-gray-50 rounded-lg p-3 w-full border border-gray-100/50"><p className="text-sm text-gray-600 font-medium">{voca.example}</p></div>}
                      </div>
                    );
                  })
                )}
              </div>
            )}

          </div>
        </div>
      </main>
    </div>
  );
}