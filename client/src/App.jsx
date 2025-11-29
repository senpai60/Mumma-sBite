import { Route, Routes } from "react-router-dom";
import Navbar from "./components/layout/Navbar";
import CartPage from "./pages/CartPage";
import Home from "./pages/Home";

function App() {
  return (
    <main className="bg-bg min-h-screen">
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/cart" element={<CartPage />} />
      </Routes>
    </main>
  );
}

export default App;
