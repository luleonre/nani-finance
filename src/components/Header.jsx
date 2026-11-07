// src/components/Header.jsx
export default function Header() {
  return (
    <header className="w-full bg-[#E8DCC4] border-b border-[#D8C4A0] px-4 py-3 flex items-center justify-between">
      <h1 className="text-xl font-bold tracking-widest text-[#2C2623] uppercase">
        NANI FINANCE
      </h1>
      <span className="text-xs bg-[#D66853] text-white px-2.5 py-1 rounded-full font-medium">
        PWA
      </span>
    </header>
  );
}