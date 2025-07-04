import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BarChart3, TrendingUp, Shield, Globe } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-white mb-6">
            Professional Trading Terminal
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Access real-time market data, advanced trading tools, and
            comprehensive analytics for Forex, commodities, and
            cryptocurrencies. Join thousands of professional traders.
          </p>
          <Button
            onClick={() => (window.location.href = "/api/login")}
            size="lg"
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg font-semibold"
          >
            Get Started
          </Button>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <BarChart3 className="h-12 w-12 text-blue-500 mb-4" />
              <CardTitle className="text-white">Real-time Data</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-gray-300">
                Live market feeds from major exchanges with sub-second latency
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <TrendingUp className="h-12 w-12 text-green-500 mb-4" />
              <CardTitle className="text-white">Advanced Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-gray-300">
                Technical indicators, chart patterns, and AI-powered insights
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <Shield className="h-12 w-12 text-purple-500 mb-4" />
              <CardTitle className="text-white">Risk Management</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-gray-300">
                Stop loss, take profit, and position sizing tools
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <Globe className="h-12 w-12 text-orange-500 mb-4" />
              <CardTitle className="text-white">Multi-Market</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-gray-300">
                Trade Forex, Gold, Oil, Indices, and Cryptocurrencies
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* Trading Features */}
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-white mb-8">
            Why Choose Our Platform?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-600 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                Professional Charts
              </h3>
              <p className="text-gray-300">
                Advanced charting tools with 100+ technical indicators and
                drawing tools
              </p>
            </div>
            <div className="text-center">
              <div className="bg-green-600 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                Smart Trading
              </h3>
              <p className="text-gray-300">
                Automated trading signals and algorithmic strategies
              </p>
            </div>
            <div className="text-center">
              <div className="bg-purple-600 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                Secure & Reliable
              </h3>
              <p className="text-gray-300">
                Bank-grade security with 99.9% uptime guarantee
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <div className="bg-gray-800 rounded-lg p-8 border border-gray-700">
            <h3 className="text-2xl font-bold text-white mb-4">
              Ready to Start Trading?
            </h3>
            <p className="text-gray-300 mb-6">
              Join our community of professional traders and take your trading
              to the next level
            </p>
            <Button
              onClick={() => (window.location.href = "/api/login")}
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg font-semibold"
            >
              Sign In with Replit
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
