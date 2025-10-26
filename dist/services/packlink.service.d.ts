export declare class PacklinkService {
    private apiKey;
    private isTestMode;
    constructor(apiKey: string, isTestMode?: boolean);
    /**
     * ✅ 1. Calcule les options de livraison selon le panier et l’adresse du client
     */
    static testPacklink(): Promise<void>;
    static getStatus(): Promise<unknown>;
}
