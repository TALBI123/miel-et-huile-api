import axios from "axios";

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
  weight: number;
  length?: number;
  width?: number;
  height?: number;
}

export class PacklinkService {
  
  /**
   * 🔧 Base URL construite correctement
   */
  private static getBaseURL(): string {
    const baseUrl = process.env.PACKLINK_API_URL || "https://api.packlink.com";
    return baseUrl.replace(/\/v1$/, "");
  }

  /**
   * 🔧 Test de connexion avec l'API Packlink - Endpoint correct
   */
  static async testConnection() {
    try {
      console.log("🔑 API Key:", process.env.PACKLINK_API_KEY ? "✅ Définie" : "❌ Manquante");
      console.log("🌐 Base URL:", this.getBaseURL());
      
      // ✅ Endpoint correct : /profile au lieu de /me
      const url = `${this.getBaseURL()}/v1/profile`;
      console.log("🔗 URL complète:", url);
      
      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${process.env.PACKLINK_API_KEY}`,
          "Content-Type": "application/json",
        },
      });
      
      console.log("✅ Connexion réussie:", response.data);
      return response.data;
    } catch (error: any) {
      console.error("❌ Erreur de connexion:", {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
        url: error.config?.url
      });

      // Diagnostics supplémentaires
      if (error.response?.status === 401) {
        console.error("🔐 Problème d'authentification - Vérifiez votre API key");
      } else if (error.response?.status === 404) {
        console.error("🔗 Endpoint non trouvé - Vérifiez l'URL de l'API");
      }
      
      throw error;
    }
  }

  /**
   * 🌐 Tester différentes URLs d'API Packlink
   */
  static async testDifferentUrls() {
    const urls = [
      "https://api.packlink.com",           // International
      "https://api-staging.packlink.com",   // Staging
      "https://sandbox.packlink.com",       // Sandbox
      "https://api.packlink.es",            // Espagne
      "https://api.packlink.fr",            // France
      "https://api.packlink.it",            // Italie
      "https://api.packlink.de"             // Allemagne
    ];

    for (const baseUrl of urls) {
      try {
        console.log(`🌐 Test URL: ${baseUrl}`);
        
        const response = await axios.get(`${baseUrl}/v1/profile`, {
          headers: {
            Authorization: `Bearer ${process.env.PACKLINK_API_KEY}`,
            "Content-Type": "application/json",
          },
          timeout: 5000
        });
        
        console.log(`✅ SUCCÈS avec ${baseUrl}:`, response.status);
        return { url: baseUrl, data: response.data };
      } catch (error: any) {
        console.log(`❌ ${baseUrl}: ${error.response?.status || error.message}`);
      }
    }
    
    throw new Error("Aucune URL valide trouvée");
  }

  /**
   * 🔍 Valider le format de l'API key
   */
  static async validateApiKey() {
    const apiKey = process.env.PACKLINK_API_KEY;
    
    console.log("🔍 Validation API Key:");
    console.log("- Longueur:", apiKey?.length);
    console.log("- Format:", apiKey?.match(/^[a-f0-9]+$/) ? "Hexadécimal ✅" : "Format non standard ⚠️");
    console.log("- Premiers caractères:", apiKey?.substring(0, 10) + "...");
    
    // Vérification basique
    if (!apiKey) {
      throw new Error("❌ API key manquante");
    }
    
    if (apiKey.length !== 64) {
      console.warn("⚠️ La longueur de l'API key semble inhabituelle (attendu: 64 caractères)");
    }
    
    return apiKey;
  }

  /**
   * 🧪 Test simple avec différents endpoints pour identifier le bon
   */
  static async debugEndpoints() {
    const endpoints = [
      "/v1/profile",
      "/v1/user",
      "/v1/account",
      "/v1/warehouses",
      "/profile",
      "/user"
    ];

    for (const endpoint of endpoints) {
      try {
        const url = `${this.getBaseURL()}${endpoint}`;
        console.log(`🧪 Test endpoint: ${url}`);
        
        const response = await axios.get(url, {
          headers: {
            Authorization: `Bearer ${process.env.PACKLINK_API_KEY}`,
            "Content-Type": "application/json",
          },
          timeout: 5000
        });
        
        console.log(`✅ SUCCÈS avec ${endpoint}:`, response.status);
        return { endpoint, data: response.data };
      } catch (error: any) {
        console.log(`❌ ${endpoint}: ${error.response?.status || error.message}`);
      }
    }
    
    throw new Error("Aucun endpoint valide trouvé");
  }

  /**
   * 🔑 Tester différents formats d'API key
   */
  static async testApiKeyFormats() {
    const apiKey = process.env.PACKLINK_API_KEY;
    if (!apiKey) {
      throw new Error("API key manquante");
    }

    const formats = [
      `Bearer ${apiKey}`,
      apiKey,
      `Token ${apiKey}`,
      `API-Key ${apiKey}`
    ];

    for (const authHeader of formats) {
      try {
        console.log(`🔐 Test format auth: ${authHeader.substring(0, 20)}...`);
        
        const response = await axios.get(`${this.getBaseURL()}/v1/profile`, {
          headers: {
            Authorization: authHeader,
            "Content-Type": "application/json",
          },
          timeout: 5000
        });
        
        console.log(`✅ SUCCÈS avec format: ${authHeader.split(' ')[0]}`);
        return { format: authHeader, data: response.data };
      } catch (error: any) {
        console.log(`❌ Format ${authHeader.split(' ')[0]}: ${error.response?.status}`);
      }
    }
    
    throw new Error("Aucun format d'API key valide");
  }

  /**
   * 🔧 Test avec headers alternatifs
   */
  static async testAlternativeHeaders() {
    const headers = [
      {
        "Authorization": `Bearer ${process.env.PACKLINK_API_KEY}`,
        "Content-Type": "application/json"
      },
      {
        "Authorization": `Bearer ${process.env.PACKLINK_API_KEY}`,
        "Accept": "application/json"
      },
      {
        "X-API-Key": process.env.PACKLINK_API_KEY,
        "Content-Type": "application/json"
      },
      {
        "Authorization": process.env.PACKLINK_API_KEY,
        "Content-Type": "application/json"
      },
      {
        "Authorization": `Bearer ${process.env.PACKLINK_API_KEY}`,
        "Content-Type": "application/json",
        "User-Agent": "PacklinkService/1.0"
      }
    ];

    for (let i = 0; i < headers.length; i++) {
      try {
        console.log(`🧪 Test header set ${i + 1}...`);
        
        const response = await axios.get("https://api.packlink.com/v1/profile", {
          headers: headers[i],
          timeout: 5000
        });
        
        console.log(`✅ SUCCÈS avec header set ${i + 1}:`, response.status);
        return { headerSet: i + 1, data: response.data };
      } catch (error: any) {
        console.log(`❌ Header set ${i + 1}: ${error.response?.status}`);
      }
    }
    
    throw new Error("Aucun format de header valide");
  }

  /**
   * 🚚 Version alternative pour créer un devis
   */
  static async createShipmentDraft(from: any, to: any, packages: any[]) {
    try {
      // Structure de données simplifiée
      const shipmentData = {
        from: {
          name: from.name || "Expéditeur",
          address: from.address,
          city: from.city,
          zip: from.postal_code,
          country: from.country,
          email: from.email,
          phone: from.phone || ""
        },
        to: {
          name: to.name || "Destinataire",
          address: to.address,
          city: to.city,
          zip: to.postal_code,
          country: to.country,
          email: to.email,
          phone: to.phone || ""
        },
        packages: packages.map(pkg => ({
          weight: pkg.weight,
          width: pkg.width,
          height: pkg.height,
          length: pkg.length
        }))
      };

      // Essayer différents endpoints pour la création de devis
      const endpoints = [
        "/v1/shipments",
        "/v1/shipments/draft",
        "/v1/quotes",
        "/shipments"
      ];

      for (const endpoint of endpoints) {
        try {
          const url = `${this.getBaseURL()}${endpoint}`;
          console.log(`🧪 Test création devis: ${url}`);
          
          const response = await axios.post(url, shipmentData, {
            headers: {
              Authorization: `Bearer ${process.env.PACKLINK_API_KEY}`,
              "Content-Type": "application/json",
            },
            timeout: 10000
          });

          console.log(`✅ SUCCÈS création avec ${endpoint}:`, response.data);
          return response.data;
        } catch (error: any) {
          console.log(`❌ ${endpoint}: ${error.response?.status}`);
        }
      }
      
      throw new Error("Impossible de créer le devis avec tous les endpoints testés");

    } catch (error: any) {
      console.error("❌ Erreur création devis:", {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      throw error;
    }
  }

  /**
   * 📦 Test complet avec diagnostics avancés
   */
  static async testPacklink() {
    try {
      console.log("🚀 === DIAGNOSTIC COMPLET PACKLINK ===");
      
      // 0. Validation de l'API key
      console.log("\n0️⃣ Validation API Key...");
      try {
        await this.validateApiKey();
        console.log("✅ API Key semble valide");
      } catch (error: any) {
        console.log("❌ Problème avec l'API Key:", error.message);
      }

      // 1. Test des URLs
      console.log("\n1️⃣ Test des URLs...");
      try {
        const urlResult = await this.testDifferentUrls();
        console.log("✅ URL valide trouvée:", urlResult.url);
        
        // Mettre à jour l'URL dans les variables d'environnement
        process.env.PACKLINK_API_URL = urlResult.url;
        return urlResult;
      } catch (error) {
        console.log("❌ Aucune URL ne fonctionne");
      }

      // 2. Test des endpoints avec URL par défaut
      console.log("\n2️⃣ Test des endpoints...");
      try {
        const endpointResult = await this.debugEndpoints();
        console.log("✅ Endpoint valide trouvé:", endpointResult.endpoint);
        return endpointResult;
      } catch (error) {
        console.log("❌ Aucun endpoint standard ne fonctionne");
      }

      // 3. Test des formats d'API key
      console.log("\n3️⃣ Test des formats d'API key...");
      try {
        const keyResult = await this.testApiKeyFormats();
        console.log("✅ Format d'API key valide trouvé");
        return keyResult;
      } catch (error) {
        console.log("❌ Aucun format d'API key ne fonctionne");
      }

      // 4. Test avec headers alternatifs
      console.log("\n4️⃣ Test headers alternatifs...");
      try {
        const headerResult = await this.testAlternativeHeaders();
        console.log("✅ Format de header valide trouvé");
        return headerResult;
      } catch (error) {
        console.log("❌ Aucun format de header ne fonctionne");
      }

      // 5. Test de création de devis
      console.log("\n5️⃣ Test création de devis...");
      const testFrom = {
        name: "Test Expéditeur",
        address: "Calle Mayor 1",
        city: "Madrid",
        postal_code: "28001",
        country: "ES",
        email: "test@example.com",
        phone: "+34123456789"
      };

      const testTo = {
        name: "Test Destinataire", 
        address: "Rue de Rivoli 1",
        city: "Paris",
        postal_code: "75001",
        country: "FR",
        email: "dest@example.com",
        phone: "+33123456789"
      };

      const testPackages = [{
        width: 10,
        height: 20,
        length: 15,
        weight: 2.0
      }];

      try {
        const result = await this.createShipmentDraft(testFrom, testTo, testPackages);
        console.log("✅ Création de devis réussie");
        return result;
      } catch (error) {
        console.log("❌ Impossible de créer un devis");
      }

      throw new Error("❌ Toutes les tentatives ont échoué");

    } catch (err: any) {
      console.error("❌ Diagnostic complet échoué:", err.message);
      
      // Suggestions basées sur les résultats
      console.log("\n💡 SUGGESTIONS:");
      console.log("1. Vérifiez que votre compte Packlink est actif");
      console.log("2. Régénérez votre API key dans le dashboard Packlink");
      console.log("3. Vérifiez que vous êtes sur le bon environnement (prod vs sandbox)");
      console.log("4. Contactez le support Packlink pour vérifier vos permissions");
      console.log("5. Testez avec curl directement :");
      console.log(`   curl -H "Authorization: Bearer ${process.env.PACKLINK_API_KEY}" https://api.packlink.com/v1/profile`);
      
      throw err;
    }
  }

