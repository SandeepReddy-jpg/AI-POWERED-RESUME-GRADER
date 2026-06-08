function Footer() {
  return (
    <footer className="border-t border-[#e8e3dc] bg-[#1a1a2e] py-8 mt-16">
      <div className="max-w-5xl mx-auto px-6 flex items-center justify-between">
        <p className="text-xs text-[#9e98b8]">
          © {new Date().getFullYear()} ResumeAI. All rights reserved.
        </p>
        <p className="text-xs text-[#9e98b8]">
          Powered by OpenAI &amp; Gemini
        </p>
      </div>
    </footer>
  );
}

export default Footer;
