import express from "express";
import { ssiVNDirectWebSocket } from "./ssi-vndirect-websocket";

const router = express.Router();

// Connect to SSI VNDirect
router.post("/ssi/connect", async (req, res) => {
  try {
    await ssiVNDirectWebSocket.connect();

    res.json({
      success: true,
      message: "Connecting to SSI VNDirect WebSocket...",
      endpoint: "wss://wgateway-iboard.ssi.com.vn/",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to connect to SSI VNDirect",
    });
  }
});

// Execute safe command
router.post("/ssi/command", async (req, res) => {
  try {
    const { command, data } = req.body;

    const success = ssiVNDirectWebSocket.executeSafeCommand(command, data);

    if (success) {
      res.json({
        success: true,
        message: `Command "${command}" executed safely`,
        command,
        data,
      });
    } else {
      res.status(400).json({
        success: false,
        error: "Command rejected for security reasons",
        allowed_commands: [
          "subscribe_market_data",
          "unsubscribe_market_data",
          "get_account_info",
          "get_portfolio",
          "get_order_history",
        ],
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to execute command",
    });
  }
});

// Get connection status
router.get("/ssi/status", (req, res) => {
  try {
    const status = ssiVNDirectWebSocket.getConnectionStatus();

    res.json({
      success: true,
      data: status,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to get status",
    });
  }
});

export { router as ssiVNDirectRoutes };
