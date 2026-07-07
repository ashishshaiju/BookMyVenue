import { useState, useRef, useEffect } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import { Link, useNavigate, useLocation } from 'react-router';
import {
  HiOutlineUser,
  HiOutlineMail,
  HiOutlineLockClosed,
  HiOutlineEye,
  HiOutlineInformationCircle,
  HiOutlineCheckCircle,
} from 'react-icons/hi';
import { HiOutlineEyeSlash } from 'react-icons/hi2';
import AuthLayout from '@/layout/AuthLayout';
import { signupSchema } from './validation';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { extractErrorMessage } from '@/utils/toast';

const RegisterPage = () => {
  const { register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showPasswordHint, setShowPasswordHint] = useState(false);

  const hintRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (hintRef.current && !hintRef.current.contains(event.target as Node)) {
        setShowPasswordHint(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (showPasswordHint) {
      const timer = setTimeout(() => {
        setShowPasswordHint(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showPasswordHint]);

  const searchParams = new URLSearchParams(location.search);
  const redirectParam = searchParams.get('redirect');

  const loginLink = redirectParam
    ? `/login?redirect=${encodeURIComponent(redirectParam)}`
    : '/login';

  return (
    <AuthLayout
      title="Create Account ✨"
      subtitle="Join thousands of people discovering the perfect venue for every occasion."
      footer={
        <>
          Already have an account?
          <Link to={loginLink} className="ml-2 font-semibold text-zinc-900 hover:underline">
            Sign In
          </Link>
        </>
      }
    >
      <Formik
        initialValues={{
          name: '',
          email: '',
          password: '',
          confirmPassword: '',
        }}
        validationSchema={signupSchema}
        onSubmit={async (values, { setSubmitting, resetForm }) => {
          try {
            await register(values.name, values.email, values.password);

            toast.success('Account created successfully! Redirecting to login...');

            resetForm();

            setTimeout(() => {
              navigate(loginLink);
            }, 2000);
          } catch (err: unknown) {
            toast.error(extractErrorMessage(err) || 'Registration failed. Please try again.');
          } finally {
            setSubmitting(false);
          }
        }}
      >
        {({ isSubmitting, values }) => (
          <Form className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              {/* Name */}

              <div>
                <label htmlFor="name" className="mb-2 block text-sm font-medium text-zinc-700">
                  Full Name
                </label>

                <div className="group flex h-14 items-center rounded-2xl border border-zinc-300 bg-white px-4 transition-all duration-200 focus-within:border-black focus-within:ring-4 focus-within:ring-zinc-200">
                  <HiOutlineUser className="mr-3 text-xl text-zinc-400 transition-colors group-focus-within:text-black" />

                  <Field
                    id="name"
                    name="name"
                    type="text"
                    placeholder="John Doe"
                    className="h-full w-full bg-transparent outline-none placeholder:text-zinc-400"
                  />
                </div>

                <ErrorMessage name="name" component="p" className="mt-2 text-sm text-red-500" />
              </div>

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
                    className="h-full w-full bg-transparent outline-none placeholder:text-zinc-400"
                  />
                </div>

                <ErrorMessage name="email" component="p" className="mt-2 text-sm text-red-500" />
              </div>
            </div>

            {/* Password */}
            <div className="grid grid-cols-1 gap-6">
              {/* Password */}

              <div className="relative">
                <div ref={hintRef} className="mb-2 relative flex items-center justify-between">
                  <label htmlFor="password" className="block text-sm font-medium text-zinc-700">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPasswordHint(!showPasswordHint)}
                    className="flex items-center gap-1.5 opacity-50 transition hover:opacity-100 focus:outline-none"
                  >
                    <HiOutlineInformationCircle size={16} className="text-zinc-500" />
                    <span className="text-xs text-zinc-500">Password requirements</span>
                  </button>

                  {/* Password Hint Tooltip */}
                  <div
                    className={`absolute right-0 top-[calc(100%+0.5rem)] z-20 w-max max-w-[calc(100vw-2rem)] rounded-2xl border border-zinc-200 bg-zinc-50 p-4 shadow-xl transition-all duration-200 ${
                      showPasswordHint
                        ? 'translate-y-0 opacity-100 visible'
                        : '-translate-y-2 opacity-0 invisible'
                    }`}
                  >
                    <h4 className="mb-2 text-sm font-semibold text-zinc-800">
                      Password Requirements
                    </h4>

                    <ul className="space-y-2 text-sm">
                      <li
                        className={`flex items-center gap-1.5 ${values.password.length >= 8 ? 'text-green-600' : 'text-zinc-500'}`}
                      >
                        {values.password.length >= 8 ? (
                          <HiOutlineCheckCircle className="text-green-500" size={16} />
                        ) : (
                          <span className="w-4 text-center">•</span>
                        )}
                        <span>Minimum 8 characters</span>
                      </li>
                      <li
                        className={`flex items-center gap-1.5 ${/[A-Z]/.test(values.password) ? 'text-green-600' : 'text-zinc-500'}`}
                      >
                        {/[A-Z]/.test(values.password) ? (
                          <HiOutlineCheckCircle className="text-green-500" size={16} />
                        ) : (
                          <span className="w-4 text-center">•</span>
                        )}
                        <span>One uppercase letter</span>
                      </li>
                      <li
                        className={`flex items-center gap-1.5 ${/[a-z]/.test(values.password) ? 'text-green-600' : 'text-zinc-500'}`}
                      >
                        {/[a-z]/.test(values.password) ? (
                          <HiOutlineCheckCircle className="text-green-500" size={16} />
                        ) : (
                          <span className="w-4 text-center">•</span>
                        )}
                        <span>One lowercase letter</span>
                      </li>
                      <li
                        className={`flex items-center gap-1.5 ${/[0-9]/.test(values.password) ? 'text-green-600' : 'text-zinc-500'}`}
                      >
                        {/[0-9]/.test(values.password) ? (
                          <HiOutlineCheckCircle className="text-green-500" size={16} />
                        ) : (
                          <span className="w-4 text-center">•</span>
                        )}
                        <span>One number</span>
                      </li>
                      <li
                        className={`flex items-center gap-1.5 ${/[^A-Za-z0-9]/.test(values.password) ? 'text-green-600' : 'text-zinc-500'}`}
                      >
                        {/[^A-Za-z0-9]/.test(values.password) ? (
                          <HiOutlineCheckCircle className="text-green-500" size={16} />
                        ) : (
                          <span className="w-4 text-center">•</span>
                        )}
                        <span>One special character</span>
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="group flex h-14 items-center rounded-2xl border border-zinc-300 bg-white px-4 transition-all duration-200 focus-within:border-black focus-within:ring-4 focus-within:ring-zinc-200">
                  <HiOutlineLockClosed className="mr-3 text-xl text-zinc-400 transition-colors group-focus-within:text-black" />

                  <Field
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Create password"
                    className="h-full w-full bg-transparent outline-none placeholder:text-zinc-400"
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

              {/* Confirm Password */}

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="mb-2 block text-sm font-medium text-zinc-700"
                >
                  Confirm Password
                </label>

                <div className="group flex h-14 items-center rounded-2xl border border-zinc-300 bg-white px-4 transition-all duration-200 focus-within:border-black focus-within:ring-4 focus-within:ring-zinc-200">
                  <HiOutlineLockClosed className="mr-3 text-xl text-zinc-400 transition-colors group-focus-within:text-black" />

                  <Field
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm password"
                    className="h-full w-full bg-transparent outline-none placeholder:text-zinc-400"
                  />

                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="text-zinc-400 transition hover:text-zinc-700"
                  >
                    {showConfirmPassword ? (
                      <HiOutlineEyeSlash size={22} />
                    ) : (
                      <HiOutlineEye size={22} />
                    )}
                  </button>
                </div>

                <ErrorMessage
                  name="confirmPassword"
                  component="p"
                  className="mt-2 text-sm text-red-500"
                />
              </div>
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
                  Creating Account...
                </>
              ) : (
                <>
                  Create Account
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

export default RegisterPage;
