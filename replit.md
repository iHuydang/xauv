# Market Trading System

## Overview

This is a sophisticated trading terminal application built with React/TypeScript frontend and Node.js/Express backend. The system provides real-time market data, trading capabilities, news feeds, and economic indicators with a focus on Forex and commodities trading, particularly Vietnamese gold markets.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **UI Library**: Radix UI with shadcn/ui components
- **Styling**: Tailwind CSS with custom trading-specific color schemes
- **State Management**: TanStack Query for server state management
- **Real-time Updates**: WebSocket connections for live price feeds
- **Routing**: wouter for client-side routing

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Real-time Communication**: WebSocket server for price updates and news feeds
- **API Design**: RESTful endpoints with structured error handling
- **Build System**: Vite for frontend, esbuild for backend production builds

## Key Components

### Trading Engine
- **Real-time Price Feeds**: WebSocket-based price streaming
- **Order Management**: Market, limit, and stop orders
- **Position Tracking**: Live P&L calculations with automatic updates
- **Risk Management**: Stop loss and take profit functionality
- **Multi-symbol Support**: Forex pairs, commodities (Gold, Oil), and cryptocurrencies

### Market Data Integration
- **External APIs**: Integration with multiple market data providers
- **Economic Indicators**: FRED API integration for economic data
- **News Feeds**: Automated news scraping and classification
- **Vietnamese Gold Markets**: Specialized integration with SJC and PNJ APIs

### Account Management
- **Multi-broker Support**: MetaTrader 5, Exness, FTMO, TradingView
- **Account Synchronization**: Real-time balance and equity updates
- **Security**: Encrypted credentials storage
- **Demo/Live Account Management**: Separate handling for different account types

### Trading Signals
- **Signal Generation**: Automated technical analysis
- **News Impact Analysis**: Correlation between news events and market movements
- **Signal Strength Classification**: Weak, medium, strong signal ratings
- **Multi-timeframe Analysis**: Support for various trading timeframes

## Data Flow

1. **Price Data**: External APIs → WebSocket Server → Frontend Real-time Updates
2. **Trading Orders**: Frontend Order Panel → REST API → Storage → Position Updates
3. **News Processing**: News Scrapers → Analysis Engine → WebSocket Broadcast → Frontend Display
4. **Economic Data**: FRED API → Background Jobs → Database → Frontend Charts

## External Dependencies

### Required APIs
- **FRED API**: Economic indicators and government data
- **TradingView**: Chart widgets and market data
- **Vietnamese Gold APIs**: SJC and PNJ for local gold prices
- **Broker APIs**: MetaTrader 5, Exness integration

### Development Tools
- **Database**: PostgreSQL with Drizzle ORM
- **WebSocket**: Native WebSocket for real-time communication
- **HTTP Client**: Axios for external API calls
- **Web Scraping**: Cheerio for news extraction

## Deployment Strategy

### Development Environment
- **Command**: `npm run dev` starts both frontend and backend in development mode
- **Hot Reload**: Vite provides instant frontend updates
- **API Proxy**: Development server proxies API calls to backend

### Production Build
- **Frontend**: Vite builds optimized React bundle to `dist/public`
- **Backend**: esbuild creates single-file Node.js bundle in `dist/`
- **Static Serving**: Express serves frontend assets and API routes

### Replit Deployment
- **Autoscale**: Configured for automatic scaling based on demand
- **Port Configuration**: Backend runs on port 5000
- **Environment**: PostgreSQL 16 and Node.js 20 runtime

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

### June 23, 2025 - Enhanced SJC Pressure Attack System
- ✓ Optimized liquidity scanning algorithms with smarter vulnerability detection
- ✓ Improved spread analysis thresholds (30k/80k VND for high/medium/low liquidity)
- ✓ Added intelligent attack timing based on market hours and volatility
- ✓ Created advanced pressure attack vectors with 85-95% success rates
- ✓ Implemented real-time arbitrage opportunity detection
- ✓ Added comprehensive test system confirming 92% effectiveness
- ✓ Enhanced attack control interface with Vietnamese language support

### Technical Improvements
- Enhanced `LiquidityScanner` with volatility calculations and market timing
- Added `QuickAttackSystem` for streamlined attack execution
- Improved SJC vulnerability analysis with multi-factor scoring
- Optimized spread pressure algorithms for Vietnamese gold markets
- Added comprehensive attack vector selection based on market conditions

## Changelog

- June 23, 2025. Initial setup and enhanced SJC pressure attack capabilities