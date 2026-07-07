import { useState } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import { Link, useNavigate, useLocation } from 'react-router';
import { HiOutlineMail, HiOutlineLockClosed, HiOutlineEye } from 'react-icons/hi';
import { HiOutlineEyeSlash } from 'react-icons/hi2';
import AuthLayout from '@/layout/AuthLayout';
import { signinSchema } from './validation';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { extractErrorMessage } from '@/utils/toast';
import { getSafeRedirectUrl } from '@/utils/redirect';

const LoginPage = () => {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [showPassword, setShowPassword] = useState(false);

  const searchParams = new URLSearchParams(location.search);
  const redirectParam = searchParams.get('redirect');

  const registerLink = redirectParam
    ? `/register?redirect=${encodeURIComponent(redirectParam)}`
    : '/register';

  return (
    <AuthLayout
      title="Welcome Back 👋"
      subtitle="Sign in to continue discovering amazing venues for your next celebration."
      footer={
        <>
          Don't have an account?
          <Link to={registerLink} className="ml-2 font-semibold text-zinc-900 hover:underline">
            Create Account
          </Link>
        </>
      }
    >
      <Formik
        initialValues={{
          email: '',
          password: '',
        }}
        validationSchema={signinSchema}
        onSubmit={async (values, { setSubmitting }) => {
          try {
            await login(values.email, values.password);

            toast.success("Welcome back! You're now signed in.");

            const localRedirect = localStorage.getItem('redirectUrl');

            let finalRedirect = '/';

            if (redirectParam && localRedirect && redirectParam === localRedirect) {
              finalRedirect = getSafeRedirectUrl(redirectParam);
            } else if (redirectParam) {
              finalRedirect = getSafeRedirectUrl(redirectParam);
            } else if (localRedirect) {
              finalRedirect = getSafeRedirectUrl(localRedirect);
            }

            try {
              localStorage.removeItem('redirectUrl');
            } catch {
              // Ignore localStorage errors
            }

            navigate(finalRedirect);
          } catch (err: unknown) {
            toast.error(extractErrorMessage(err) || 'Invalid email or password');
          } finally {
            setSubmitting(false);
          }
        }}
      >
        {({ isSubmitting }) => (
          <Form className="space-y-6">
            {/* Email */}

            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium text-zinc-700">
                Email Address
              </label>

              <div className="group flex h-14 items-center rounded-2xl border border-zinc-300 bg-white px-4 transition-all duration-200 focus-within:border-black focus-within:ring-4 focus-within:ring-zinc-200">
                <HiOutlineMail className="mr-3 text-xl text-zinc-400 transition-colors group-focus-within:text-black" />

                <Field
                  id="email"
                  name="email"
                  type="email"
                  placeholder="john@example.com"
                  className="h-full w-full bg-transparent text-zinc-900 outline-none placeholder:text-zinc-400"
                />
              </div>

              <ErrorMessage name="email" component="p" className="mt-2 text-sm text-red-500" />
            </div>

            {/* Password */}

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label htmlFor="password" className="text-sm font-medium text-zinc-700">
                  Password
                </label>

                <Link
                  to="/forgot-password"
                  className="text-sm font-medium text-zinc-600 transition hover:text-black hover:underline"
                >
                  Forgot Password?
                </Link>
              </div>

              <div className="group flex h-14 items-center rounded-2xl border border-zinc-300 bg-white px-4 transition-all duration-200 focus-within:border-black focus-within:ring-4 focus-within:ring-zinc-200">
                <HiOutlineLockClosed className="mr-3 text-xl text-zinc-400 transition-colors group-focus-within:text-black" />

                <Field
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  className="h-full w-full bg-transparent text-zinc-900 outline-none placeholder:text-zinc-400"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-zinc-400 transition hover:text-zinc-700"
                >
                  {showPassword ? <HiOutlineEyeSlash size={22} /> : <HiOutlineEye size={22} />}
                </button>
              </div>

              <ErrorMessage name="password" component="p" className="mt-2 text-sm text-red-500" />
            </div>
            {/* Remember Me */}

            <div className="flex items-center justify-between">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-600">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-zinc-300 text-black focus:ring-black"
                />
                Remember me
              </label>
            </div>

            {/* Submit */}

            <button
              type="submit"
              disabled={isSubmitting}
              className="group flex h-14 w-full items-center justify-center rounded-2xl bg-zinc-900 text-base font-semibold text-white shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:bg-black hover:shadow-xl active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <svg
                    className="mr-2 h-5 w-5 animate-spin"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-20"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />

                    <path
                      className="opacity-90"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                    />
                  </svg>
                  Signing In...
                </>
              ) : (
                <>
                  Sign In
                  <span className="ml-2 transition-transform duration-300 group-hover:translate-x-1">
                    →
                  </span>
                </>
              )}
            </button>
          </Form>
        )}
      </Formik>
    </AuthLayout>
  );
};

export default LoginPage;
