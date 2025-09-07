import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import {
    aiRoutes
} from './src/routes/ai.route.js';
import {
    blockchainRoutes
} from './src/routes/blockchain.route.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
    origin: "http://localhost:3000", // cho phép FE gọi
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true
}));

app.use(express.json({
    limit: '10mb'
}));
app.use(express.urlencoded({
    extended: true
}));

// Request logging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Routes
app.use('/api/ai', aiRoutes);
app.use('/api/blockchain', blockchainRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        services: {
            ai_engine: process.env.AI_ENGINE_URL || 'http://localhost:5000',
            blockchain: 'Sonic Testnet'
        },
        contracts: {
            sToken: '0x4A80C79Ba53e1ecD18c3f340d8C5181e618B559C',
            aiRegistry: '0x9CD763b9a34c43123a70e69168C447C3dB1d51b7',
            knowledgeDAO: '0xD59Da846F02A6C84D79C05F80CFB3B7ae2F21879',
            reputation: '0x97a2c3CA5a565F0C0c4Ee66968B382B542C01070'
        }
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('❌ Unhandled error:', err);
    res.status(500).json({
        success: false,
        error: 'Internal server error',
        timestamp: new Date().toISOString()
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint not found',
        path: req.originalUrl
    });
});

// Start server
app.listen(PORT, () => {
    console.log('🚀 SocialFi Backend Server Started');
    console.log(`📡 Server running on port ${PORT}`);
    console.log(`🤖 AI Engine: ${process.env.AI_ENGINE_URL || 'http://localhost:5000'}`);
    console.log(`🔗 Blockchain: Sonic Testnet`);
    console.log(`📋 Health check: http://localhost:${PORT}/health`);
});

export default app;