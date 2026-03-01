import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import CourseDetail from './pages/CourseDetail';
import Player from './pages/Player';

function App() {
  return (
    <BrowserRouter>
      {/* 애플 스타일: 깔끔한 흰색 배경, 짙은 회색 텍스트 */}
      <div className="min-h-screen bg-white text-gray-900 font-sans antialiased">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/course/:courseId" element={<CourseDetail />} />
          <Route path="/player/:epId" element={<Player />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;