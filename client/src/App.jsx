import { Route, Routes } from "react-router-dom";
import Navbar from "./components/layout/Navbar";
import CartPage from "./pages/CartPage";
import Home from "./pages/Home";
import ProfilePage from "./pages/ProfilePage";

function App() {
  return (
    <main className="bg-bg min-h-screen">
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Routes>
    </main>
  );
}

export default App;
