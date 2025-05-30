"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getHome = void 0;
const getHome = (req, res) => {
    res.json({ message: "Welcome to Express + TypeScript app!" });
};
exports.getHome = getHome;
