import { useState, useRef, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import courses from '../data/courses.json';

export default function Player() {
  // --- 기존 로직 (절대 수정하지 않음) ---
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

  if (isLoading || !epData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 rounded-full border-4 border-gray-200 border-t-indigo-600 animate-spin mb-4" />
          <p className="text-gray-400 font-medium">Loading Episode...</p>
        </div>
      </div>
    );
  }

  // --- 🎨 리메이크된 UI (Return 문) ---
  return (
    <div className="min-h-screen bg-gray-50/50 pb-32 font-sans text-gray-900 overflow-x-hidden">
      
      {/* 🏛️ Sticky Header (PC & Mobile 상단 고정) */}
      <div className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-gray-100 shadow-sm transition-all duration-300">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          
          {/* Header Top: Back & Badge */}
          <div className="flex items-center justify-between py-3">
            <Link to={`/course/${epData.metadata.course}`} className="text-gray-400 hover:text-indigo-600 flex items-center gap-1.5 text-sm font-semibold group transition-colors">
              <span className="group-hover:-translate-x-1 transition-transform">←</span> Back
            </Link>
            <div className="flex gap-1.5">
              <span className="text-[11px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full uppercase tracking-tight">EP {epData.metadata.id}</span>
              {epData.metadata.level && (
                <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full uppercase">{epData.metadata.level}</span>
              )}
            </div>
          </div>

          {/* Header Content: Title & Desktop Controls */}
          <div className="flex items-end justify-between gap-6 pb-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-3xl font-black tracking-tight text-gray-900 truncate">
                {epData.metadata.title[lang] || epData.metadata.title.en}
              </h1>
              <p className="text-xs sm:text-sm font-medium text-gray-400 mt-1 uppercase tracking-wider">{courseData?.title?.[lang] || 'PODCAST COURSE'}</p>
            </div>

            {/* Desktop Only Controls */}
            <div className="hidden md:flex items-center gap-4 shrink-0 mb-1">
              <button onClick={() => handleNavigate(prevEpId)} disabled={!prevEpId} className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 disabled:opacity-30 transition-all">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M8.445 14.832A1 1 0 0010 14v-2.798l5.445 3.63A1 1 0 0017 14V6a1 1 0 00-1.555-.832L10 8.798V6a1 1 0 00-1.555-.832l-6 4a1 1 0 000 1.664l6 4z"/></svg>
              </button>
              <button onClick={togglePlayAll} className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-lg active:scale-95 text-white ${isPlayingAll ? 'bg-indigo-600' : 'bg-gray-900 hover:shadow-indigo-200'}`}>
                {isPlayingAll ? (
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd"/></svg>
                ) : (
                  <svg className="w-6 h-6 ml-1" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd"/></svg>
                )}
              </button>
              <button onClick={() => handleNavigate(nextEpId)} disabled={!nextEpId} className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 disabled:opacity-30 transition-all">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M11.555 5.168A1 1 0 0010 6v2.798L4.555 5.168A1 1 0 003 6v8a1 1 0 001.555.832L10 11.202V14a1 1 0 001.555.832l6-4a1 1 0 000-1.664l-6-4z"/></svg>
              </button>
            </div>
          </div>

          {/* Sticky Tabs */}
          <div className="flex gap-8 border-t border-gray-50 pt-1">
            {['script', 'voca'].map((tab) => (
              <button 
                key={tab}
                onClick={() => handleTabChange(tab)}
                className={`pb-3 text-sm font-bold transition-all border-b-2 ${activeTab === tab ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
              >
                {tab === 'script' ? 'SCRIPT' : 'VOCABULARY'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 pt-10 pb-20">
        
        {/* 📝 SCRIPT VIEW: 카드 스타일 */}
        {activeTab === 'script' && (
          <div className="space-y-4">
            {epData.content.map((item, index) => {
              if (item.type === 'FX') return null;
              const isPlaying = currentIndex === index; 
              const isMina = item.speaker.includes('Mina') || item.speaker.includes('MINA');

              return (
                <div 
                  key={index} 
                  ref={(el) => (lineRefs.current[index] = el)}
                  onClick={() => { setIsPlayingAll(false); playLine(index); }}
                  className={`group p-6 rounded-2xl bg-white border-2 transition-all cursor-pointer shadow-sm ${isPlaying ? 'border-indigo-500 ring-4 ring-indigo-50 shadow-md transform scale-[1.01]' : 'border-transparent hover:border-gray-200'}`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${isMina ? 'bg-indigo-600 text-white' : 'bg-gray-900 text-white'}`}>
                      {item.speaker.replace(/\s*\(.*?\)\s*/g, '').trim()}
                    </span>
                    {isPlaying && <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping" />}
                  </div>
                  <p className={`text-xl sm:text-2xl font-bold leading-snug tracking-tight transition-colors ${isPlaying ? 'text-gray-900' : 'text-gray-600'}`}>
                    {item.text}
                  </p>
                  {item.translation && (
                    <p className={`text-sm sm:text-base font-medium mt-3 text-gray-400 group-hover:text-gray-500 transition-colors`}>
                      {item.translation}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* 📚 VOCABULARY VIEW: 정돈된 카드 */}
        {activeTab === 'voca' && (
          <div className="space-y-4">
            {epData.vocabulary?.map((voca, idx) => {
              const isPlayingVoca = playingVocaIndex === idx;
              return (
                <div key={idx} onClick={() => playVoca(idx)} className={`p-6 rounded-3xl bg-white border-2 transition-all cursor-pointer shadow-sm ${isPlayingVoca ? 'border-indigo-500 ring-4 ring-indigo-50' : 'border-transparent hover:border-gray-100'}`}>
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h3 className={`text-2xl font-black tracking-tight ${isPlayingVoca ? 'text-indigo-600' : 'text-gray-900'}`}>{voca.word}</h3>
                      <p className="text-sm font-bold text-indigo-400 mt-1">{voca.meaning}</p>
                    </div>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isPlayingVoca ? 'bg-indigo-600 text-white shadow-md' : 'bg-gray-100 text-gray-400'}`}>
                      <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd"/></svg>
                    </div>
                  </div>
                  {voca.example && (
                    <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                      <p className="text-sm sm:text-base font-medium text-gray-600 leading-relaxed italic">"{voca.example}"</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* 🇰🇷 연관 에피소드 리스트 (하단) */}
        <div className="mt-20">
          <h4 className="text-sm font-black text-gray-400 mb-4 tracking-widest uppercase">UP NEXT</h4>
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm divide-y divide-gray-50 overflow-hidden">
            {adjacentEpisodes.map((ep) => {
              const isCurrent = ep.id === epId;
              return (
                <div 
                  key={ep.id} 
                  onClick={() => !isCurrent && handleNavigate(ep.id)}
                  className={`flex items-center gap-4 p-5 transition-all group ${isCurrent ? 'bg-indigo-50/30' : 'hover:bg-gray-50 cursor-pointer'}`}
                >
                  <div className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center text-xs font-black transition-all ${isCurrent ? 'bg-indigo-600 text-white shadow-md' : 'bg-gray-100 text-gray-400 group-hover:bg-gray-900 group-hover:text-white'}`}>
                    {ep.id}
                  </div>
                  <p className={`text-base font-bold flex-1 truncate ${isCurrent ? 'text-indigo-700' : 'text-gray-700'}`}>
                    {ep.title[lang]}
                  </p>
                  {isCurrent && <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Playing</span>}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 📱 Mobile Bottom Floating Controller */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-sm bg-gray-900/95 backdrop-blur-xl border border-white/10 rounded-full py-4 px-8 z-50 flex items-center justify-between md:hidden shadow-2xl">
        <button onClick={() => handleNavigate(prevEpId)} disabled={!prevEpId} className="text-white/50 disabled:opacity-20 active:scale-90 transition-all p-2">
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M8.445 14.832A1 1 0 0010 14v-2.798l5.445 3.63A1 1 0 0017 14V6a1 1 0 00-1.555-.832L10 8.798V6a1 1 0 00-1.555-.832l-6 4a1 1 0 000 1.664l6 4z"/></svg>
        </button>
        <button onClick={togglePlayAll} className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-xl active:scale-95 ${isPlayingAll ? 'bg-indigo-600 text-white' : 'bg-white text-gray-900'}`}>
          {isPlayingAll ? (
            <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd"/></svg>
          ) : (
            <svg className="w-7 h-7 ml-1" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd"/></svg>
          )}
        </button>
        <button onClick={() => handleNavigate(nextEpId)} disabled={!nextEpId} className="text-white/50 disabled:opacity-20 active:scale-90 transition-all p-2">
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M11.555 5.168A1 1 0 0010 6v2.798L4.555 5.168A1 1 0 003 6v8a1 1 0 001.555.832L10 11.202V14a1 1 0 001.555.832l6-4a1 1 0 000-1.664l-6-4z"/></svg>
        </button>
      </div>

    </div>
  );
}