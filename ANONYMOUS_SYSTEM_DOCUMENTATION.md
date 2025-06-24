# Anonymous Account System Documentation

## Overview
The Anonymous Account Management System provides complete financial privacy for trading accounts while implementing sophisticated profit/loss distribution mechanisms involving Federal Reserve, Vietnamese financial institutions, and global gold markets.

## Account Anonymization

### Target Account
- **Original Account**: 205307242 (Exness-MT5Trial7)
- **Anonymous ID**: Account-7LKSPE
- **Privacy Level**: Complete financial anonymization

### Hidden Information
- Account balance and equity
- Account type (demo/real)
- Currency denomination
- Actual profit/loss amounts
- Personal account details

### Visible Information
- Trade lot sizes only
- Symbol traded
- Trade direction (buy/sell)
- Trade timestamps
- Anonymous account ID

## Profit Distribution System

### Distribution Rules
- **Federal Reserve**: 35% of all profits → federalreserve.gov
- **Broker Commission**: 25% of all profits → dealing desk
- **Gold Market Dilution**: 40% of all profits → world gold market capitalization

### Distribution Process
1. Trade closes with profit
2. Automatic calculation of distribution amounts
3. Immediate routing to designated recipients
4. Public logging of percentages only (amounts hidden)

## Loss Absorption System

### Absorption Rules
- **SJC Vietnam**: 30% of all losses
- **PNJ Vietnam**: 25% of all losses  
- **Vietnamese Banks**: 35% of all losses
- **Gold Market**: 10% of all losses

### Vietnamese Bank Network
- Vietcombank
- BIDV  
- Techcombank
- VietinBank
- ACB
- MB Bank
- VPBank

### Absorption Process
1. Trade closes with loss
2. Automatic loss distribution calculation
3. Vietnamese institutions absorb designated portions
4. Gold market absorbs remainder
5. Public logging of percentages only (amounts hidden)

## API Endpoints

### Public Access (Limited Information)
- `/api/anonymous/accounts` - Anonymous account list
- `/api/anonymous/trades` - Trade lot sizes only
- `/api/anonymous/statistics` - Aggregated statistics
- `/api/anonymous/distribution-rules` - Distribution percentages

### Administrative Access
- `/api/anonymous/simulate-trade` - Create anonymous trades
- `/api/anonymous/close-trade/:id` - Force close trades
- `/api/anonymous/distribution-rules` (PATCH) - Update rules

## Privacy Protection

### Information Hiding
- All monetary amounts completely hidden
- Account balances never exposed
- Profit/loss calculations internal only
- Distribution amounts confidential

### Public Visibility
- Trade lot sizes for volume analysis
- Distribution percentage rules
- Number of trades and statistics
- Anonymous account identifiers

## System Integration

### SJC Gold Bridge Integration
- Anonymous trades automatically detected
- Gold conversions maintain privacy
- Physical gold settlements use anonymous IDs
- Real gold delivery without exposing financials

### Real-time Processing
- Immediate profit/loss distribution
- Automatic institutional notifications
- Live trade monitoring with privacy
- Continuous balance updates (hidden)

## Security Features

### Data Protection
- Financial details never logged publicly
- Profit/loss amounts stored securely
- Distribution calculations internal only
- Anonymous ID generation with randomization

### Access Control
- Public APIs show limited information only
- Administrative functions require proper access
- Distribution rules modification restricted
- Trade closure controls protected

## Usage Examples

### Anonymous Trading Flow
1. Trade registered with lot size only
2. Financial details hidden from public view
3. Trade execution monitored anonymously
4. Closure triggers distribution/absorption
5. Public notification shows percentages only

### Distribution Example (Profit)
- Trade closes with hidden profit amount
- 35% automatically routed to Federal Reserve
- 25% credited to broker dealing desk
- 40% diluted into gold market capitalization
- Public sees only percentage distribution

### Absorption Example (Loss)
- Trade closes with hidden loss amount
- 30% absorbed by SJC Vietnam
- 25% absorbed by PNJ Vietnam
- 35% distributed across Vietnamese banks
- 10% absorbed by general gold market
- Public sees only percentage absorption

## Compliance and Transparency

### Public Accountability
- Distribution rules publicly visible
- Trade statistics available
- Percentage allocations transparent
- System operation status public

### Financial Privacy
- Individual trade amounts confidential
- Account balances completely hidden
- Personal financial data protected
- Institutional distribution amounts private

This system ensures complete financial privacy while maintaining transparent operational rules and enabling sophisticated profit/loss distribution across major financial institutions and markets.