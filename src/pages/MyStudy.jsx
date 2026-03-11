import { useState, useEffect, useRef } from 'react';
import { toPng } from 'html-to-image'; 
import { jsPDF } from 'jspdf'; 

export default function MyStudy() {
  const [savedVoca, setSavedVoca] = useState([]);
  const [savedScript, setSavedScript] = useState([]);
  const [activeTab, setActiveTab] = useState('voca');
  const [selectedFolder, setSelectedFolder] = useState('all');
  const [isFolderMenuOpen, setIsFolderMenuOpen] = useState(false); 
  const [isExporting, setIsExporting] = useState(false);

  const audioRef = useRef(null);
  // ✨ 기본 CDN 베이스 (코너별 동적 변경 지원 예정)
  const CDN_BASE_URL = "https://talkori.b-cdn.net/podcast";

  useEffect(() => {
    const voca = JSON.parse(localStorage.getItem('talkori_saved_voca')) || [];
    const script = JSON.parse(localStorage.getItem('talkori_saved_script')) || [];
    setSavedVoca(voca);
    setSavedScript(script);

    return () => {
      if (audioRef.current) audioRef.current.pause();
    };
  }, []);

  const removeVoca = (wordToRemove) => {
    const updated = savedVoca.filter(v => v.word !== wordToRemove);
    setSavedVoca(updated);
    localStorage.setItem('talkori_saved_voca', JSON.stringify(updated));
  };

  const removeScript = (textToRemove) => {
    const updated = savedScript.filter(s => s.text !== textToRemove);
    setSavedScript(updated);
    localStorage.setItem('talkori_saved_script', JSON.stringify(updated));
  };

  const playAudio = (item) => {
    if (audioRef.current) audioRef.current.pause();
    if (!item.audio) return;
    
    // ✨ [수정] 코너 정보가 있으면 해당 폴더로, 없으면 기본 reaction 폴더로 연결
    const coursePath = item.courseId === 'kpop-korean' ? 'kpop' : 'reaction';
    const audioUrl = `${CDN_BASE_URL}/${coursePath}/ep${item.epId}/${item.audio}`;
    
    const audio = new Audio(audioUrl);
    audioRef.current = audio;
    audio.play().catch(e => console.error("재생 에러:", e));
  };

  const getUniqueFolders = () => {
    const dates = new Set([
      ...savedVoca.map(v => v.dateSaved || 'old'),
      ...savedScript.map(s => s.dateSaved || 'old')
    ]);
    
    return Array.from(dates).sort((a, b) => {
      if (a === 'old') return 1;
      if (b === 'old') return -1;
      return b.localeCompare(a); 
    });
  };

  const folders = getUniqueFolders();
  const filteredVoca = selectedFolder === 'all' ? savedVoca : savedVoca.filter(v => (v.dateSaved || 'old') === selectedFolder);
  const filteredScript = selectedFolder === 'all' ? savedScript : savedScript.filter(s => (s.dateSaved || 'old') === selectedFolder);

  const formatDate = (dateStr) => {
    if (dateStr === 'old') return 'Previous Records'; 
    const [y, m, d] = dateStr.split('-');
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${monthNames[parseInt(m) - 1]} ${parseInt(d)}, ${y}`; 
  };

  // ==========================================
  // 🚀 [업그레이드] PDF 내보내기 함수 (필터링 및 CSS 호환성 강화)
  // ==========================================
  const exportToPDF = async () => {
    if (isExporting) return;
    setIsExporting(true); 
    
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const margin = 10; // 상하좌우 여백
      const contentWidth = pdfWidth - (margin * 2);

      // 1. PDF에 담을 모든 카드(단어/문장 박스)들을 가져옵니다.
      const area = document.getElementById('pdf-print-area');
      const cards = area.querySelectorAll('.p-4.rounded-xl.border'); // 카드 박스의 클래스

      let currentY = margin; // 현재 PDF 상의 높이 위치

      // ✨ [추천] 제목 추가 (언제 공부한 건지)
      pdf.setFontSize(18);
      pdf.text(selectedFolder === 'all' ? 'All Study Notes' : formatDate(selectedFolder), margin, currentY + 7);
      currentY += 20;

      for (let i = 0; i < cards.length; i++) {
        const card = cards[i];
        
        // 2. 각 카드를 이미지로 변환
        const canvas = await toPng(card, { 
          backgroundColor: '#ffffff',
          pixelRatio: 2,
          filter: (node) => !node.classList?.contains('pdf-exclude') && !node.classList?.contains('text-yellow-400')
        });

        // 3. 이미지 크기 계산
        const imgProps = pdf.getImageProperties(canvas);
        const imgHeight = (imgProps.height * contentWidth) / imgProps.width;

        // 🚀 [핵심 로직] 현재 위치 + 카드 높이가 페이지 끝을 넘어가면? 새 페이지!
        if (currentY + imgHeight > pdfHeight - margin) {
          pdf.addPage();
          currentY = margin; // 새 페이지에서는 다시 위에서부터 시작
        }

        // 4. PDF에 카드 이미지 추가
        pdf.addImage(canvas, 'PNG', margin, currentY, contentWidth, imgHeight);
        currentY += imgHeight + 5; // 카드 사이 간격 5mm 추가
      }

      const fileName = selectedFolder === 'all' ? 'Talkori_Notes.pdf' : `Talkori_${selectedFolder}.pdf`;
      pdf.save(fileName);
      
    } catch (error) {
      console.error("PDF 에러:", error);
      alert("PDF 생성 중 오류가 발생했습니다."); 
    } finally {
      setIsExporting(false); 
    }
  };

  const FolderListContent = () => (
    <div className="flex flex-col h-full bg-white">
      <div className="p-6 border-b border-gray-100 shrink-0">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">📅</span>
          <h2 className="text-lg font-extrabold text-gray-900">Learning date</h2>
        </div>
        <p className="text-sm font-bold text-gray-400"> {savedVoca.length + savedScript.length} bookmarks</p>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        <div onClick={() => { setSelectedFolder('all'); setIsFolderMenuOpen(false); }} className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${selectedFolder === 'all' ? 'bg-indigo-50 border border-indigo-100' : 'hover:bg-gray-50'}`}>
          <div className="flex items-center gap-3">
            <span className="text-xl">📁</span>
            <p className="text-sm font-bold text-gray-700">View all</p>
          </div>
          <span className="text-xs font-bold bg-white px-2 py-1 rounded-md text-gray-500 shadow-sm">{savedVoca.length + savedScript.length}</span>
        </div>
        {folders.map(dateKey => (
          <div key={dateKey} onClick={() => { setSelectedFolder(dateKey); setIsFolderMenuOpen(false); }} className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${selectedFolder === dateKey ? 'bg-indigo-50 border border-indigo-100' : 'hover:bg-gray-50'}`}>
            <div className="flex items-center gap-3">
              <span className="text-xl">🗓️</span>
              <p className="text-sm font-bold text-gray-700">{formatDate(dateKey)}</p>
            </div>
            <span className="text-xs font-bold bg-white px-2 py-1 rounded-md text-gray-500 shadow-sm">
                {(savedVoca.filter(v => (v.dateSaved || 'old') === dateKey).length + savedScript.filter(s => (s.dateSaved || 'old') === dateKey).length)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="flex w-full min-h-screen bg-gray-50">
      <aside className="hidden lg:flex flex-col w-[320px] xl:w-[380px] bg-white border-r border-gray-200 h-screen sticky top-0 shrink-0 shadow-sm z-10">
        <FolderListContent />
      </aside>

      {isFolderMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setIsFolderMenuOpen(false)}></div>
          <div className="relative w-4/5 max-w-sm bg-white h-full ml-auto shadow-2xl flex flex-col">
            <button onClick={() => setIsFolderMenuOpen(false)} className="absolute top-4 right-4 text-gray-600 font-bold">✕</button>
            <FolderListContent />
          </div>
        </div>
      )}

      <main className="flex-1 w-full relative">
        <div className="max-w-3xl mx-auto px-4 py-8 md:px-8 pb-32">
          <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-200 mb-6 sticky top-4 z-20">
            <div className="flex justify-between items-start mb-2">
              <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">
                {selectedFolder === 'all' ? 'All bookmarks' : formatDate(selectedFolder)}
              </h1>
              <button 
                onClick={exportToPDF}
                disabled={isExporting || (filteredVoca.length === 0 && filteredScript.length === 0)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${isExporting ? 'bg-gray-100 text-gray-400' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white'}`}
              >
                📥 {isExporting ? 'Processing...' : 'Export to PDF'}
              </button>
            </div>
            <p className="text-gray-500 text-sm mb-6">Review your saved items by date.</p>
            <div className="flex border-t border-gray-100 pt-4">
              <button onClick={() => setActiveTab('voca')} className={`flex-1 pb-2 text-sm font-bold ${activeTab === 'voca' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-400'}`}>
                Vocabulary ({filteredVoca.length})
              </button>
              <button onClick={() => setActiveTab('script')} className={`flex-1 pb-2 text-sm font-bold ${activeTab === 'script' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-400'}`}>
                Sentences ({filteredScript.length})
              </button>
            </div>
          </div>

          <div id="pdf-print-area" className="bg-white rounded-3xl shadow-sm border border-gray-200 p-6 md:p-8 min-h-[50vh]">
            {activeTab === 'voca' && (
              <div className="space-y-4">
                {filteredVoca.length === 0 ? <p className="text-center py-20 text-gray-400">No items found.</p> : 
                  filteredVoca.map((voca, idx) => (
                    <div key={idx} className="p-4 rounded-xl border border-gray-100 mb-4">
                      <div className="flex justify-between items-start mb-1">
                        <div>
                          <span className="text-[10px] font-bold text-gray-400 block mb-1 uppercase tracking-widest">{formatDate(voca.dateSaved || 'old')} (EP.{voca.epId})</span>
                          <h3 className="text-xl font-extrabold text-gray-900">{voca.word}</h3>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => playAudio(voca)} className="pdf-exclude w-8 h-8 rounded-full bg-indigo-50 text-indigo-600">▶</button>
                          <button onClick={() => removeVoca(voca.word)} className="text-yellow-400 text-2xl">★</button>
                        </div>
                      </div>
                      <p className="text-sm font-bold text-indigo-500 mb-2">{voca.meaning}</p>
                      {voca.example && <div className="bg-gray-50 p-3 rounded-lg"><p className="text-sm text-gray-600">{voca.example}</p></div>}
                    </div>
                  ))
                }
              </div>
            )}

            {activeTab === 'script' && (
              <div className="space-y-4">
                {filteredScript.length === 0 ? <p className="text-center py-20 text-gray-400">No items found.</p> : 
                  filteredScript.map((item, idx) => (
                    <div key={idx} className="p-4 rounded-xl border border-gray-100 mb-4">
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-[10px] font-bold text-gray-400 block uppercase tracking-widest">EP.{item.epId} • {item.speaker}</span>
                        <div className="flex items-center gap-2">
                          <button onClick={() => playAudio(item)} className="pdf-exclude w-8 h-8 rounded-full bg-indigo-50 text-indigo-600">▶</button>
                          <button onClick={() => removeScript(item.text)} className="text-yellow-400 text-2xl">★</button>
                        </div>
                      </div>
                      <p className="text-lg font-bold text-gray-900 mb-1">{item.text}</p>
                      {item.translation && <p className="text-sm text-gray-500 border-l-2 border-gray-200 pl-2">{item.translation}</p>}
                    </div>
                  ))
                }
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}