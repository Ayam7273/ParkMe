import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import logoNormal from "../assets/parkme-logo.png";

export default function Preloader({ isLoading }) {
  const [show, setShow] = useState(true);

  useEffect(() => {
    if (!isLoading) {
      // Add a small delay before hiding to ensure smooth transition
      const timer = setTimeout(() => {
        setShow(false);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setShow(true);
    }
  }, [isLoading]);

  if (!show) return null;

  return (
    <div
      className={`fixed inset-0 bg-white z-50 flex items-center justify-center transition-opacity duration-300 ${isLoading ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
    >
      <div className="text-center">
        <div className="relative">
          <Loader2 className="w-16 h-16 text-blue-600 animate-spin mx-auto mb-4" />
          <div className="absolute inset-0 flex items-center justify-center">
        
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin">
            <img src={logoNormal} alt="ParkMe Logo" className="h-10 w-auto rounded p-1"/>
            </div>
          </div>
        </div>
        <p className="text-gray-600">Loading your parking experience...</p>
        <div className="mt-4 flex justify-center gap-1">
          <div
            className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
            style={{ animationDelay: "0ms" }}
          ></div>
          <div
            className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
            style={{ animationDelay: "150ms" }}
          ></div>
          <div
            className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
            style={{ animationDelay: "300ms" }}
          ></div>
        </div>
      </div>
    </div>
  );
}
