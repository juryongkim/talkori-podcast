import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

export default function MyStudy() {
  const [savedVoca, setSavedVoca] = useState([]);
  const [savedScript, setSavedScript] = useState([]);
  const [activeTab, setActiveTab] = useState('voca');
  
  const audioRef = useRef(null);
  const CDN_BASE_URL = "https://talkori.b-cdn.net/podcast/reaction";

  // 화면이 켜질 때 로컬 스토리지에서 장바구니 데이터를 싹 불러옵니다.
  useEffect(() => {
    const voca = JSON.parse(localStorage.getItem('talkori_saved_voca')) || [];
    const script = JSON.parse(localStorage.getItem('talkori_saved_script')) || [];
    setSavedVoca(voca);
    setSavedScript(script);

    return () => {
      if (audioRef.current) audioRef.current.pause();
    };
  }, []);

  // 🗑️ 다 외운 단어 삭제 함수
  const removeVoca = (wordToRemove) => {
    const updated = savedVoca.filter(v => v.word !== wordToRemove);
    setSavedVoca(updated);
    localStorage.setItem('talkori_saved_voca', JSON.stringify(updated));
  };

  // 🗑️ 다 외운 문장 삭제 함수
  const removeScript = (textToRemove) => {
    const updated = savedScript.filter(s => s.text !== textToRemove);
    setSavedScript(updated);
    localStorage.setItem('talkori_saved_script', JSON.stringify(updated));
  };

  // 🔊 저장된 항목 오디오 재생
  const playAudio = (epId, audioFile) => {
    if (audioRef.current) audioRef.current.pause();
    if (!audioFile) return;
    
    const audioUrl = `${CDN_BASE_URL}/ep${epId}/${audioFile}`;
    const audio = new Audio(audioUrl);
    audioRef.current = audio;
    audio.play().catch(e => console.error("재생 에러:", e));
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 md:px-8 bg-gray-50 min-h-screen">
      
      {/* --- 상단 타이틀 & 탭 --- */}
      <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-200 mb-6">
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-gray-900 mb-2">
          📚 My Study
        </h1>
        <p className="text-gray-500 font-medium text-sm mb-6">
          내가 별표 친 단어와 문장만 모아서 집중 학습하세요!
        </p>

        <div className="flex border-t border-gray-100 pt-4">
          <button 
            onClick={() => setActiveTab('voca')}
            className={`flex-1 pb-2 text-sm md:text-base font-bold transition-colors ${activeTab === 'voca' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
          >
            단어장 ({savedVoca.length})
          </button>
          <button 
            onClick={() => setActiveTab('script')}
            className={`flex-1 pb-2 text-sm md:text-base font-bold transition-colors ${activeTab === 'script' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
          >
            주요 문장 ({savedScript.length})
          </button>
        </div>
      </div>

      {/* --- 학습장 리스트 영역 --- */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-6 md:p-8 pb-32 min-h-[50vh]">
        
        {/* 📚 단어장 탭 렌더링 */}
        {activeTab === 'voca' && (
          <div className="space-y-4">
            {savedVoca.length === 0 ? (
              <div className="text-center py-20 text-gray-400 font-medium">
                <span className="text-3xl block mb-3">☆</span>
                아직 저장된 단어가 없습니다.<br/>에피소드를 들으며 별표를 눌러보세요!
              </div>
            ) : (
              savedVoca.map((voca, idx) => (
                <div key={idx} className="flex flex-col items-start gap-1 p-4 rounded-xl transition-all duration-300 border bg-white border-gray-100 hover:border-indigo-100">
                  <div className="flex justify-between items-start w-full mb-1">
                    <div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">
                        EPISODE {voca.epId}
                      </span>
                      <h3 className="text-xl font-extrabold text-gray-900">
                        {voca.word}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => playAudio(voca.epId, voca.audio)}
                        className="w-8 h-8 rounded-full flex items-center justify-center bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors"
                      >
                        ▶
                      </button>
                      <button 
                        onClick={() => removeVoca(voca.word)}
                        className="text-yellow-400 hover:scale-110 text-2xl transition-transform"
                        title="저장 취소"
                      >
                        ★
                      </button>
                    </div>
                  </div>
                  <p className="text-sm font-bold text-indigo-500 mb-2">{voca.meaning}</p>
                  {voca.example && (
                    <div className="bg-gray-50 rounded-lg p-3 w-full border border-gray-100/50">
                      <p className="text-sm text-gray-600 font-medium">{voca.example}</p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* 📝 문장 탭 렌더링 */}
        {activeTab === 'script' && (
          <div className="space-y-4">
            {savedScript.length === 0 ? (
              <div className="text-center py-20 text-gray-400 font-medium">
                <span className="text-3xl block mb-3">☆</span>
                아직 저장된 문장이 없습니다.<br/>에피소드를 들으며 별표를 눌러보세요!
              </div>
            ) : (
              savedScript.map((item, idx) => (
                <div key={idx} className="flex flex-col items-start gap-1 p-4 rounded-xl transition-all duration-300 border bg-white border-gray-100 hover:border-indigo-100">
                  <div className="flex justify-between items-start w-full mb-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">
                      EPISODE {item.epId} • {item.speaker}
                    </span>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => playAudio(item.epId, item.audio)}
                        className="w-8 h-8 rounded-full flex items-center justify-center bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors"
                      >
                        ▶
                      </button>
                      <button 
                        onClick={() => removeScript(item.text)}
                        className="text-yellow-400 hover:scale-110 text-2xl transition-transform"
                        title="저장 취소"
                      >
                        ★
                      </button>
                    </div>
                  </div>
                  <p className="text-lg font-bold text-gray-900 leading-snug mb-1">{item.text}</p>
                  {item.translation && (
                    <p className="text-sm text-gray-500 font-medium pl-2 border-l-2 border-gray-200">
                      {item.translation}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        )}

      </div>
    </div>
  );
}