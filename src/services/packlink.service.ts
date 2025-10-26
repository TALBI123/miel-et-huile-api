import axios, { AxiosInstance } from "axios";

interface Address {
  name: string;
  address: string;
  postal_code: string;
  city: string;
  country: string;
  email: string;
  phone?: string;
}
interface CartItem {
  title: string;
  quantity: number;
  weight: number; // en kg
  length?: number;
  width?: number;
  height?: number;
}

export class PacklinkService {
  // private api: AxiosInstance;
  constructor(private apiKey: string, private isTestMode = false) {
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
      const res = await axios.post(
        `${
          process.env.PACKLINK_API_URL || "https://api.packlink.com/v1"
        }/shipments`,
        {
          from: { country: "ES", zip: "28001" },
          to: { country: "FR", zip: "75001" },
          packages: [{ width: 10, height: 20, length: 15, weight: 2 }],
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.PACKLINK_API_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log(res.data);
    } catch (err: any) {
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
    } catch (error: any) {
      console.error("❌ Erreur Packlink:", error.message);
      throw error;
    }
  }
}
