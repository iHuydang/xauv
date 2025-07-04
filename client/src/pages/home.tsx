import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { BarChart3, TrendingUp, Settings, LogOut, User } from "lucide-react";
import type { User as UserType } from "@shared/schema";

export default function Home() {
  const { user } = useAuth();

  // Type guard to ensure user is properly typed
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading user data...</p>
        </div>
      </div>
    );
  }

  const typedUser = user as UserType;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Welcome back, {typedUser?.firstName || typedUser?.email || 'Trader'}!
            </h1>
            <p className="text-gray-300">
              Access your trading dashboard and manage your positions
            </p>
          </div>
          <div className="flex items-center space-x-4">
            {typedUser?.profileImageUrl && (
              <img 
                src={typedUser.profileImageUrl} 
                alt="Profile" 
                className="w-10 h-10 rounded-full object-cover"
                style={{ objectFit: 'cover' }}
              />
            )}
            <Button 
              onClick={() => window.location.href = '/api/logout'}
              variant="outline"
              className="text-white border-gray-600 hover:bg-gray-700"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>

        {/* Account Info */}
        {typedUser && (
          <Card className="bg-gray-800 border-gray-700 mb-8">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <User className="h-5 w-5 mr-2" />
                Account Information
              </CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <p className="text-gray-400 text-sm">Balance</p>
                <p className="text-2xl font-bold text-green-400">${typedUser.balance}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Equity</p>
                <p className="text-2xl font-bold text-blue-400">${typedUser.equity}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Email</p>
                <p className="text-white">{typedUser.email || 'Not provided'}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Member Since</p>
                <p className="text-white">
                  {typedUser.createdAt ? new Date(typedUser.createdAt).toLocaleDateString() : 'Unknown'}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Link href="/terminal">
            <Card className="bg-gray-800 border-gray-700 hover:bg-gray-750 transition-colors cursor-pointer">
              <CardHeader>
                <BarChart3 className="h-12 w-12 text-blue-500 mb-4" />
                <CardTitle className="text-white">Trading Terminal</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-300">
                  Access the full trading terminal with real-time charts and market data
                </CardDescription>
              </CardContent>
            </Card>
          </Link>

          <Link href="/world-gold">
            <Card className="bg-gray-800 border-gray-700 hover:bg-gray-750 transition-colors cursor-pointer">
              <CardHeader>
                <TrendingUp className="h-12 w-12 text-yellow-500 mb-4" />
                <CardTitle className="text-white">Gold Trading</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-300">
                  Specialized gold trading tools and market analysis
                </CardDescription>
              </CardContent>
            </Card>
          </Link>

          <Link href="/twelvedata">
            <Card className="bg-gray-800 border-gray-700 hover:bg-gray-750 transition-colors cursor-pointer">
              <CardHeader>
                <BarChart3 className="h-12 w-12 text-green-500 mb-4" />
                <CardTitle className="text-white">Market Data</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-300">
                  Advanced market data and analytics dashboard
                </CardDescription>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Additional Features */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">System Status</span>
                  <span className="text-green-400 font-semibold">Online</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Last Login</span>
                  <span className="text-gray-400">Just now</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Active Sessions</span>
                  <span className="text-blue-400">1</span>
                </div>
              </div>
            </CardContent>
          </Card>

          
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Quick Links</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Link href="/attack-control">
                  <Button variant="ghost" className="w-full justify-start text-gray-300 hover:text-white hover:bg-gray-700">
                    Market Control
                  </Button>
                </Link>
                <Link href="/coinranking">
                  <Button variant="ghost" className="w-full justify-start text-gray-300 hover:text-white hover:bg-gray-700">
                    Coinranking Market Maker
                  </Button>
                </Link>
                <Link href="/fred-gold-attack">
                  <Button variant="ghost" className="w-full justify-start text-gray-300 hover:text-white hover:bg-gray-700">
                    FRED Gold Analysis
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}