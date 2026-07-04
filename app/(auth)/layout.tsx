export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#07120d] text-[#f5f2e8]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(198,121,63,0.24),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(98,155,120,0.2),_transparent_30%)]" />
      <div className="absolute inset-0 opacity-25 [background-image:linear-gradient(rgba(198,121,63,0.16)_1px,transparent_1px),linear-gradient(90deg,rgba(198,121,63,0.16)_1px,transparent_1px)] [background-size:48px_48px]" />
      <div className="absolute left-6 top-6 h-24 w-24 rounded-full border border-[#c6793f]/30 bg-[#c6793f]/10 blur-2xl" />
      <div className="absolute bottom-8 right-8 h-28 w-28 rounded-full border border-[#7aa98c]/30 bg-[#7aa98c]/10 blur-2xl" />
      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
        {children}
      </div>
    </div>
  );
}
