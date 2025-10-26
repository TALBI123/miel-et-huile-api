"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PdfService = void 0;
class PdfService {
    constructor() {
    }
    static getInstance() {
        if (!this.instance)
            this.instance = new PdfService();
        return this.instance;
    }
}
exports.PdfService = PdfService;
//# sourceMappingURL=PdfService.service.js.map