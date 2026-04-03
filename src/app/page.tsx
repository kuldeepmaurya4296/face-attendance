import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6">

      <div className="w-full max-w-3xl flex flex-col items-center text-center space-y-10">

        {/* Header */}
        <div className="space-y-3">
          <p className="text-[12px] text-muted font-medium uppercase tracking-wide">
            AI Attendance System
          </p>
          <h1 className="text-[24px] font-bold text-foreground">
            Aura — Facial Recognition Attendance
          </h1>
          <p className="text-[14px] text-muted max-w-xl mx-auto">
            Eliminate buddy punching and streamline operations with AI-powered liveness detection and biometric matching.
          </p>
        </div>

        {/* Access Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl">

          <Link
            href="/auth/login"
            className="p-6 border border-border rounded-lg bg-surface hover:bg-surface-hover text-left space-y-3"
          >
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h3 className="text-[16px] font-semibold text-foreground">Employee / Admin Dashboard</h3>
            <p className="text-[12px] text-muted">
              Log in to mark attendance, request leave, or manage your organization.
            </p>
          </Link>

          <Link
            href="/kiosk"
            className="p-6 border border-border rounded-lg bg-surface hover:bg-surface-hover text-left space-y-3"
          >
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="text-[16px] font-semibold text-foreground">KIOSK Mode</h3>
            <p className="text-[12px] text-muted">
              Launch the wall-mounted or tablet interface for walk-in attendance scanning.
            </p>
          </Link>

        </div>
      </div>
    </main>
  );
}
