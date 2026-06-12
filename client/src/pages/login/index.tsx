import { FaBuilding } from "react-icons/fa";
import { Formik, Form, Field, ErrorMessage } from "formik";
import { Link, useNavigate } from "react-router";
import { signinSchema } from "./validation";
import { useAuth } from "../../hooks/useAuth";
import { useToast } from "../../hooks/useToast";
import { extractErrorMessage } from "../../utils/toast";

const LoginPage = () => {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-5">
      <div className="flex flex-col items-center gap-4">
        <h1 className="text-[var(--text-primary)] font-sans text-5xl font-bold">
          Book My Venue
        </h1>
        <div className="bg-[var(--bg-secondary)] p-2 rounded-sm">
          <FaBuilding className="text-5xl" color="white" />
        </div>
      </div>
      <div className="flex flex-col justify-center items-center">
        <h2 className="text-3xl text-[var(--text-primary)] mt-10 font-semibold">Welcome Back</h2>
        <p className="text-[var(--text-secondary)] mt-2"> Sign in to continue exploring venues.</p>

        <Formik
          initialValues={{
            email: "",
            password: "",
          }}
          validationSchema={signinSchema}
          onSubmit={async (values, { setSubmitting }) => {
            try {
              await login(values.email, values.password);
              toast.success("Welcome back! You're now signed in.");
              navigate("/");
            } catch (err: unknown) {
              toast.error(extractErrorMessage(err) || "Invalid email or password");
            } finally {
              setSubmitting(false);
            }
          }}
        >
          {({ isSubmitting }) => (
            <Form className="flex flex-col gap-5 w-full mt-10">
              <div className="flex flex-col gap-2">
                <label className="text-[var(--text-secondary)] text-sm " htmlFor="email">
                  Email
                </label>
                <Field
                  type="email"
                  id="email"
                  name="email"
                  placeholder="Enter your email"
                  className="w-120 p-3 border border-[var(--text-secondary)] rounded-xl bg-[var(--bg-tertiary)] text-[var(--text-primary)]"
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
                  className="w-120 p-3 border border-[var(--text-secondary)] rounded-xl bg-[var(--bg-tertiary)] text-[var(--text-primary)]"
                />
                <div className="flex flex-col justify-between">
                  <div className="h-2">
                    <ErrorMessage name="password" component="p" className="text-red-500 text-sm" />
                  </div>
                  <Link to="/forgot-password" className="text-[var(--text-primary)] self-end mt-1 font-medium hover:underline transition-all">
                    Forgot Password?
                  </Link>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-120 mt-6 bg-[var(--bg-secondary)] border-2 border-transparent hover:bg-[var(--bg-primary)] hover:border-2 hover:text-[var(--text-primary)] hover:border-[var(--bg-secondary)] transition-all duration-200 p-3 rounded-xl text-white font-medium disabled:opacity-50"
              >
                {isSubmitting ? "Signing In..." : "Sign In"}
              </button>
            </Form>
          )}
        </Formik>
        <div className="mt-10">
          <p className="text-[var(--text-secondary)]">
            Don't have an account?
            <Link to="/register" className="text-[var(--text-primary)] ml-2 font-medium hover:underline transition-all">
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;