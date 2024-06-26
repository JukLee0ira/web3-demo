"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Blockchain_1 = require("./Blockchain");
const yargs_1 = __importDefault(require("yargs"));
const P2PServer_1 = require("./P2PServer");
// 解析命令行参数
const argv = yargs_1.default
    .option('dataPath', {
    alias: 'd',
    description: 'The path to save the blockchain data file',
    type: 'string',
})
    .option('port', {
    alias: 'p',
    description: 'The port to listen for P2P connections',
    type: 'number',
})
    .option('host', {
    alias: 'h',
    description: 'The host to listen for P2P connections',
    type: 'string',
})
    .option('peers', {
    alias: 'ps',
    description: 'The seed peers to connect to',
    type: 'array',
})
    .help()
    .alias('help', 'h')
    .argv;
// 如果命令行参数提供了dataPath，使用它；否则使用默认值
const blockchainDataPath = argv.dataPath || 'blockchain.json';
const p2pPort = argv.port || 12315;
const p2pHost = argv.host || 'localhost';
const seedPeers = argv.peers || ['localhost:12315'];
const myBlockchain = new Blockchain_1.Blockchain(blockchainDataPath);
const myP2PServer = new P2PServer_1.P2PServer(myBlockchain, p2pPort, p2pHost, seedPeers);
myP2PServer.listen();
// 测试用例
// console.debug("Mining block 1...");
// myBlockchain.addBlock(
//   new Block(
//     1,
//     "2024-02-18",
//     JSON.stringify({
//       amount: 4,
//     })
//   )
// );
// console.debug("Mining block 2...");
// myBlockchain.addBlock(
//   new Block(
//     2,
//     "2024-02-18",
//     JSON.stringify({
//       amount: 10,
//     })
//   )
// );
// console.debug("Blockchain is valid: ", myBlockchain.isChainValid());
// myBlockchain.chain[1].data = JSON.stringify({
//   amount: 100,
// });
// console.debug("Blockchain is valid: ", myBlockchain.isChainValid());
