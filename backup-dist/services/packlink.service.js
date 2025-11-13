"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PacklinkService = void 0;
const axios_1 = __importDefault(require("axios"));
class PacklinkService {
    // private api: AxiosInstance;
    constructor(apiKey, isTestMode = false) {
        this.apiKey = apiKey;
        this.isTestMode = isTestMode;
        // this.api = axios.create({
        //   baseURL: this.isTestMode
        //     ? "https://sandbox.packlink.com/v1/"
        //     : "https://api.packlink.com/v1",
        //   headers: {
        //     Authorization: `Bearer ${this.apiKey}`,
        //   },
        // });
    }
    /**
     * ✅ 1. Calcule les options de livraison selon le panier et l’adresse du client
     */
    static async testPacklink() {
        try {
            const res = await axios_1.default.post(`${process.env.PACKLINK_API_URL || "https://api.packlink.com/v1"}/shipments`, {
                from: { country: "ES", zip: "28001" },
                to: { country: "FR", zip: "75001" },
                packages: [{ width: 10, height: 20, length: 15, weight: 2 }],
            }, {
                headers: {
                    Authorization: `Bearer ${process.env.PACKLINK_API_KEY}`,
                    "Content-Type": "application/json",
                },
            });
            console.log(res.data);
        }
        catch (err) {
            console.log(err);
            console.error("Erreur Packlink:", err.response?.data || err.message);
        }
    }
    static async getStatus() {
        try {
            const response = await fetch(`${process.env.PACKLINK_API_URL}/status`, {
                headers: {
                    Authorization: `Bearer ${process.env.PACKLINK_API_KEY}`,
                    "Content-Type": "application/json",
                },
            });
            if (!response.ok) {
                throw new Error(`Erreur HTTP ${response.status}`);
            }
            const data = await response.json();
            console.log("✅ Statut API Packlink :", data);
            return data;
        }
        catch (error) {
            console.error("❌ Erreur Packlink:", error.message);
            throw error;
        }
    }
}
exports.PacklinkService = PacklinkService;
//# sourceMappingURL=packlink.service.js.map