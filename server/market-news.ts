import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export interface MarketNews {
  title: string;
  content: string;
  category: "forex" | "crypto" | "stocks" | "commodities" | "economics";
  impact: "low" | "medium" | "high";
  source: string;
  timestamp: string;
  symbols?: string[];
}

export class MarketNewsPublisher {
  static async publishNews(news: MarketNews): Promise<boolean> {
    try {
      const command = `market_news_post \
        --title "${news.title}" \
        --content "${news.content}" \
        --category ${news.category} \
        --impact ${news.impact} \
        --source "${news.source}" \
        --timestamp "${news.timestamp}" \
        --symbols "${news.symbols?.join(",") || ""}" \
        --market_check true \
        --auto_analysis true`;

      console.log("Executing market news command:", command);

      const { stdout, stderr } = await execAsync(command);

      if (stderr) {
        console.error("Market news posting error:", stderr);
        return false;
      }

      console.log("Market news posted successfully:", stdout);
      return true;
    } catch (error) {
      console.error("Failed to post market news:", error);
      return false;
    }
  }

  static async checkMarketImpact(symbols: string[]): Promise<any> {
    try {
      const command = `market_impact_check \
        --symbols "${symbols.join(",")}" \
        --timeframe "1h" \
        --analysis_depth "full" \
        --include_correlations true`;

      const { stdout } = await execAsync(command);
      return JSON.parse(stdout);
    } catch (error) {
      console.error("Market impact check failed:", error);
      return null;
    }
  }

  static async broadcastToTraders(
    newsId: string,
    priority: "normal" | "urgent" = "normal",
  ): Promise<void> {
    try {
      const command = `trader_broadcast \
        --news_id "${newsId}" \
        --priority ${priority} \
        --channels "websocket,push,email" \
        --target_audience "all_traders"`;

      await execAsync(command);
      console.log("News broadcasted to traders successfully");
    } catch (error) {
      console.error("Failed to broadcast news:", error);
    }
  }
}
