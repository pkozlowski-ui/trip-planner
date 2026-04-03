import { useState, FormEvent, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Grid,
  Column,
  TextInput,
  Button,
  Form,
  FormGroup,
  Loading,
  InlineNotification,
} from '@carbon/react';
import { signInWithEmail, registerWithEmail, signInWithGoogle, resetPassword } from '../services/firebase/auth';

function Login() {
  const { user, loading: authLoading } = useAuth();
  const [searchParams] = useSearchParams();
  const [isLogin, setIsLogin] = useState(true);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const navigate = useNavigate();

  // Get return URL from query params or default to dashboard
  const getReturnUrl = () => {
    const from = searchParams.get('from');
    return from || '/dashboard';
  };

  // Redirect if already logged in (handled by PublicRoute, but keeping for safety)
  useEffect(() => {
    if (!authLoading && user) {
      const returnUrl = getReturnUrl();
      navigate(returnUrl);
    }
  }, [user, authLoading, navigate, searchParams]);

  // Show loading while checking auth state
  if (authLoading) {
    return null; // PublicRoute will handle loading state
  }

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await signInWithGoogle();
      setSuccess('Successfully signed in with Google!');
      setTimeout(() => {
        navigate(getReturnUrl());
      }, 1000);
    } catch (err: any) {
      let errorMessage = 'An error occurred';
      if (err.code === 'auth/popup-closed-by-user') {
        errorMessage = 'Sign in was cancelled.';
      } else if (err.code === 'auth/popup-blocked') {
        errorMessage = 'Popup was blocked. Please allow popups for this site.';
      } else if (err.code === 'auth/unauthorized-domain') {
        errorMessage = 'This domain is not authorized. Please contact support.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      console.error('Google sign in error:', err);
      setError(errorMessage);
      setGoogleLoading(false);
    }
  };

  const handlePasswordReset = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setResetLoading(true);
    setError(null);
    setSuccess(null);

    if (!email) {
      setError('Please enter your email address.');
      setResetLoading(false);
      return;
    }

    try {
      await resetPassword(email);
      setSuccess('Password reset email sent! Please check your inbox and follow the instructions to reset your password.');
      setTimeout(() => {
        setShowPasswordReset(false);
        setEmail('');
      }, 3000);
    } catch (err: any) {
      let errorMessage = 'An error occurred while sending reset email.';
      if (err.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email address.';
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address.';
      } else if (err.code === 'auth/too-many-requests') {
        errorMessage = 'Too many requests. Please try again later.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      console.error('Password reset error:', err);
      setError(errorMessage);
    } finally {
      setResetLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (isLogin) {
        // Sign in
        await signInWithEmail(email, password);
        setSuccess('Successfully signed in!');
        setTimeout(() => {
          navigate(getReturnUrl());
        }, 1000);
      } else {
        // Register
        await registerWithEmail(email, password, displayName || undefined);
        setSuccess('Account created successfully!');
        setTimeout(() => {
          navigate(getReturnUrl());
        }, 1000);
      }
    } catch (err: any) {
      let errorMessage = 'An error occurred';
      if (err.code === 'auth/user-not-found') {
        errorMessage = 'User not found. Please check your email.';
      } else if (err.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password. Please try again.';
      } else if (err.code === 'auth/email-already-in-use') {
        errorMessage = 'Email already in use. Please sign in instead.';
      } else if (err.code === 'auth/weak-password') {
        errorMessage = 'Password should be at least 6 characters.';
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address.';
      } else if (err.code === 'auth/api-key-not-valid' || err.code?.includes('api-key')) {
        errorMessage = 'Firebase API key is invalid. Please check your .env.local file and ensure Firebase is properly configured. See FIREBASE_SETUP.md for instructions.';
      } else if (err.code === 'auth/configuration-not-found') {
        errorMessage = 'Firebase configuration not found. Please check your .env.local file and restart the dev server (npm run dev).';
      } else if (err.code === 'auth/invalid-api-key') {
        errorMessage = 'Invalid Firebase API key. Please verify your .env.local file contains the correct API key from Firebase Console.';
      } else if (err.code === 'auth/network-request-failed') {
        errorMessage = 'Network error. Please check your internet connection.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      console.error('Firebase auth error:', err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Grid fullWidth>
      <Column lg={8} md={4} sm={4} style={{ margin: '0 auto' }}>
        <div style={{ padding: '2rem', maxWidth: '400px', margin: '0 auto' }}>
          <h1 style={{ marginBottom: '2rem' }}>
            {showPasswordReset ? 'Reset Password' : isLogin ? 'Sign In' : 'Create Account'}
          </h1>

          {error && (
            <InlineNotification
              kind="error"
              title="Error"
              subtitle={error}
              onClose={() => setError(null)}
              style={{ marginBottom: '1rem' }}
            />
          )}

          {success && (
            <InlineNotification
              kind="success"
              title="Success"
              subtitle={success}
              onClose={() => setSuccess(null)}
              style={{ marginBottom: '1rem' }}
            />
          )}

          {showPasswordReset ? (
            <Form onSubmit={handlePasswordReset}>
              <FormGroup legendText="">
                <TextInput
                  id="reset-email"
                  type="email"
                  labelText="Email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={resetLoading}
                  invalid={!!error && error.includes('email')}
                  invalidText={error && error.includes('email') ? error : ''}
                />
              </FormGroup>

              <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem', flexDirection: 'column' }}>
                <Button
                  type="submit"
                  kind="primary"
                  disabled={resetLoading}
                  style={{ width: '100%' }}
                >
                  {resetLoading ? (
                    <>
                      <Loading small withOverlay={false} />
                      <span style={{ marginLeft: '0.5rem' }}>Sending...</span>
                    </>
                  ) : (
                    'Send Reset Email'
                  )}
                </Button>

                <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                  <Button
                    kind="ghost"
                    onClick={() => {
                      setShowPasswordReset(false);
                      setError(null);
                      setSuccess(null);
                    }}
                    disabled={resetLoading}
                  >
                    Back to Sign In
                  </Button>
                </div>
              </div>
            </Form>
          ) : (
            <>
              {/* Google Sign-In Button */}
              <div style={{ marginBottom: '1.5rem' }}>
                <Button
                  kind="secondary"
                  onClick={handleGoogleSignIn}
                  disabled={loading || googleLoading}
                  style={{ width: '100%' }}
                >
                  {googleLoading ? (
                    <>
                      <Loading small withOverlay={false} />
                      <span style={{ marginLeft: '0.5rem' }}>Signing in...</span>
                    </>
                  ) : (
                    <>
                      <svg
                        style={{ width: '20px', height: '20px', marginRight: '0.5rem', verticalAlign: 'middle' }}
                        viewBox="0 0 24 24"
                      >
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>
                      Continue with Google
                    </>
                  )}
                </Button>
              </div>

              {/* Divider */}
              <div style={{ display: 'flex', alignItems: 'center', margin: '1.5rem 0' }}>
                <div style={{ flex: 1, height: '1px', backgroundColor: '#e0e0e0' }}></div>
                <span style={{ padding: '0 1rem', color: '#666', fontSize: '14px' }}>OR</span>
                <div style={{ flex: 1, height: '1px', backgroundColor: '#e0e0e0' }}></div>
              </div>

              <Form onSubmit={handleSubmit}>
            {!isLogin && (
              <FormGroup legendText="">
                <TextInput
                  id="displayName"
                  labelText="Display Name (optional)"
                  placeholder="Enter your name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  disabled={loading}
                />
              </FormGroup>
            )}

            <FormGroup legendText="">
              <TextInput
                id="email"
                type="email"
                labelText="Email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                invalid={!!error && error.includes('email')}
                invalidText={error && error.includes('email') ? error : ''}
              />
            </FormGroup>

            <FormGroup legendText="">
              <TextInput
                id="password"
                type="password"
                labelText="Password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                invalid={!!error && error.includes('password')}
                invalidText={error && error.includes('password') ? error : ''}
              />
            </FormGroup>

            {isLogin && (
              <div style={{ textAlign: 'right', marginTop: '0.5rem', marginBottom: '0.5rem' }}>
                <Button
                  kind="ghost"
                  size="sm"
                  onClick={() => {
                    setShowPasswordReset(true);
                    setError(null);
                    setSuccess(null);
                  }}
                  disabled={loading}
                  style={{ padding: '0', fontSize: '14px', textDecoration: 'underline' }}
                >
                  Forgot password?
                </Button>
              </div>
            )}

            <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem', flexDirection: 'column' }}>
              <Button
                type="submit"
                kind="primary"
                disabled={loading || googleLoading}
                style={{ width: '100%' }}
              >
                {loading ? (
                  <>
                    <Loading small withOverlay={false} />
                    <span style={{ marginLeft: '0.5rem' }}>
                      {isLogin ? 'Signing in...' : 'Creating account...'}
                    </span>
                  </>
                ) : (
                  isLogin ? 'Sign In' : 'Create Account'
                )}
              </Button>

              <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                <Button
                  kind="ghost"
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setError(null);
                    setSuccess(null);
                  }}
                  disabled={loading}
                >
                  {isLogin
                    ? "Don't have an account? Sign up"
                    : 'Already have an account? Sign in'}
                </Button>
              </div>
            </div>
          </Form>
            </>
          )}
        </div>
      </Column>
    </Grid>
  );
}

export default Login;

