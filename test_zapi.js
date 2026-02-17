
const ZAPI_INSTANCE = "3EE7F9BBDFF3F155E45CFE9C8F58AF1C";
const ZAPI_TOKEN = "DF5749F6CDD891E19ED684E9";
const SECURITY_TOKEN = "F00812244ef824e12b7faa33658278319S";
const ZAPI_URL = `https://api.z-api.io/instances/${ZAPI_INSTANCE}/token/${ZAPI_TOKEN}/send-text`;

async function testFinal() {
    console.log("--- TESTE FINAL Z-API ---");
    const phone = "5569992821283";
    const message = "✅ Integração Jejum & Oração: WhatsApp Automático Ativado!";

    try {
        const response = await fetch(ZAPI_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Client-Token": SECURITY_TOKEN
            },
            body: JSON.stringify({
                phone: phone,
                message: message,
            }),
        });

        console.log(`Status HTTP: ${response.status}`);
        const data = await response.json();
        console.log("Resposta:", JSON.stringify(data, null, 2));
    } catch (e) {
        console.error("Erro:", e);
    }
}

testFinal();
