import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

import { useToast } from '@/hooks/use-toast';

import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signInWithUsername } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const from = (location.state as { from?: string })?.from || '/';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { error } = await signInWithUsername(username, password);

    if (error) {
      toast({
        title: 'Login Failed',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Login Successful',
        description: 'Welcome back!',
      });
      navigate(from, { replace: true });
    }

    setIsLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md"
      >
        <Card className="border-0 shadow-xl ring-1 ring-border/50">
          <CardHeader className="space-y-4 pb-6 pt-8 text-center">
            <CardTitle className="text-3xl font-bold tracking-tight text-foreground">
              Marketing Tracking Dashboard
            </CardTitle>
            <p className="text-muted-foreground text-sm">
              Sign in to access your dashboard
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="login-username" className="text-foreground font-medium">Username</Label>
                <Input
                  id="login-username"
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="h-11 border-input focus-visible:ring-primary focus-visible:border-primary transition-all duration-200"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="login-password" className="text-foreground font-medium">Application Password</Label>
                  <a
                    href="https://wordpress.org/documentation/article/application-passwords/"
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-primary hover:text-primary/80 hover:underline transition-colors"
                  >
                    What is this?
                  </a>
                </div>
                <Input
                  id="login-password"
                  type="password"
                  placeholder="Enter your WP Application Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-11 border-input focus-visible:ring-primary focus-visible:border-primary transition-all duration-200"
                />
                <p className="text-[11px] text-muted-foreground pt-1">
                  Go to WP Admin {'>'} Users {'>'} Profile {'>'} Application Passwords to generate one.
                </p>
              </div>
              <Button
                type="submit"
                className="w-full h-11 text-base font-semibold bg-primary hover:bg-primary/90 transition-all duration-200 shadow-md hover:shadow-lg"
                disabled={isLoading}
              >
                {isLoading ? 'Logging in...' : 'Login'}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-2 pb-8">
            <p className="text-xs text-center text-muted-foreground">
              First user to register becomes admin
            </p>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}
