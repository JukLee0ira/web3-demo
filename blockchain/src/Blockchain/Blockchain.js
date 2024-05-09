"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Blockchain = void 0;
const Block_1 = require("./Block");
const fs_1 = __importDefault(require("fs"));
class Blockchain {
    // 区块链高度，直接使用chain.length
    get height() {
        return this.chain.length;
    }
    constructor(dataPath = 'blockchain.json') {
        this.chain = [this.createGenesisBlock()];
        this.difficulty = 2;
        this.dataPath = dataPath;
        this.loadChainFromFile();
        // 系统崩溃时，保存区块链到文件
        process.on('exit', () => this.saveChainToFile());
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
        this.saveChainToFile();
    }
    // 验证区块链是否有效
    isChainValid(chain) {
        const targetChain = chain || this.chain;
        for (let i = 1; i < targetChain.length; i++) {
            const currentBlock = targetChain[i];
            const previousBlock = targetChain[i - 1];
            if (currentBlock.hash !== currentBlock.calculateHash()) {
                return false;
            }
            if (currentBlock.previousHash !== previousBlock.hash) {
                return false;
            }
        }
        return true;
    }
    // 保存区块链到文件
    saveChainToFile() {
        try {
            // 保存之前校验链是否被篡改
            if (this.isChainValid() === false) {
                console.error('Blockchain is not valid, not saving to file');
                return;
            }
            const jsonContent = JSON.stringify(this.chain, null, 2);
            fs_1.default.writeFileSync(this.dataPath, jsonContent, 'utf8');
        }
        catch (error) {
            console.error('Error saving the blockchain to a file', error);
        }
    }
    // 从文件加载区块链
    loadChainFromFile() {
        try {
            if (fs_1.default.existsSync(this.dataPath)) {
                const fileContent = fs_1.default.readFileSync(this.dataPath, 'utf8');
                const loadedChain = JSON.parse(fileContent);
                this.chain = loadedChain.map((blockData) => {
                    const block = new Block_1.Block(blockData.index, blockData.timestamp, blockData.data, blockData.previousHash);
                    block.nonce = blockData.nonce;
                    block.hash = block.calculateHash();
                    return block;
                });
                // 加载之后校验链是否被篡改
                if (this.isChainValid() === false) {
                    console.error('Blockchain is not valid after loading from file');
                    process.exit(1);
                }
            }
        }
        catch (error) {
            console.error('Error loading the blockchain from a file', error);
        }
    }
}
exports.Blockchain = Blockchain;
