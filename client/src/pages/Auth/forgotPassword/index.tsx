import { useState } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import { Link } from 'react-router';
import { HiOutlineMail } from 'react-icons/hi';
import AuthLayout from '@/layout/AuthLayout';
import { forgotPasswordSchema } from './validation';
import { axiosInstance } from '@/config/axios';
import { API_ENDPOINTS } from '@/constants';
import { useToast } from '@/hooks/useToast';
import type { FormikHelpers } from 'formik';

const ForgotPasswordPage = () => {
  const toast = useToast();

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (
    values: { email: string },
    { resetForm }: FormikHelpers<{ email: string }>
  ) => {
    setLoading(true);

    try {
      const response = await axiosInstance.post(API_ENDPOINTS.FORGOT_PASSWORD, {
        email: values.email,
      });

      toast.success(response.data?.message || 'If an account exists, a reset link has been sent.');

      resetForm();
    } catch (error: unknown) {
      const err = error as {
        response?: { data?: { message?: string } };
        message?: string;
      };

      const msg =
        err.response?.data?.message ||
        err.message ||
        'Failed to request reset link. Please try again.';

      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Forgot Password?"
      subtitle="No worries. Enter your email address and we'll send you a secure password reset link."
      footer={
        <>
          Remember your password?
          <Link
            to="/login"
            className="ml-2 font-semibold text-[var(--text-primary)] hover:underline"
          >
            Sign In
          </Link>
        </>
      }
    >
      <Formik
        initialValues={{
          email: '',
        }}
        validationSchema={forgotPasswordSchema}
        onSubmit={handleSubmit}
      >
        <Form className="space-y-6">
          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-medium text-[var(--text-secondary)]"
            >
              Email Address
            </label>

            <div className="group flex h-14 items-center rounded-2xl border border-[var(--bg-grey)] bg-[var(--bg-tertiary)] px-4 transition-all duration-200 focus-within:border-[var(--text-primary)] focus-within:ring-4 focus-within:ring-[var(--bg-grey)]">
              <HiOutlineMail className="mr-3 text-xl text-[var(--text-secondary)] transition-colors group-focus-within:text-[var(--text-primary)]" />

              <Field
                id="email"
                name="email"
                type="email"
                placeholder="john@example.com"
                disabled={loading}
                className="h-full w-full bg-transparent outline-none placeholder:text-[var(--text-secondary)]"
              />
            </div>

            <ErrorMessage
              name="email"
              component="p"
              className="mt-2 text-sm text-red-500 dark:text-red-400"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="group flex h-14 w-full items-center justify-center rounded-2xl bg-[var(--bg-secondary)] text-base font-semibold text-white shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:opacity-90 hover:shadow-xl active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
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
                Sending Reset Link...
              </>
            ) : (
              <>
                Send Reset Link
                <span className="ml-2 transition-transform duration-300 group-hover:translate-x-1">
                  →
                </span>
              </>
            )}
          </button>
        </Form>
      </Formik>
    </AuthLayout>
  );
};

export default ForgotPasswordPage;
