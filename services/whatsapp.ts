
const ZAPI_INSTANCE = import.meta.env.VITE_ZAPI_INSTANCE;
const ZAPI_TOKEN = import.meta.env.VITE_ZAPI_TOKEN;
const SECURITY_TOKEN = import.meta.env.VITE_ZAPI_SECURITY_TOKEN;
const ZAPI_URL = `https://api.z-api.io/instances/${ZAPI_INSTANCE}/token/${ZAPI_TOKEN}/send-text`;

/**
 * Envia uma mensagem de texto via Z-API.
 * @param phone O número de telefone com DDD (apenas números)
 * @param message O texto da mensagem
 */
export const sendWhatsAppMessage = async (phone: string, message: string): Promise<{ success: boolean; message?: string }> => {
    try {
        // Garantir que o telefone está no formato correto para o Z-API (apenas números)
        const cleanPhone = phone.replace(/\D/g, "");

        // Adicionar o código do país (55) se não estiver presente
        const finalPhone = cleanPhone.startsWith("55") ? cleanPhone : "55" + cleanPhone;

        const response = await fetch(ZAPI_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Client-Token": SECURITY_TOKEN
            },
            body: JSON.stringify({
                phone: finalPhone,
                message: message,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error("Z-API Error:", errorData);
            return { success: false, message: errorData.message || "Erro na API do WhatsApp" };
        }

        return { success: true };
    } catch (error) {
        console.error("WhatsApp Service Error:", error);
        return { success: false, message: "Erro interno ao enviar WhatsApp" };
    }
};
