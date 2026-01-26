/**
 * Basket Analysis Service - Market Basket Analysis for Cross-Selling
 * Implements association rule mining to find frequently bought together items
 */

/**
 * Extract transactions from e-commerce data
 * @param {Object} ecommerceData - Processed e-commerce data
 * @returns {Array} Array of transactions (each transaction is an array of product names)
 */
const extractTransactions = (ecommerceData) => {
    if (!ecommerceData || !ecommerceData.rawData) {
        return [];
    }

    const transactions = {};

    ecommerceData.rawData.forEach(row => {
        const orderId = row._pedido;
        const productName = row._descripcion;

        if (!orderId || !productName) return;

        if (!transactions[orderId]) {
            transactions[orderId] = new Set();
        }
        transactions[orderId].add(productName);
    });

    // Convert Sets to Arrays
    return Object.values(transactions).map(set => Array.from(set));
};

/**
 * Find frequent itemsets (products bought together)
 * @param {Array} transactions - Array of transactions
 * @param {number} minSupport - Minimum support threshold (0-1)
 * @returns {Array} Frequent itemsets with support
 */
export const findFrequentItemsets = (transactions, minSupport = 0.02) => {
    if (!transactions || transactions.length === 0) return [];

    const totalTransactions = transactions.length;
    const itemCounts = {};
    const pairCounts = {};

    // Count individual items
    transactions.forEach(transaction => {
        transaction.forEach(item => {
            itemCounts[item] = (itemCounts[item] || 0) + 1;
        });

        // Count pairs
        for (let i = 0; i < transaction.length; i++) {
            for (let j = i + 1; j < transaction.length; j++) {
                const pair = [transaction[i], transaction[j]].sort().join('|');
                pairCounts[pair] = (pairCounts[pair] || 0) + 1;
            }
        }
    });

    // Filter pairs by minimum support
    const frequentPairs = [];
    for (const [pair, count] of Object.entries(pairCounts)) {
        const support = count / totalTransactions;
        if (support >= minSupport) {
            const [itemA, itemB] = pair.split('|');
            frequentPairs.push({
                itemA,
                itemB,
                count,
                support: Math.round(support * 1000) / 10 // Percentage with 1 decimal
            });
        }
    }

    return frequentPairs.sort((a, b) => b.support - a.support);
};

/**
 * Generate association rules from frequent itemsets
 * @param {Array} frequentPairs - Frequent item pairs
 * @param {Array} transactions - Original transactions
 * @param {number} minConfidence - Minimum confidence threshold (0-1)
 * @returns {Array} Association rules with confidence and lift
 */
export const generateAssociationRules = (frequentPairs, transactions, minConfidence = 0.3) => {
    if (!frequentPairs || frequentPairs.length === 0) return [];

    const totalTransactions = transactions.length;

    // Count occurrences of each item
    const itemCounts = {};
    transactions.forEach(transaction => {
        transaction.forEach(item => {
            itemCounts[item] = (itemCounts[item] || 0) + 1;
        });
    });

    const rules = [];

    frequentPairs.forEach(({ itemA, itemB, count, support }) => {
        const countA = itemCounts[itemA] || 0;
        const countB = itemCounts[itemB] || 0;

        // Rule: A -> B
        const confidenceAtoB = countA > 0 ? count / countA : 0;
        const supportA = countA / totalTransactions;
        const supportB = countB / totalTransactions;
        const liftAtoB = (supportA * supportB) > 0 ? (support / 100) / (supportA * supportB) : 0;

        if (confidenceAtoB >= minConfidence) {
            rules.push({
                antecedent: itemA,
                consequent: itemB,
                confidence: Math.round(confidenceAtoB * 1000) / 10,
                lift: Math.round(liftAtoB * 100) / 100,
                support,
                transactions: count
            });
        }

        // Rule: B -> A
        const confidenceBtoA = countB > 0 ? count / countB : 0;
        const liftBtoA = (supportA * supportB) > 0 ? (support / 100) / (supportA * supportB) : 0;

        if (confidenceBtoA >= minConfidence) {
            rules.push({
                antecedent: itemB,
                consequent: itemA,
                confidence: Math.round(confidenceBtoA * 1000) / 10,
                lift: Math.round(liftBtoA * 100) / 100,
                support,
                transactions: count
            });
        }
    });

    return rules.sort((a, b) => b.confidence - a.confidence);
};

