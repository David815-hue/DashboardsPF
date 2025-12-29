// Groq AI Service for Dashboard Insights
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

/**
 * Generate AI insights from dashboard metrics
 * @param {Object} metrics - Current dashboard metrics
 * @param {string} dashboardType - Type of dashboard (venta-meta, ecommerce, whatsapp, agregadores)
 * @param {Object} trends - Comparison trends if available
 * @returns {Promise<string>} AI-generated insights
 */
export const generateInsights = async (metrics, dashboardType, trends = null) => {
    if (!metrics) {
        throw new Error('No hay métricas disponibles para analizar');
    }

    const prompt = buildPrompt(metrics, dashboardType, trends);

    try {
        const response = await fetch(GROQ_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${GROQ_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [
                    {
                        role: 'system',
                        content: `Eres un analista de datos experto en retail farmacéutico en Honduras. 
Tu tarea es analizar métricas de ventas y proporcionar insights accionables en español.
Sé conciso pero informativo. Usa emojis para hacer el reporte más visual.
Estructura tu respuesta en secciones claras: Resumen, Puntos Destacados, Alertas (si hay), y Recomendaciones.
Usa formato Markdown para mejor legibilidad.`
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.7,
                max_tokens: 1024
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error?.message || `Error de API: ${response.status}`);
        }

        const data = await response.json();
        return data.choices[0]?.message?.content || 'No se pudo generar el análisis.';
    } catch (error) {
        console.error('Error calling Groq API:', error);
        throw error;
    }
};

/**
 * Build the prompt based on dashboard type and metrics
 */
const buildPrompt = (metrics, dashboardType, trends) => {
    let prompt = `Analiza los siguientes datos del dashboard "${getDashboardName(dashboardType)}":\n\n`;

    switch (dashboardType) {
        case 'venta-meta':
            prompt += `📊 **Métricas de Venta Meta:**
- Total Venta: L ${formatNumber(metrics.totalVenta)}
- Cantidad de Pedidos: ${formatNumber(metrics.cantidadPedidos)}
- Venta TGU: L ${formatNumber(metrics.ventaTGU)}
- Venta SPS: L ${formatNumber(metrics.ventaSPS)}
- Ticket Promedio: L ${formatNumber(metrics.ticketPromedio)}
- Tasa de Conversión: ${metrics.tasaConversion?.toFixed(2) || 0}%
- ROAS: ${metrics.roas?.toFixed(2) || 0}
`;
            // Top products for Venta Meta
            const vmTopProducts = metrics.topProducts || [];
            if (vmTopProducts.length > 0) {
                prompt += `\n🏆 Top 5 Productos:\n`;
                vmTopProducts.slice(0, 5).forEach((p, i) => {
                    prompt += `${i + 1}. ${p.name}: ${p.value} unidades\n`;
                });
            }
            // Funnel data
            if (metrics.embudoData?.length > 0) {
                prompt += `\n📈 Embudo de Conversión:\n`;
                metrics.embudoData.forEach(item => {
                    prompt += `- ${item.name}: ${formatNumber(item.value)}\n`;
                });
            }
            break;

        case 'ecommerce':
            const eKpis = metrics.kpis || metrics;
            const eCharts = metrics.charts || {};
            prompt += `🛒 **Métricas E-commerce:**
- Venta Total: L ${formatNumber(eKpis.ventaTotal)}
- Cantidad Pedidos: ${formatNumber(eKpis.cantidadPedidos)}
- Venta APP: L ${formatNumber(eKpis.ventaAPP)}
- Venta Web: L ${formatNumber(eKpis.ventaEcommerce)}
- Ticket Promedio: L ${formatNumber(eKpis.ticketPromedio)}
- Pedidos Cancelados: ${eKpis.pedidosCancelados || 0}
`;
            // Top products for E-commerce
            const eTopProducts = eCharts.topProductos || [];
            if (eTopProducts.length > 0) {
                prompt += `\n🏆 Top 5 Productos:\n`;
                eTopProducts.slice(0, 5).forEach((p, i) => {
                    prompt += `${i + 1}. ${p.name}: ${p.value} unidades (L ${formatNumber(p.totalVenta || 0)})\n`;
                });
            }
            // Cancellation reasons
            const motivosCancelacion = eCharts.motivosCancelacion || [];
            if (motivosCancelacion.length > 0) {
                prompt += `\n❌ Motivos de Cancelación:\n`;
                motivosCancelacion.slice(0, 5).forEach((m, i) => {
                    prompt += `${i + 1}. ${m.name}: ${m.value} casos\n`;
                });
            }
            break;

        case 'whatsapp':
            const wKpis = metrics.page1?.kpis || metrics.kpis || metrics;
            const wCharts = metrics.page1?.charts || metrics.charts || {};
            prompt += `💬 **Métricas WhatsApp Marketing:**
- Total Venta: L ${formatNumber(wKpis.totalVenta)}
- Tasa de Conversión: ${wKpis.tasaConversion?.toFixed(2) || 0}%
- Ticket Promedio: L ${formatNumber(wKpis.ticketPromedio)}
- ROAS: ${wKpis.roas?.toFixed(2) || 0}
- Venta TGU: L ${formatNumber(wKpis.totalVentaTGU)}
- Venta SPS: L ${formatNumber(wKpis.totalVentaSPS)}
- Tasa de Respuesta: ${wKpis.tasaRespuesta?.toFixed(2) || 0}%
- Cantidad de Ventas: ${formatNumber(wKpis.cantidadVenta)}
`;
            // Top products for WhatsApp
            const wTopProducts = wCharts.topProductos || [];
            if (wTopProducts.length > 0) {
                prompt += `\n🏆 Top 5 Productos:\n`;
                wTopProducts.slice(0, 5).forEach((p, i) => {
                    prompt += `${i + 1}. ${p.name}: L ${formatNumber(p.value)}\n`;
                });
            }
            break;

        case 'agregadores':
            const aKpis = metrics.kpis || metrics;
            const aCharts = metrics.charts || {};
            prompt += `🚀 **Métricas Agregadores (Delivery Apps):**
- Venta Total: L ${formatNumber(aKpis.ventaTotal)}
- Cantidad Transacciones: ${formatNumber(aKpis.cantidadTx)}
- Ticket Promedio: L ${formatNumber(aKpis.ticketPromedio)}
- Presupuesto: L ${formatNumber(aKpis.presupuesto)}
- Meta Prorrateada: L ${formatNumber(aKpis.metaProrrateada)}
- Cumplimiento de Meta MTD: ${aKpis.cumplimientoPct?.toFixed(1) || 0}%
- Diferencia vs Meta: L ${formatNumber(aKpis.diferenciaProrrateada)}
- Meta Tx: ${formatNumber(aKpis.metaTx)}
- Cumplimiento Tx MTD: ${aKpis.cumplimientoTxMTDPct?.toFixed(1) || 0}%
`;
            // Top products for Agregadores
            const aTopProducts = aCharts.topProductos || [];
            if (aTopProducts.length > 0) {
                prompt += `\n🏆 Top 5 Productos:\n`;
                aTopProducts.slice(0, 5).forEach((p, i) => {
                    prompt += `${i + 1}. ${p.name}: ${p.value} unidades\n`;
                });
            }
            // Top stores
            const topTiendas = aCharts.topTiendas || [];
            if (topTiendas.length > 0) {
                prompt += `\n🏪 Top 5 Tiendas:\n`;
                topTiendas.slice(0, 5).forEach((t, i) => {
                    prompt += `${i + 1}. ${t.name}: L ${formatNumber(t.value)}\n`;
                });
            }
            break;

        default:
            prompt += JSON.stringify(metrics, null, 2);
    }

    // Add trends if comparison mode is active
    if (trends && Object.keys(trends).length > 0) {
        prompt += `\n📈 **Comparación con período anterior:**\n`;
        Object.entries(trends).forEach(([key, value]) => {
            if (typeof value === 'number' && !isNaN(value)) {
                const direction = value > 0 ? '↑' : value < 0 ? '↓' : '→';
                prompt += `- ${key}: ${direction} ${Math.abs(value).toFixed(1)}%\n`;
            }
        });
    }

    prompt += `\nPor favor proporciona un análisis ejecutivo con insights accionables, detecta anomalías o áreas de mejora, y sugiere acciones concretas.`;

    return prompt;
};

const getDashboardName = (type) => {
    const names = {
        'venta-meta': 'Venta Meta',
        'ecommerce': 'E-commerce',
        'whatsapp': 'WhatsApp Marketing',
        'agregadores': 'Agregadores'
    };
    return names[type] || type;
};

const formatNumber = (num) => {
    if (num === undefined || num === null) return '0';
    return Math.round(num).toLocaleString('es-HN');
};

export default { generateInsights };
