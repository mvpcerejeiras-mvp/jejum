/**
 * Simulação de Limite Progressivo (5 -> 8 -> 11...)
 * Este script demonstra como a lógica calcula o limite de vagas
 * baseado no preenchimento dos horários.
 */

function calculateLimit(slotsSignups) {
    const counts = Object.values(slotsSignups);
    const minCount = counts.length > 0 ? Math.min(...counts) : 0;

    let currentLimit = 5;
    if (minCount >= 5) {
        currentLimit = 5 + 3 * (Math.floor((minCount - 5) / 3) + 1);
    }

    return { minCount, currentLimit };
}

function printStatus(slotsSignups, level) {
    const { minCount, currentLimit } = calculateLimit(slotsSignups);
    console.log(`\n--- [${level}] ---`);
    console.log(`Preenchimento Mínimo (Vaga mais vazia): ${minCount}`);
    console.log(`LIMITE ATUAL DE VAGAS: ${currentLimit}`);

    // Mostra um resumo dos slots
    const summary = Object.entries(slotsSignups).map(([slot, count]) => `[Slot ${slot}h: ${count}]`).join(' ');
    console.log(`Slots: ${summary}`);
}

// 1. Iniciando com horários vazios
let mySlots = { 0: 0, 1: 0, 2: 0, 3: 0 }; // Simulação com apenas 4 horários para facilitar
printStatus(mySlots, "Cenário Inicial: Tudo Vazio");

// 2. Preenchendo alguns horários até o limite (5)
console.log("\n> Pessoas se inscrevendo nos horários das 0h, 1h e 2h...");
mySlots[0] = 5;
mySlots[1] = 5;
mySlots[2] = 5;
mySlots[3] = 2; // O horário das 3h ainda está com 2 pessoas
printStatus(mySlots, "Horário das 3h impedindo liberação");

// 3. Preenchendo o último horário
console.log("\n> Agora o horário das 3h também chegou a 5 pessoas!");
mySlots[3] = 5;
printStatus(mySlots, "META 5 ATINGIDA EM TODOS! LIBERANDO NÍVEL 8");

// 4. Indo para o próximo nível (11)
console.log("\n> Todos os horários chegaram a 8 pessoas agora...");
mySlots[0] = 8;
mySlots[1] = 8;
mySlots[2] = 8;
mySlots[3] = 8;
printStatus(mySlots, "META 8 ATINGIDA! LIBERANDO NÍVEL 11");

// 5. Exemplo de recuo (Se alguém for removido, o limite cai?)
// Na lógica atual, se alguém sai e fica abaixo de 5, o limite voltaria para 5
console.log("\n> Imagine que alguém desistiu do horário das 3h e caiu para 4 pessoas...");
mySlots[3] = 4;
printStatus(mySlots, "O limite volta a ser 5 para garantir o preenchimento das 3h");
