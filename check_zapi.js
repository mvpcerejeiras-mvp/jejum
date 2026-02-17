
const ZAPI_INSTANCE = "3EE7F9BBDF3F155E45CFE9C8F58AF1C";
const ZAPI_TOKEN = "DF5749F6CDD891E19ED684E9";

async function checkStatus() {
    // Tentando o endpoint de status/instancia
    const url = `https://api.z-api.io/instances/${ZAPI_INSTANCE}/token/${ZAPI_TOKEN}/status`;
    console.log(`Checando: ${url}`);

    try {
        const response = await fetch(url, {
            headers: {
                "Content-Type": "application/json",
            }
        });

        console.log(`Status HTTP: ${response.status}`);
        const data = await response.json();
        console.log("Resposta:", JSON.stringify(data, null, 2));
    } catch (e) {
        console.error("Erro:", e);
    }
}

checkStatus();
