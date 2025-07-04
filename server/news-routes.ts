import { Router } from "express";
import { MarketNewsPublisher, type MarketNews } from "./market-news";
import { z } from "zod";

const router = Router();

const newsSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(10),
  category: z.enum(["forex", "crypto", "stocks", "commodities", "economics"]),
  impact: z.enum(["low", "medium", "high"]),
  source: z.string().min(1),
  symbols: z.array(z.string()).optional(),
});

// Đăng tin tức mới
router.post("/api/news/publish", async (req, res) => {
  try {
    const newsData = newsSchema.parse(req.body);

    const marketNews: MarketNews = {
      ...newsData,
      timestamp: new Date().toISOString(),
    };

    // Kiểm tra tác động thị trường trước khi đăng
    if (marketNews.symbols && marketNews.symbols.length > 0) {
      const impact = await MarketNewsPublisher.checkMarketImpact(
        marketNews.symbols,
      );
      console.log("Market impact analysis:", impact);
    }

    // Đăng tin tức
    const success = await MarketNewsPublisher.publishNews(marketNews);

    if (success) {
      // Phát sóng đến traders nếu tin quan trọng
      if (marketNews.impact === "high") {
        await MarketNewsPublisher.broadcastToTraders(
          `news_${Date.now()}`,
          "urgent",
        );
      }

      res.json({
        success: true,
        message: "Tin tức đã được đăng thành công",
        news: marketNews,
      });
    } else {
      res.status(500).json({
        success: false,
        message: "Không thể đăng tin tức",
      });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        message: "Dữ liệu không hợp lệ",
        errors: error.errors,
      });
    } else {
      res.status(500).json({
        success: false,
        message: "Lỗi server",
      });
    }
  }
});

// Kiểm tra tác động thị trường
router.post("/api/news/market-impact", async (req, res) => {
  try {
    const { symbols } = req.body;

    if (!symbols || !Array.isArray(symbols)) {
      return res.status(400).json({
        success: false,
        message: "Symbols array is required",
      });
    }

    const impact = await MarketNewsPublisher.checkMarketImpact(symbols);
    res.json({ success: true, impact });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Không thể kiểm tra tác động thị trường",
    });
  }
});

export default router;
