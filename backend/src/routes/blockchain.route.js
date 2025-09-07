import {
    Router
} from 'express';
import {
    BlockchainService
} from '../services/blockchain.service.js';
import {
    ethers
} from 'ethers';

const router = Router();
const blockchainService = new BlockchainService();

/**
 * GET /api/blockchain/balance/:address
 * Get user's token balance
 */
router.get('/balance/:address', async (req, res) => {
    try {
        const {
            address
        } = req.params;

        // Validate address
        if (!ethers.isAddress(address)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid address format'
            });
        }

        const balance = await blockchainService.getUserBalance(address);

        res.json({
            success: true,
            data: {
                address,
                balance,
                currency: 'SToken',
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
 * GET /api/blockchain/network
 * Get network status
 */
router.get('/network', async (req, res) => {
    try {
        const networkStatus = await blockchainService.getNetworkStatus();

        res.json({
            success: true,
            data: networkStatus
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

export {
    router as blockchainRoutes
};