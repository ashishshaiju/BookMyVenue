import { FaBuilding } from 'react-icons/fa';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import { Link, useNavigate, useLocation } from 'react-router';
import { signupSchema } from './validation';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { extractErrorMessage } from '../../utils/toast';

const RegisterPage = () => {
  const { register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const searchParams = new URLSearchParams(location.search);
  const redirectParam = searchParams.get('redirect');
  const loginLink = redirectParam
    ? `/login?redirect=${encodeURIComponent(redirectParam)}`
    : '/login';

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-10 ">
      <div className="flex flex-col items-center gap-4">
        <h1 className="text-[var(--text-primary)] font-sans text-5xl font-bold">Book My Venue</h1>
        <div className="bg-[var(--bg-secondary)] p-2 rounded-sm">
          <FaBuilding className="text-5xl" color="white" />
        </div>
      </div>
      <div className="flex flex-col justify-center items-center">
        <h2 className="text-3xl text-[var(--text-primary)] mt-10 font-semibold">
          Create An Account
        </h2>
        <p className="text-[var(--text-secondary)] mt-2">Join the marketplace for unique spaces.</p>

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
          {({ isSubmitting }) => (
            <Form className="flex flex-col gap-5 w-full mt-10">
              <div className="flex flex-col gap-2">
                <label className="text-[var(--text-secondary)] text-sm" htmlFor="name">
                  Full Name
                </label>
                <Field
                  type="text"
                  id="name"
                  name="name"
                  placeholder="Enter your full name"
                  className="w-full p-3  border border-[var(--text-secondary)] rounded-xl bg-[var(--bg-tertiary)] text-[var(--text-primary)] "
                />
                <div className="h-2">
                  <ErrorMessage name="name" component="p" className="text-red-500 text-sm" />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[var(--text-secondary)] text-sm " htmlFor="email">
                  Email
                </label>
                <Field
                  type="email"
                  id="email"
                  name="email"
                  placeholder="Enter your email"
                  className="w-full p-3  border border-[var(--text-secondary)] rounded-xl bg-[var(--bg-tertiary)] text-[var(--text-primary)]  "
                />
                <div className="h-2">
                  <ErrorMessage name="email" component="p" className="text-red-500 text-sm" />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[var(--text-secondary)] text-sm" htmlFor="password">
                  Password
                </label>
                <Field
                  type="password"
                  id="password"
                  name="password"
                  placeholder="Enter password"
                  className="w-120 p-3  border border-[var(--text-secondary)] rounded-xl bg-[var(--bg-tertiary)] text-[var(--text-primary)]  "
                />
                <div className="h-2">
                  <ErrorMessage name="password" component="p" className="text-red-500 text-sm" />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[var(--text-secondary)] text-sm" htmlFor="cpassword">
                  Confirm Password
                </label>
                <Field
                  type="password"
                  id="cpassword"
                  name="confirmPassword"
                  placeholder="Confirm password"
                  className="w-full p-3  border border-[var(--text-secondary)] rounded-xl bg-[var(--bg-tertiary)] text-[var(--text-primary)]  "
                />
                <div className="h-2">
                  <ErrorMessage
                    name="confirmPassword"
                    component="p"
                    className="text-red-500 text-sm"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-[var(--bg-secondary)] border-2 border-transparent hover:bg-[var(--bg-primary)] hover:border-2 hover:text-[var(--text-primary)] hover:border-[var(--bg-secondary)] transition-all duration-200 p-3 rounded-xl text-white font-medium disabled:opacity-50"
              >
                {isSubmitting ? 'Signing Up...' : 'Sign Up'}
              </button>
            </Form>
          )}
        </Formik>
        <div className="mt-10">
          <p className="text-[var(--text-secondary)]">
            Already have an account?
            <Link
              to={loginLink}
              className="text-[var(--text-primary)] font-medium hover:underline transition-all "
            >
              {' '}
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