/**
 * Get top cross-sell recommendations
 * @param {Array} rules - Association rules
 * @param {number} topN - Number of top recommendations
 * @returns {Array} Top recommendations
 */
export const getTopCrossSellRecommendations = (rules, topN = 10) => {
    if (!rules || rules.length === 0) return [];

    // Filter rules with good lift (>1 means positive correlation)
    const goodRules = rules.filter(rule => rule.lift > 1);

    return goodRules
        .slice(0, topN)
        .map(rule => ({
            ...rule,
            recommendation: `Quien compra "${rule.antecedent}" también compra "${rule.consequent}"`,
            strength: rule.confidence > 70 ? 'Alta' : rule.confidence > 50 ? 'Media' : 'Baja',
            upliftPotential: Math.round((rule.lift - 1) * 100) // Percentage uplift
        }));
};

/**
 * Analyze basket and generate insights
 * @param {Object} ecommerceData - E-commerce data
 * @param {Object} options - Analysis options
 * @returns {Object} Complete basket analysis
 */
export const analyzeBasket = (ecommerceData, options = {}) => {
    const {
        minSupport = 0.02,
        minConfidence = 0.3,
        topN = 10
    } = options;

    // Extract transactions
    const transactions = extractTransactions(ecommerceData);

    if (transactions.length === 0) {
        return {
            transactions: [],
            frequentPairs: [],
            rules: [],
            recommendations: [],
            stats: {
                totalTransactions: 0,
                avgItemsPerTransaction: 0,
                uniqueProducts: 0
            }
        };
    }

    // Find frequent itemsets
    const frequentPairs = findFrequentItemsets(transactions, minSupport);

    // Generate association rules
    const rules = generateAssociationRules(frequentPairs, transactions, minConfidence);

    // Get recommendations
    const recommendations = getTopCrossSellRecommendations(rules, topN);

    // Calculate stats
    const uniqueProducts = new Set();
    let totalItems = 0;
    transactions.forEach(transaction => {
        totalItems += transaction.length;
        transaction.forEach(item => uniqueProducts.add(item));
    });

    return {
        transactions,
        frequentPairs: frequentPairs.slice(0, topN),
        rules: rules.slice(0, topN * 2),
        recommendations,
        stats: {
            totalTransactions: transactions.length,
            avgItemsPerTransaction: Math.round((totalItems / transactions.length) * 10) / 10,
            uniqueProducts: uniqueProducts.size
        }
    };
};

/**
 * Create affinity matrix for heatmap visualization
 * @param {Array} topProducts - List of top products
 * @param {Array} rules - Association rules
 * @returns {Array} Matrix data for heatmap
 */
export const createAffinityMatrix = (topProducts, rules) => {
    if (!topProducts || topProducts.length === 0) return [];

    const productNames = topProducts.map(p => p.fullName || p.name || p.descripcion);
    const matrix = [];

    productNames.forEach((productA, i) => {
        productNames.forEach((productB, j) => {
            if (i === j) {
                // Same product
                matrix.push({
                    x: productA,
                    y: productB,
                    value: 100,
                    label: '100%'
                });
            } else {
                // Find rule
                const rule = rules.find(r =>
                    r.antecedent === productA && r.consequent === productB
                );
                matrix.push({
                    x: productA,
                    y: productB,
                    value: rule ? rule.confidence : 0,
                    label: rule ? `${rule.confidence}%` : '0%'
                });
            }
        });
    });

    return matrix;
};
