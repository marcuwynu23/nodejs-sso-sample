import 'dotenv/config';
import express, { NextFunction, Request, Response } from 'express';
import session from 'express-session';
import passport from 'passport';
import { Strategy as OpenIDConnectStrategy } from 'passport-openidconnect';

export const createApp = () => {
  const app = express();

  app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false
  }));

  app.use(passport.initialize());
  app.use(passport.session());

  passport.serializeUser((user, done) => {
    done(null, user);
  });

  passport.deserializeUser((user: any, done) => {
    done(null, user);
  });

  if (process.env.AUTHENTIK_ISSUER_URL && process.env.AUTHENTIK_CLIENT_ID && process.env.AUTHENTIK_CLIENT_SECRET) {
    passport.use(new OpenIDConnectStrategy({
      issuer: process.env.AUTHENTIK_ISSUER_URL,
      clientID: process.env.AUTHENTIK_CLIENT_ID,
      clientSecret: process.env.AUTHENTIK_CLIENT_SECRET,
      callbackURL: 'http://localhost:3000/callback',
      authorizationURL: `${process.env.AUTHENTIK_ISSUER_URL}authorize/`,
      tokenURL: `${process.env.AUTHENTIK_ISSUER_URL}token/`,
      userInfoURL: `${process.env.AUTHENTIK_ISSUER_URL}userinfo/`,
      scope: 'openid profile email'
    }, (issuer: any, profile: any, cb: any) => {
      return cb(null, profile);
    }));
  }

  app.get('/', (req: Request, res: Response) => {
    res.send(`
      <h1>Node.js SSO Sample with Authentik</h1>
      ${req.isAuthenticated() 
        ? `<p>Welcome! <a href="/profile">View Profile</a> | <a href="/logout">Logout</a></p>` 
        : `<p><a href="/login">Login with Authentik</a></p>`
      }
    `);
  });

  app.get('/login', (req: Request, res: Response, next: NextFunction) => {
    const strategy = (passport as any)._strategy('openidconnect');
    if (!strategy) {
      return res.send('Authentik not configured. Please set AUTHENTIK_ISSUER_URL, AUTHENTIK_CLIENT_ID, and AUTHENTIK_CLIENT_SECRET environment variables.');
    }
    passport.authenticate('openidconnect')(req, res, next);
  });

  app.get('/callback', 
    passport.authenticate('openidconnect', { failureRedirect: '/' }),
    (req: Request, res: Response) => {
      res.redirect('/');
    }
  );

  app.get('/profile', (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.redirect('/');
    }
    res.send(`
      <h1>User Profile</h1>
      <pre>${JSON.stringify(req.user, null, 2)}</pre>
      <p><a href="/">Home</a></p>
    `);
  });

  app.get('/logout', (req: Request, res: Response, next: NextFunction) => {
    req.logout((err) => {
      if (err) return next(err);
      res.redirect('/');
    });
  });

  return app;
};

const PORT = process.env.PORT || 3000;
if (require.main === module) {
  const app = createApp();
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}
