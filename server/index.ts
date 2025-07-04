import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { brokerIntegration } from './broker-integration';
import { forexNewsChecker } from './forex-news-checker';
import { tradingSignals } from './trading-signals';
import { signalProcessor } from './signal-processor';
import { liquidityScanner } from './liquidity-scanner';
import enhancedGoldAttackRoutes from './enhanced-gold-attack-routes';
import enhancedForexApiRoutes from './enhanced-forex-api-routes';
import marketComplianceRoutes from './market-compliance-routes';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  let server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  app.use('/api/enhanced-gold', enhancedGoldAttackRoutes);
  app.use('/api/enhanced-forex', enhancedForexApiRoutes);
  app.use('/api/market-compliance', marketComplianceRoutes);

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = process.env.PORT || 5001;

  // Cleanup existing server if running
  process.on('SIGTERM', () => {
    console.log('🛑 Received SIGTERM, shutting down gracefully');
    server?.close(() => {
      console.log('✅ Server closed');
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    console.log('🛑 Received SIGINT, shutting down gracefully');
    server?.close(() => {
      console.log('✅ Server closed');
      process.exit(0);
    });
  });

  // Start the server with error handling
  server = app.listen(port, '0.0.0.0', () => {
    log(`serving on port ${port}`);
    log(`Server accessible at http://0.0.0.0:${port}`);
    log(`Local access: http://localhost:${port}`);
    log(`External access: Use the provided Replit URL`);
  }).on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`❌ Port ${port} is busy, trying ${port + 1}`);
      const newPort = port + 1;
      app.listen(newPort, '0.0.0.0', () => {
        log(`serving on port ${newPort}`);
        log(`Server accessible at http://0.0.0.0:${newPort}`);
        log(`Local access: http://localhost:${newPort}`);
        log(`External access: Use the provided Replit URL`);
      });
    } else {
      console.error('❌ Server error:', err);
    }
  });
})();