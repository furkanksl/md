export const Footer = () => {
  return (
    <footer className="border-t border-[#E7E5E4] py-12 flex flex-col md:flex-row justify-between items-center gap-6 opacity-60 w-full">
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 rounded bg-[#44403C] flex items-center justify-center text-[#FAF9F6] text-[10px] font-bold">
          md
        </div>
        <span className="text-xs font-medium">My Drawer</span>
      </div>
      <div className="flex gap-6 text-xs font-medium">
        <a href="https://x.com/frknksglu" target="_blank" rel="noreferrer" className="hover:text-[#44403C]">
          follow me on twitter/x
        </a>
      </div>
      <div className="text-xs">
        © {new Date().getFullYear()} Open Source by <a href="https://furkanksl.com" target="_blank" rel="noreferrer" className="hover:text-[#44403C]">furkanksl.com</a>.
      </div>
    </footer>
  );
};
