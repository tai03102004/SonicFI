import {
    Router
} from 'express';
import {
    AIService
} from '../services/ai.service.js';
import {
    BlockchainService
} from '../services/blockchain.service.js';
import {
    PythonBridgeService
} from '../services/python-bridge.service.js';

const router = Router();
const aiService = new AIService();
const pythonBridge = new PythonBridgeService();
const blockchainService = new BlockchainService();

/**
 * GET /api/ai/health
 * Check AI engine health
 */
router.get('/health', async (req, res) => {
    try {
        const aiHealth = await aiService.checkHealth();
        const networkStatus = await blockchainService.getNetworkStatus();

        res.json({
            success: true,
            data: {
                ai_engine: aiHealth,
                blockchain: networkStatus,
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/ai/analyze
 * Get comprehensive market analysis with Python integration
 */
router.post('/analyze', async (req, res) => {
    try {
        const {
            tokens
        } = req.body;

        if (!tokens || !Array.isArray(tokens) || tokens.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Tokens array is required and must not be empty'
            });
        }

        console.log(`🔄 Processing analysis request for: ${tokens.join(', ')}`);

        // Try Python bridge first, fallback to regular AI service
        let analysis;
        try {
            analysis = await pythonBridge.executeAIAnalysis(tokens);
            console.log('✅ Python analysis completed');
        } catch (pythonError) {
            console.warn('⚠️ Python bridge failed, using fallback:', pythonError.message);
            analysis = await aiService.getMarketAnalysis(tokens);
        }

        res.json({
            success: true,
            data: analysis,
            metadata: {
                tokens_analyzed: tokens,
                analysis_method: analysis.source || 'python_bridge',
                timestamp: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('❌ Analysis failed:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/ai/predict
 * Enhanced prediction with Python integration
 */
router.post('/predict', async (req, res) => {
    try {
        const {
            tokens,
            user_address,
            stake_amount = "1"
        } = req.body;

        if (!tokens || !Array.isArray(tokens) || !user_address) {
            return res.status(400).json({
                success: false,
                error: 'Tokens array and user_address are required'
            });
        }

        console.log(`🎯 Processing prediction request for ${tokens.join(', ')} by ${user_address}`);

        // Get predictions from Python bridge
        const predictions = await pythonBridge.getPredictions(tokens, user_address);

        res.json({
            success: true,
            data: {
                predictions,
                user_address,
                stake_amount,
                total_predictions: predictions.length,
                timestamp: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('❌ Prediction failed:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/ai/validate/:predictionHash
 * Validate prediction accuracy and distribute rewards
 */
router.post('/validate/:predictionHash', async (req, res) => {
    try {
        const {
            predictionHash
        } = req.params;
        const {
            actual_price,
            predicted_price,
            user_address
        } = req.body;

        // Validate input
        if (!actual_price || !predicted_price || !user_address) {
            return res.status(400).json({
                success: false,
                error: 'actual_price, predicted_price, and user_address are required'
            });
        }

        if (!ethers.isAddress(user_address)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid user address format'
            });
        }

        console.log(`🔍 Validating prediction: ${predictionHash}`);

        const result = await blockchainService.validatePrediction(
            predictionHash,
            parseFloat(actual_price),
            parseFloat(predicted_price),
            user_address
        );

        res.json({
            success: true,
            data: {
                prediction_hash: predictionHash,
                ...result,
                user_address,
                validation_timestamp: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('❌ Validation failed:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/ai/research
 * Get AI research report
 */
router.post('/research', async (req, res) => {
    try {
        const {
            tokens
        } = req.body;

        if (!tokens || !Array.isArray(tokens)) {
            return res.status(400).json({
                success: false,
                error: 'Tokens array is required'
            });
        }

        const research = await aiService.getResearchReport(tokens);

        res.json({
            success: true,
            data: research,
            metadata: {
                tokens_researched: tokens.length,
                timestamp: new Date().toISOString()
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

export {
    router as aiRoutes
};