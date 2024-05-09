"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Blockchain = void 0;
const Block_1 = require("./Block");
class Blockchain {
    constructor() {
        this.chain = [this.createGenesisBlock()];
        this.difficulty = 2;
        this.height = 1;
    }
    // 创建创世区块
    createGenesisBlock() {
        return new Block_1.Block(0, '2024-02-18', "Genesis block", "0");
    }
    // 获取最新区块
    getLatestBlock() {
        return this.chain[this.chain.length - 1];
    }
    // 添加新区块
    addBlock(newBlock) {
        newBlock.previousHash = this.getLatestBlock().hash;
        newBlock.mineBlock(this.difficulty);
        this.chain.push(newBlock);
        this.height++;
    }
    // 验证区块链是否有效
    isChainValid() {
        for (let i = 1; i < this.chain.length; i++) {
            const currentBlock = this.chain[i];
            const previousBlock = this.chain[i - 1];
            if (currentBlock.hash !== currentBlock.calculateHash()) {
                return false;
            }
            if (currentBlock.previousHash !== previousBlock.hash) {
                return false;
            }
        }
        return true;
    }
}
exports.Blockchain = Blockchain;
