// src/index.js
const express = require('express');
const bodyParser = require('body-parser');
const cards = require('./cards');

const app = express();
app.use(bodyParser.json());

// --- UTILIDADES ---
const findCard = (name) => {
    const cleanName = name.toLowerCase().trim();
    return cards.find(c => c.name === cleanName);
};

// --- HANDLERS ---
const handleAnalizarMazo = (agentParams) => {
    // Dialogflow envía una lista de cartas en parameters.Cartas
    const deckInput = agentParams.Cartas || [];
    
    if (deckInput.length < 4) {
        return "⚠️ Veo muy pocas cartas. Por favor dime al menos 4 cartas de tu mazo para analizarlo (ej: Montapuercos, Mosquetera, Cañón...).";
    }

    let totalElixir = 0;
    let winConditions = 0;
    let spells = 0;
    let deckDetails = [];

    deckInput.forEach(cardName => {
        const card = findCard(cardName);
        if (card) {
            totalElixir += card.cost;
            if (card.type === 'win_condition') winConditions++;
            if (card.type === 'spell') spells++;
            deckDetails.push(card.name);
        }
    });

    if (deckDetails.length === 0) return "No reconozco esas cartas en mi base de datos actual. Prueba con cartas meta como Montapuercos, Pekka o Tronco.";

    const avgElixir = (totalElixir / deckDetails.length).toFixed(1);
    
    let advice = "";
    if (winConditions === 0) advice += "❌ Te falta una 'Win Condition' (carta para destruir torres). ";
    else if (winConditions > 2) advice += "⚠️ Tienes demasiadas Win Conditions, el mazo puede trabarse. ";
    
    if (spells === 0) advice += "⚠️ Necesitas al menos un hechizo. ";
    if (avgElixir > 4.5) advice += "🐘 Tu mazo es muy caro (" + avgElixir + "), sufrirás contra ciclos rápidos.";
    else if (avgElixir < 2.6) advice += "⚡ Es un mazo de ciclo muy rápido.";

    if (advice === "") advice = "✅ El mazo parece equilibrado estructuralmente.";

    return `📊 **Análisis del Mazo**\n- Elixir Medio: ${avgElixir}\n- Win Conditions: ${winConditions}\n- Hechizos: ${spells}\n\n**Veredicto:** ${advice}`;
};

const handleSugerirCounter = (agentParams) => {
    const cardName = agentParams.Carta;
    const card = findCard(cardName);

    if (!card) return `🤔 No tengo datos sobre "${cardName}". Asegúrate de escribirlo bien.`;
    if (card.counters.length === 0) return `ℹ️ La carta "${cardName}" es un hechizo o estructura que no tiene un 'counter' directo de tropa, depende del posicionamiento.`;

    const suggestion = card.counters.join(', ');
    return `🛡️ Para defender **${card.name}**, te sugiero usar: **${suggestion}**.`;
};

// --- ROUTER ---
app.post('/webhook', (req, res) => {
    const intentName = req.body.queryResult.intent.displayName;
    const params = req.body.queryResult.parameters;
    let responseText = "";

    console.log(`Intent recibido: ${intentName}`);

    switch (intentName) {
        case 'analizar.mazo':
            responseText = handleAnalizarMazo(params);
            break;
        case 'sugerir.counter':
            responseText = handleSugerirCounter(params);
            break;
        case 'Default Welcome Intent':
            responseText = "¡Hola! Soy tu coach de Clash Royale. ⚔️\nPuedo analizar tu mazo o decirte counters de cartas.\nEj: 'Analiza mi mazo de monta y pekka' o '¿Cómo paro al Mega Caballero?'";
            break;
        default:
            responseText = "No tengo una estrategia definida para esa pregunta aún. ${intentName}`;
    }

    res.json({
        fulfillmentText: responseText
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor Clash Royale listo en puerto ${PORT}`));

