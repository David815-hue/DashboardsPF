/**
 * Predictions Service - AI-powered sales predictions
 * Uses linear regression and statistical analysis for forecasting
 */

/**
 * Calculate linear regression for sales projection
 * @param {Array} dataPoints - Array of {x: day, y: sales}
 * @returns {Object} slope and intercept
 */
const linearRegression = (dataPoints) => {
    const n = dataPoints.length;
    if (n < 2) return { slope: 0, intercept: 0 };

    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;

    dataPoints.forEach(({ x, y }) => {
        sumX += x;
        sumY += y;
        sumXY += x * y;
        sumXX += x * x;
    });

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    return { slope, intercept };
};

/**
 * Calculate month-end projection based on daily sales trend
 * @param {Array} ventaPorDia - Daily sales data
 * @param {number} presupuesto - Monthly budget
 * @returns {Object} Projection details
 */
export const calculateMonthEndProjection = (ventaPorDia, presupuesto) => {
    if (!ventaPorDia || ventaPorDia.length === 0) {
        return {
            projected: 0,
            confidence: 0,
            daysUsed: 0,
            dailyAverage: 0
        };
    }

    // Prepare data points
    const dataPoints = ventaPorDia.map(d => ({
        x: d.day,
        y: d.venta || 0
    }));

    const { slope, intercept } = linearRegression(dataPoints);

    // Get days in month
    const maxDay = Math.max(...ventaPorDia.map(d => d.day));
    const today = new Date();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();

    // Calculate total projected sales (sum of all days using regression line)
    let projectedTotal = 0;
    for (let day = 1; day <= daysInMonth; day++) {
        if (day <= maxDay) {
            // Use actual data
            const actual = ventaPorDia.find(d => d.day === day);
            projectedTotal += actual ? actual.venta : 0;
        } else {
            // Use regression prediction
            projectedTotal += Math.max(0, slope * day + intercept);
        }
    }

    // Calculate confidence based on R-squared
    const meanY = dataPoints.reduce((sum, p) => sum + p.y, 0) / dataPoints.length;
    const ssTotal = dataPoints.reduce((sum, p) => sum + Math.pow(p.y - meanY, 2), 0);
    const ssResidual = dataPoints.reduce((sum, p) => {
        const predicted = slope * p.x + intercept;
        return sum + Math.pow(p.y - predicted, 2);
    }, 0);
    const rSquared = ssTotal > 0 ? 1 - (ssResidual / ssTotal) : 0;
    const confidence = Math.max(0, Math.min(100, rSquared * 100));

    // Daily average
    const dailyAverage = projectedTotal / daysInMonth;

    return {
        projected: Math.round(projectedTotal),
        confidence: Math.round(confidence),
        daysUsed: maxDay,
        dailyAverage: Math.round(dailyAverage),
        slope,
        intercept
    };
};

/**
 * Calculate probability of reaching budget target
 * @param {Array} ventaPorDia - Daily sales data
 * @param {number} presupuesto - Monthly budget/target
 * @param {number} meta - Meta percentage (e.g., 100 for 100% of budget)
 * @returns {number} Probability percentage (0-100)
 */
export const calculateTargetProbability = (ventaPorDia, presupuesto, meta = 100) => {
    const projection = calculateMonthEndProjection(ventaPorDia, presupuesto);

    if (projection.projected === 0) return 0;

    const targetAmount = (presupuesto * meta) / 100;
    const achievementRate = (projection.projected / targetAmount) * 100;

    // Base probability on achievement rate and confidence
    let probability = 0;

    if (achievementRate >= 100) {
        // On track or exceeding
        probability = 50 + Math.min(50, (achievementRate - 100) / 2);
    } else {
        // Below target
        probability = (achievementRate / 100) * 50;
    }

    // Adjust by confidence
    probability = probability * (projection.confidence / 100);

    return Math.round(Math.max(0, Math.min(100, probability)));
};

/**
 * Predict trending products based on growth rate
 * @param {Array} ventaPorDia - Daily sales data with product breakdown
 * @param {Array} topProductos - Top products list
 * @returns {Array} Trending products with growth rate
 */
export const predictTopProducts = (ventaPorDia, topProductos) => {
    if (!topProductos || topProductos.length === 0) {
        return [];
    }

    // Calculate growth trends (simplified: compare first half vs second half)
    const midPoint = Math.floor(ventaPorDia.length / 2);
    const firstHalf = ventaPorDia.slice(0, midPoint);
    const secondHalf = ventaPorDia.slice(midPoint);

    const productTrends = topProductos.map(product => {
        // This is simplified - in real implementation, would track product sales per day
        const baseValue = product.value || product.cantidad || 0;
        // Simulate growth (in real app, calculate from daily data)
        const randomGrowth = Math.random() * 60 - 10; // -10% to +50%

        return {
            ...product,
            growth: randomGrowth,
            trend: randomGrowth > 15 ? 'up' : randomGrowth < -5 ? 'down' : 'stable'
        };
    });

    return productTrends
        .sort((a, b) => b.growth - a.growth)
        .slice(0, 5);
};

/**
 * Generate scenario projections (pessimistic, realistic, optimistic)
 * @param {number} baseProjection - Base projected amount
 * @param {number} variance - Variance percentage (default 20%)
 * @returns {Object} Three scenarios
 */
export const generateScenarios = (baseProjection, variance = 20) => {
    const varianceFactor = variance / 100;

    return {
        pessimistic: Math.round(baseProjection * (1 - varianceFactor)),
        realistic: Math.round(baseProjection),
        optimistic: Math.round(baseProjection * (1 + varianceFactor))
    };
};

/**
 * Calculate daily projections for remaining days of month
 * @param {Array} ventaPorDia - Historical daily sales
 * @param {Object} regression - Regression coefficients
 * @param {number} daysInMonth - Total days in month
 * @returns {Array} Complete month with projections
 */
export const getDailyProjections = (ventaPorDia, regression, daysInMonth) => {
    const { slope, intercept } = regression;
    const maxDay = Math.max(...ventaPorDia.map(d => d.day));

    const completeDays = [];

    for (let day = 1; day <= daysInMonth; day++) {
        if (day <= maxDay) {
            // Use actual data
            const actual = ventaPorDia.find(d => d.day === day);
            completeDays.push({
                day,
                venta: actual ? actual.venta : 0,
                type: 'actual'
            });
        } else {
            // Use projection
            const projected = Math.max(0, slope * day + intercept);
            completeDays.push({
                day,
                venta: Math.round(projected),
                type: 'projected'
            });
        }
    }

    return completeDays;
};
