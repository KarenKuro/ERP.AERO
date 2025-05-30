"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const home_route_1 = __importDefault(require("./routes/home.route"));
const error_middleware_1 = __importDefault(require("./middlewares/error.middleware"));
const ptisma_1 = require("./lib/ptisma");
const app = (0, express_1.default)();
const port = process.env.PORT || 3000;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use("/", home_route_1.default);
app.use(error_middleware_1.default);
(0, ptisma_1.connectToDatabase)()
    .then(() => {
    app.listen(port, () => {
        console.log(`Server is running at http://localhost:${port}`);
    });
})
    .catch((err) => {
    console.error("Failed to start server due to DB error:", err);
});
