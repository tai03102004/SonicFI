# SocialFI - AI-Powered Crypto Prediction Platform

<div align="center">

![SocialFI](https://img.shields.io/badge/SocialFI-AI%20Predictions-blue?style=for-the-badge)
[![Sonic Testnet](https://img.shields.io/badge/Sonic-Testnet-orange?style=flat-square)](https://sonic.network)
[![React](https://img.shields.io/badge/React-18-blue?style=flat-square)](https://react.dev)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green?style=flat-square)](https://nodejs.org)

</div>

## 🎯 What is SocialFI?

SocialFI is a **decentralized prediction platform** where users leverage AI-powered market analysis to make crypto predictions and earn rewards for accuracy. The platform combines advanced NLP analysis with blockchain-based prediction markets on Sonic Network.

### 🚀 Key Features

- **🤖 AI Market Analysis**: Real-time sentiment analysis from news, social media, and technical indicators
- **📈 Live Trading Signals**: AI-generated buy/sell signals with confidence scores
- **👥 Social Trading**: Follow top traders and copy their predictions
- **🏛️ DAO Governance**: Community voting on platform decisions
- **💰 Token Rewards**: Earn S tokens for accurate predictions
- **📊 Advanced Analytics**: Comprehensive market data visualization

---

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Frontend│────│  Node.js Backend│────│  Python AI      │
│   (Port 3000)   │    │   (Port 3001)   │    │   Engine        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌─────────────────┐             │
         └──────────────│  Sonic Testnet  │─────────────┘
                        │  Smart Contracts│
                        └─────────────────┘
```

## 🛠️ Tech Stack

### Frontend

- **React 18** + TypeScript
- **Web3 Integration** (MetaMask)
- **Real-time Updates** (30s intervals)
- **Responsive Design** (Mobile-friendly)

### Backend

- **Node.js** + Express
- **Python Bridge** for AI integration
- **RESTful APIs** with error handling
- **Smart Contract Integration**

### AI Engine

- **Python NLP** processing
- **Sentiment Analysis** (News + Social)
- **Technical Analysis** (RSI, MACD, etc.)
- **Price Predictions** (1h, 24h, 7d)

### Blockchain

- **Sonic Testnet** (Fast + Low fees)
- **Smart Contracts** (Solidity)
- **S Token** (ERC20 reward token)
- **Prediction Registry**

---

## 🚀 Quick Start

### Prerequisites

```bash
Node.js 18+
Python 3.9+
MetaMask wallet
```

### 1. Clone & Install

```bash
git clone <your-repo>
cd SocialFI

# Install backend dependencies
cd backend && npm install && cd ..

# Install frontend dependencies
cd frontend && npm install && cd ..

# Install Python dependencies
cd ai-engine && pip install -r requirements.txt && cd ..
```

### 2. Environment Setup

```bash
# Copy environment files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
cp ai-engine/.env.example ai-engine/.env

# Add your API keys to the .env files:
# - OpenAI API key (for AI analysis)
# - NewsAPI key (for news sentiment)
# - Other optional APIs
```

### 3. Start Development

```bash
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend
cd frontend && npm start

# Terminal 3 - AI Engine (Optional)
cd ai-engine && python main.py
```

### 4. Access Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Switch MetaMask to Sonic Testnet**

---

## 🎮 How to Use

### 1. **Connect Wallet**

- Click "Connect Wallet" in the top navigation
- Switch to Sonic Testnet when prompted
- Your wallet status will show in the header

### 2. **AI Research Dashboard**

- Select tokens (BTC, ETH, SONIC)
- Click "Get AI Analysis" for comprehensive analysis
- Review sentiment scores, technical indicators
- Submit predictions with S token stakes

### 3. **Live Trading Signals**

- View real-time AI-generated trading signals
- See buy/sell recommendations with confidence
- Copy signals directly to your trading strategy
- Track signal performance over time

### 4. **Social Trading**

- Browse top-performing traders
- Follow traders to see their latest signals
- Copy successful trading strategies
- Compete on the leaderboard

### 5. **Advanced Analytics**

- Multi-token comparison analysis
- Sentiment breakdown by source (Twitter, news)
- Technical indicator visualization
- Historical prediction accuracy

---

## 📊 Current Features

### ✅ Implemented

- [x] AI market analysis with real sentiment data
- [x] Live trading signals with confidence scores
- [x] Social trading leaderboard and copy trading
- [x] Advanced analytics dashboard
- [x] Wallet integration with Sonic Testnet
- [x] Token staking for predictions
- [x] Real-time price updates
- [x] Professional UI/UX design

### 🔄 In Development

- [ ] Smart contract deployment automation
- [ ] DAO governance voting interface
- [ ] AI model marketplace
- [ ] Prediction accuracy tracking
- [ ] Token reward distribution

---

## 🚧 Smart Contract Status

The platform includes smart contract interfaces for:

- **S Token (ERC20)**: Reward and governance token
- **Prediction Registry**: Store and validate predictions
- **Reputation System**: Track user accuracy scores
- **DAO Governance**: Community voting on proposals

**⚠️ Note**: Contracts are currently in development. The demo mode provides full functionality using mock data that simulates real blockchain interactions.

---

## 🔮 Roadmap

### 📅 Phase 1: Core Platform (Current)

- ✅ AI analysis engine
- ✅ Frontend interface
- ✅ Social trading features
- 🔄 Smart contract deployment

### 📅 Phase 2: DeFi Integration (Next 2 months)

- 🔜 Live token rewards
- 🔜 Prediction markets
- 🔜 Liquidity pools
- 🔜 Cross-chain support

### 📅 Phase 3: Scaling (Next 6 months)

- 🔜 Mobile app
- 🔜 API for developers
- 🔜 Institutional features
- 🔜 Multi-language support

---

## 🤝 Contributing

We welcome contributions! Here's how to get involved:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** changes (`git commit -m 'Add amazing feature'`)
4. **Push** to branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Development Guidelines

- Follow TypeScript/ESLint rules
- Write tests for new features
- Update documentation
- Test on Sonic Testnet

---

## 📞 Support

- **Issues**: Open a GitHub issue
- **Questions**: Check the documentation
- **Community**: Join our Discord (coming soon)

---

## 🙏 Acknowledgments

- **Sonic Foundation** - High-performance blockchain
- **OpenAI** - Advanced language models
- **Community** - Feedback and testing
- **Open Source** - Libraries and tools used

---

<div align="center">

**Built with ❤️ for the decentralized future**

[![GitHub stars](https://img.shields.io/github/stars/your-repo/SocialFI?style=social)](#)

</div>
