import type { ReactNode } from 'react';
import { FaBuilding, FaCalendarCheck, FaShieldAlt, FaUsers } from 'react-icons/fa';

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}

const features = [
  {
    icon: <FaCalendarCheck />,
    title: 'Instant Booking',
    description: 'Reserve venues in just a few clicks.',
  },
  {
    icon: <FaUsers />,
    title: 'Trusted Hosts',
    description: 'Thousands of verified venue owners.',
  },
  {
    icon: <FaShieldAlt />,
    title: 'Secure Payments',
    description: 'Book confidently with protected transactions.',
  },
];

const AuthLayout = ({ title, subtitle, children, footer }: AuthLayoutProps) => {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-zinc-50 via-white to-zinc-100">
      {/* Background Blobs */}
      <div className="absolute left-[-140px] top-[-140px] h-80 w-80 rounded-full bg-zinc-300/30 blur-3xl" />
      <div className="absolute bottom-[-120px] right-[-120px] h-96 w-96 rounded-full bg-zinc-400/20 blur-3xl" />
      <div className="absolute left-1/2 top-1/3 h-72 w-72 -translate-x-1/2 rounded-full bg-zinc-200/20 blur-3xl" />

      <div className="relative mx-auto flex min-h-screen max-w-7xl items-center justify-between px-6 py-10 lg:px-12">
        {/* Left Section */}
        <div className="hidden max-w-xl lg:block">
          <div className="mb-10 flex h-20 w-20 items-center justify-center rounded-3xl bg-black shadow-xl">
            <FaBuilding className="text-4xl text-white" />
          </div>

          <h1 className="text-6xl font-bold tracking-tight text-zinc-900">BookMyVenue</h1>

          <p className="mt-6 text-xl leading-8 text-zinc-600">
            Find and book the perfect venue for weddings, parties, corporate events and
            unforgettable celebrations.
          </p>

          <div className="mt-14 space-y-7">
            {features.map((feature) => (
              <div key={feature.title} className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-black text-lg text-white shadow-md">
                  {feature.icon}
                </div>

                <div>
                  <h3 className="font-semibold text-zinc-900">{feature.title}</h3>

                  <p className="mt-1 text-sm leading-6 text-zinc-500">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Card */}
        <div className="w-full max-w-lg">
          <div className="rounded-[32px] border border-zinc-200/70 bg-white/80 p-8 shadow-2xl backdrop-blur-xl lg:p-10">
            {/* Mobile Logo */}
            <div className="mb-8 flex justify-center lg:hidden">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-black shadow-lg">
                <FaBuilding className="text-3xl text-white" />
              </div>
            </div>

            <div className="text-center lg:text-left">
              <h2 className="text-4xl font-bold tracking-tight text-zinc-900">{title}</h2>

              <p className="mt-3 text-zinc-500">{subtitle}</p>
            </div>

            <div className="mt-8">{children}</div>

            {footer && (
              <div className="mt-8 border-t border-zinc-200 pt-4 text-center text-sm text-zinc-500">
                {footer}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
