import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/index';

describe('Node.js SSO Sample - Unit Tests', () => {
  it('should create an Express app instance', () => {
    const app = createApp();
    expect(app).toBeDefined();
  });

  it('should have a homepage route', () => {
    const app = createApp();
    const routes = app._router.stack.filter((r: any) => r.route).map((r: any) => r.route.path);
    expect(routes).toContain('/');
  });
});

describe('Node.js SSO Sample - API/Functional Tests', () => {
  let app: any;

  beforeEach(() => {
    app = createApp();
  });

  it('GET / should return 200 OK with homepage content', async () => {
    const response = await request(app).get('/');
    expect(response.status).toBe(200);
    expect(response.text).toContain('Node.js SSO Sample with Authentik');
    expect(response.text).toContain('Login with Authentik');
  });

  it('GET /profile should redirect to / when not authenticated', async () => {
    const response = await request(app).get('/profile');
    expect(response.status).toBe(302);
    expect(response.headers.location).toBe('/');
  });

  it('GET /login should show message when Authentik not configured', async () => {
    const response = await request(app).get('/login');
    expect(response.status).toBe(200);
    expect(response.text).toContain('Authentik not configured');
  });
});
