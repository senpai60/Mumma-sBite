import { Route, Routes } from "react-router-dom";
import Navbar from "./components/layout/Navbar";
import CartPage from "./pages/CartPage";
import Home from "./pages/Home";
import ProfilePage from "./pages/ProfilePage";
import AuthPage from "./pages/AuthPage";
import { useEffect } from "react";

import { useAuth } from "./context/AuthContext";

function App() {
  const {logoutUser,user} = useAuth();
  // useEffect(()=>{
  //   console.log("USER IN APP JSX ===>",user);
  //   const logout = async() => {
  //     await logoutUser();
  //   };
  //   logout()
  // },[])
  return (
    <main className="bg-bg min-h-screen">
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/cart" element={user ? <CartPage /> : <AuthPage />} />
        <Route path="/profile" element={user ? <ProfilePage /> : <AuthPage />} />
        <Route path="/auth" element={<AuthPage />} />
      </Routes>
    </main>
  );
}

export default App;
