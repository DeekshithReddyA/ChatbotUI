import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Home } from "./pages/Home";
import { ProtectedRoute } from "./pages/ProtectedRoute";

function App() {
   
    return (
      <Router>
      <Routes>
          <Route path="/" element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
              } />
      </Routes>
    </Router>
  )
}

export default App
