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
  private api: AxiosInstance;
  constructor(private apiKey: string, private isTestMode = false) {
    this.api = axios.create({
      baseURL: this.isTestMode
        ? "https://sandbox.packlink.com/v1/"
        : "https://api.packlink.com/v1",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
      },
    });
  }
  /**
   * ✅ 1. Calcule les options de livraison selon le panier et l’adresse du client
   */
  
}
