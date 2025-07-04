import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { brokerIntegration } from "./broker-integration";
import { forexNewsChecker } from "./forex-news-checker";
import { tradingSignals } from "./trading-signals";
import { signalProcessor } from "./signal-processor";
import { liquidityScanner } from "./liquidity-scanner";
import enhancedGoldAttackRoutes from "./enhanced-gold-attack-routes";
import enhancedForexApiRoutes from "./enhanced-forex-api-routes";
import marketComplianceRoutes from "./market-compliance-routes";

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
  const server = await registerRoutes(app);

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

  app.use("/api/enhanced-gold", enhancedGoldAttackRoutes);
  app.use("/api/enhanced-forex", enhancedForexApiRoutes);
  app.use("/api/market-compliance", marketComplianceRoutes);

  const PORT = process.env.PORT || 5000;

  // Function to kill existing process on port
  async function killPortProcess(port: number) {
    try {
      const { exec } = require('child_process');
      await new Promise((resolve) => {
        exec(`lsof -ti:${port} | xargs kill -9`, (error: any) => {
          resolve(null);
        });
      });
      console.log(`✅ Cleared port ${port}`);
    } catch (error) {
      // Ignore errors, port might already be free
    }
  }

  // Clear port before starting
  killPortProcess(PORT).then(() => {
    const server = app.listen(PORT, "0.0.0.0", () => {
      console.log(`✅ Server running on http://0.0.0.0:${PORT}`);
      console.log(`🏛️ Federal Reserve Control System active`);
    });

    server.on('error', (err: any) => {
      if (err.code === 'EADDRINUSE') {
        console.log(`❌ Port ${PORT} still in use, retrying...`);
        setTimeout(() => {
          killPortProcess(PORT).then(() => {
            server.listen(PORT, "0.0.0.0");
          });
        }, 2000);
      }
    });
  });
})();