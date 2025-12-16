import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

const languages = [
  { code: "darija", name: "الدارجة", flag: "🇲🇦", subtitle: "Darija" },
  { code: "english", name: "English", flag: "🇬🇧", subtitle: "English" },
  { code: "french", name: "Français", flag: "🇫🇷", subtitle: "French" },
  { code: "german", name: "Deutsch", flag: "🇩🇪", subtitle: "German" },
];

const LanguageSelection = () => {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<string | null>(null);

  const handleContinue = () => {
    if (selected) {
      localStorage.setItem("chatKafi_language", selected);
      navigate("/chat");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-emerald-100/60 via-background to-red-100/50 dark:from-emerald-950/30 dark:via-background dark:to-red-950/40 relative overflow-hidden px-4">
      {/* Moroccan Zellige Pattern Overlay */}
      <div className="absolute inset-0 opacity-[0.06] dark:opacity-[0.08] pointer-events-none" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke-width='1.5'%3E%3Cpath d='M40 0 L80 40 L40 80 L0 40 Z' stroke='%23166534' stroke-opacity='0.8'/%3E%3Cpath d='M40 10 L70 40 L40 70 L10 40 Z' stroke='%23dc2626' stroke-opacity='0.6'/%3E%3Cpath d='M40 20 L60 40 L40 60 L20 40 Z' stroke='%23166534' stroke-opacity='0.7'/%3E%3Ccircle cx='40' cy='40' r='8' stroke='%23dc2626' stroke-opacity='0.5'/%3E%3Cpath d='M40 0 L40 80 M0 40 L80 40' stroke='%23166534' stroke-opacity='0.4'/%3E%3C/g%3E%3C/svg%3E")`,
        backgroundSize: '80px 80px'
      }} />
      
      {/* Background blurs */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-red-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* Logo */}
      <div className="mb-8 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="inline-flex p-4 bg-gradient-to-br from-red-600 to-red-700 rounded-2xl shadow-lg shadow-red-500/30 mb-4">
          <svg className="h-12 w-12" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path 
              d="M50 5 L61.8 38.2 L97.5 38.2 L68.9 58.8 L80.9 92 L50 71.4 L19.1 92 L31.1 58.8 L2.5 38.2 L38.2 38.2 Z" 
              stroke="#4ade80" 
              strokeWidth="6" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              fill="none"
            />
          </svg>
        </div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-emerald-600 bg-clip-text text-transparent">
          ChatKafi
        </h1>
        <p className="text-muted-foreground mt-2">اختار اللغة / Choose your language</p>
      </div>

      {/* Language Options */}
      <div className="grid grid-cols-2 gap-4 w-full max-w-md mb-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
        {languages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => setSelected(lang.code)}
            className={`relative p-6 rounded-2xl border-2 transition-all duration-300 text-center group hover:scale-[1.02] ${
              selected === lang.code
                ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/20 shadow-lg shadow-emerald-500/20"
                : "border-border bg-background/80 hover:border-red-300 hover:bg-red-50/30 dark:hover:bg-red-900/10"
            }`}
          >
            {selected === lang.code && (
              <div className="absolute top-2 right-2 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
                <Check className="h-4 w-4 text-white" />
              </div>
            )}
            <span className="text-4xl mb-2 block">{lang.flag}</span>
            <span className="text-lg font-semibold block text-foreground">{lang.name}</span>
            <span className="text-sm text-muted-foreground">{lang.subtitle}</span>
          </button>
        ))}
      </div>

      {/* Continue Button */}
      <Button
        onClick={handleContinue}
        disabled={!selected}
        size="lg"
        className="w-full max-w-md h-14 text-lg font-semibold bg-gradient-to-r from-red-600 to-emerald-600 hover:from-red-700 hover:to-emerald-700 text-white shadow-lg shadow-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed animate-in fade-in slide-in-from-bottom-8 duration-900"
      >
        يلاه نبداو / Let's Start
      </Button>
    </div>
  );
};

export default LanguageSelection;
