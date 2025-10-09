import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LanguageSelection from "./components/heropg";
import Registration from "./components/Registration";
import Login from "./pages/Login";
import { LanguageProvider } from "./contexts/LanguageContext"; 

function App() {
  return (
    <LanguageProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LanguageSelection />} />
          <Route path="/register" element={<Registration />} />
          <Route path="/login" element={<Login />} />
        </Routes>
      </Router>
    </LanguageProvider>
  );
}

export default App;