  /**
   * 💰 Obtenir les tarifs pour un envoi
   */
  static async getShippingRates(shipmentId: string) {
    try {
      const url = `${this.getBaseURL()}/v1/shipments/${shipmentId}/services`;
      console.log("🔗 URL tarifs:", url);
      
      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${process.env.PACKLINK_API_KEY}`,
          "Content-Type": "application/json",
        },
      });

      console.log("✅ Tarifs disponibles:", response.data);
      return response.data;
    } catch (error: any) {
      console.error("❌ Erreur récupération tarifs:", {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
        url: error.config?.url
      });
      throw error;
    }
  }

  /**
   * 🛒 Processus complet : obtenir les options de livraison pour un panier
   */
  static async getShippingOptions(
    from: Address,
    to: Address, 
    cartItems: CartItem[]
  ) {
    try {
      // 1. Calculer le poids total et les dimensions
      const totalWeight = cartItems.reduce((sum, item) => sum + (item.weight * item.quantity), 0);
      
      // 2. Créer un package combiné
      const packages = [{
        width: Math.max(...cartItems.map(item => item.width || 10)),
        height: Math.max(...cartItems.map(item => item.height || 5)),
        length: Math.max(...cartItems.map(item => item.length || 15)),
        weight: totalWeight
      }];

      // 3. Créer un devis
      const draft = await this.createShipmentDraft(from, to, packages);
      
      // 4. Récupérer les tarifs disponibles
      if (draft.id) {
        const rates = await this.getShippingRates(draft.id);
        return {
          shipmentId: draft.id,
          services: rates
        };
      }

      throw new Error("Impossible de créer le devis");

    } catch (error: any) {
      console.error("❌ Erreur lors de l'obtention des options de livraison:", {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      throw error;
    }
  }

  /**
   * ❌ Méthode obsolète - l'endpoint /status n'existe pas
   */
  static async getStatus() {
    console.warn("⚠️ getStatus() est obsolète, utilisez testConnection() à la place");
    return this.testConnection();
  }
}
