import { Route, Routes } from "react-router-dom";
import Navbar from "./components/layout/Navbar";
import CartPage from "./pages/CartPage";
import Home from "./pages/Home";
import ProfilePage from "./pages/ProfilePage";
import AuthPage from "./pages/AuthPage";
import PaymentPage from "./pages/PaymentPage";
import OrdersPage from "./pages/OrdersPage";
import OrderDetailsPage from "./pages/OrderDetailsPage";


import { useAuth } from "./context/AuthContext";

function App() {
  const {user} = useAuth();
  
  return (
    <main className="bg-bg min-h-screen">
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/cart" element={user ? <CartPage /> : <AuthPage />} />
        <Route path="/payment" element={user ? <PaymentPage /> : <AuthPage />} />
        <Route path="/orders" element={user ? <OrdersPage /> : <AuthPage />} />
        <Route path="/orders/:orderId" element={user ? <OrderDetailsPage /> : <AuthPage />} />
        <Route path="/profile" element={user ? <ProfilePage /> : <AuthPage />} />
        <Route path="/auth" element={<AuthPage />} />
      </Routes>
    </main>
  );
}

export default App;
