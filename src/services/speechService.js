/**
 * Speech Service - Text-to-Speech for Presentation Mode
 * Uses Web Speech API for native browser text-to-speech
 */

/**
 * Check if speech synthesis is available
 */
export const isSpeechAvailable = () => {
    return 'speechSynthesis' in window;
};

/**
 * Get available Spanish voices
 */
export const getSpanishVoices = () => {
    const voices = speechSynthesis.getVoices();
    return voices.filter(voice => voice.lang.startsWith('es'));
};

/**
 * Speak text with Spanish voice
 * @param {string} text - Text to speak
 * @param {Object} options - Speech options
 */
export const speak = (text, options = {}) => {
    if (!isSpeechAvailable()) {
        console.warn('Speech synthesis not available');
        return;
    }

    // Cancel any ongoing speech
    speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);

    // Configuration
    utterance.lang = options.lang || 'es-ES';
    utterance.rate = options.rate || 0.9; // Slightly slower for clarity
    utterance.pitch = options.pitch || 1.0;
    utterance.volume = options.volume || 1.0;

    // Try to use a Spanish voice
    const spanishVoices = getSpanishVoices();
    if (spanishVoices.length > 0) {
        utterance.voice = spanishVoices[0];
    }

    // Callbacks
    if (options.onEnd) {
        utterance.onend = options.onEnd;
    }
    if (options.onError) {
        utterance.onerror = options.onError;
    }

    speechSynthesis.speak(utterance);
};

/**
 * Stop any ongoing speech
 */
export const stopSpeech = () => {
    if (isSpeechAvailable()) {
        speechSynthesis.cancel();
    }
};

/**
 * Pause speech
 */
export const pauseSpeech = () => {
    if (isSpeechAvailable()) {
        speechSynthesis.pause();
    }
};

/**
 * Resume speech
 */
export const resumeSpeech = () => {
    if (isSpeechAvailable()) {
        speechSynthesis.resume();
    }
};

/**
 * Format number for natural speech
 * @param {number} value - Number to format
 * @returns {string} Formatted number for speech
 */
const formatNumberForSpeech = (value) => {
    if (value >= 1000000) {
        const millions = Math.round(value / 100000) / 10;
        return `${millions} millones`;
    } else if (value >= 1000) {
        const thousands = Math.round(value / 100) / 10;
        return `${thousands} mil`;
    }
    return value.toString();
};

/**
 * Format percentage for speech
 * @param {number} percent - Percentage value
 * @returns {string} Formatted percentage
 */
const formatPercentForSpeech = (percent) => {
    const rounded = Math.round(percent);
    return `${rounded} por ciento`;
};

/**
 * Generate narration text for a KPI
 * @param {Object} kpi - KPI data with title, value, and optional percent
 * @returns {string} Narration text
 */
export const getKPINarration = (kpi) => {
    const { title, value, percent, type } = kpi;

    switch (type) {
        case 'currency':
            const formattedValue = formatNumberForSpeech(value);
            if (percent !== undefined && percent !== null) {
                const formattedPercent = formatPercentForSpeech(percent);
                return `${title}: ${formattedValue} lempiras, con un cumplimiento del ${formattedPercent}`;
            }
            return `${title}: ${formattedValue} lempiras`;

        case 'count':
            if (title.includes('Pedidos') || title.includes('Cantidad')) {
                return `Se procesaron ${value} ${title.toLowerCase()}`;
            }
            return `${title}: ${value}`;

        case 'percent':
            const formattedPercent = formatPercentForSpeech(value);
            return `${title}: ${formattedPercent}`;

        case 'ratio':
            return `${title}: ${value} a uno`;

        default:
            return `${title}: ${value}`;
    }
};

/**
 * Get narration for Venta Meta dashboard KPIs
 */
export const getVentaMetaNarration = (metrics) => {
    const narrations = [];

    if (metrics.totalVenta !== undefined) {
        narrations.push(getKPINarration({
            title: 'Venta total',
            value: metrics.totalVenta,
            percent: (metrics.totalVenta / (metrics.presupuesto || 1)) * 100,
            type: 'currency'
        }));
    }

    if (metrics.cantidadPedidos !== undefined) {
        narrations.push(getKPINarration({
            title: 'Cantidad de pedidos',
            value: metrics.cantidadPedidos,
            type: 'count'
        }));
    }

    if (metrics.ticketPromedio !== undefined) {
        narrations.push(getKPINarration({
            title: 'Ticket promedio',
            value: metrics.ticketPromedio,
            type: 'currency'
        }));
    }

    if (metrics.tasaConversion !== undefined) {
        narrations.push(getKPINarration({
            title: 'Tasa de conversión',
            value: metrics.tasaConversion,
            type: 'percent'
        }));
    }

    if (metrics.roas !== undefined) {
        narrations.push(getKPINarration({
            title: 'Retorno sobre inversión publicitaria',
            value: metrics.roas,
            type: 'ratio'
        }));
    }

    return narrations;
};

/**
 * Get narration for Agregadores dashboard KPIs
 */
export const getAgregadoresNarration = (metrics) => {
    const narrations = [];

    if (metrics.kpis?.ventaTotal !== undefined) {
        narrations.push(getKPINarration({
            title: 'Venta total de agregadores',
            value: metrics.kpis.ventaTotal,
            percent: metrics.kpis.cumplimientoPct,
            type: 'currency'
        }));
    }

    if (metrics.kpis?.cantidadTx !== undefined) {
        narrations.push(getKPINarration({
            title: 'Transacciones',
            value: metrics.kpis.cantidadTx,
            type: 'count'
        }));
    }

    if (metrics.kpis?.ticketPromedio !== undefined) {
        narrations.push(getKPINarration({
            title: 'Ticket promedio',
            value: metrics.kpis.ticketPromedio,
            type: 'currency'
        }));
    }

    return narrations;
};

/**
 * Get narration for E-commerce dashboard KPIs
 */
export const getEcommerceNarration = (metrics) => {
    const narrations = [];

    if (metrics.kpis?.ventaTotal !== undefined) {
        narrations.push(getKPINarration({
            title: 'Venta total de comercio electrónico',
            value: metrics.kpis.ventaTotal,
            type: 'currency'
        }));
    }

    if (metrics.kpis?.pedidos !== undefined) {
        narrations.push(getKPINarration({
            title: 'Pedidos de comercio electrónico',
            value: metrics.kpis.pedidos,
            type: 'count'
        }));
    }

    return narrations;
};
