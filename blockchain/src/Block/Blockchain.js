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
    isChainValid(){
        for (let i = 1; i < this.chain.length; i++) {
          const currentBlock = this.chain[i];
          const previousBlock = this.chain[i - 1];
    
          if (currentBlock.hash !== currentBlock.calculateHash()) {
          //当前区块链是否被改是否和摘要一致
          //数据篡改：如果有人试图修改区块链中的某个区块的数据，这个函数会检测到不一致的哈希值。
          //自己造了一个区块，n
            return false;
          }
    
          if (currentBlock.previousHash !== previousBlock.hash) {
          //当前区块链上的前hash值和前一个区块上的hash值是否一致，完整性
          //如果有人试图伪造一个区块并将其插入到区块链中，这个函数也会检测到不一致的哈希值
            return false;
          }
        }
        return true;
      }
    }
exports.Blockchain = Blockchain;
