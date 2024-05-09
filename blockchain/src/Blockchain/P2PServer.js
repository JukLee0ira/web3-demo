"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.P2PServer = void 0;
const Block_1 = require("./Block");
const net_1 = __importDefault(require("net"));
class P2PServer {
    constructor(blockchain, port = 12315, host = "localhost", seedPeers = [
        'localhost:12315',
    ]) {
        this.peers = new Map(); // 节点列表
        this.blockchain = blockchain;
        this.port = port;
        this.host = host;
        this.seedPeers = seedPeers;
    }
    // 启动 P2P 服务器
    listen() {
        const server = net_1.default.createServer(socket => this.handleConnection(socket));
        server.listen(this.port, this.host, () => {
            console.debug(`Listening for P2P connections on: ${this.host}:${this.port}`);
            // 连接到种子节点
            this.connectToSeedPeers();
        });
        // 保持程序活跃
        this.keepAlive();
    }
    // 处理接收到的消息
    handleMessage(socket, message) {
        switch (message.type) {
            case 'blockchain_request':
                console.debug('Received blockchain request');
                this.sendBlockchain(socket);
                break;
            case 'blockchain_response':
                this.handleBlockchainResponse(message.data);
                break;
            case 'peers_request':
                this.sendPeers(socket, message.data);
                break;
            case 'peers_response':
                this.handlePeersResponse(message.data);
                break;
            case 'keep_alive':
                console.debug('Received keep alive message');
                break;
            default:
                console.error('Unknown message type: ', message.type);
        }
    }
    // 请求整个区块链数据
    requestBlockchain(socket) {
        const message = {
            type: 'blockchain_request',
            data: null
        };
        this.sendToSocket(socket, message);
    }
    // 发送整个区块链到请求节点
    sendBlockchain(socket) {
        const message = {
            type: 'blockchain_response',
            data: this.blockchain.chain,
        };
        this.sendToSocket(socket, message);
    }
    // 处理接收到的区块链
    handleBlockchainResponse(data) {
        console.debug('Received blockchain response');
        const newChain = data.map(blockData => {
            const block = new Block_1.Block(blockData.index, blockData.timestamp, blockData.data, blockData.previousHash);
            block.nonce = blockData.nonce;
            block.hash = blockData.hash;
            return block;
        });
        if (newChain.length > this.blockchain.chain.length && this.blockchain.isChainValid(newChain)) {
            console.debug('Received blockchain is longer and valid. Replacing current blockchain with received blockchain');
            this.blockchain.chain = newChain;
            this.blockchain.saveChainToFile();
        }
        else {
            console.debug('Received blockchain is not longer or invalid. Not replacing current blockchain');
        }
    }
    // 请求更新的节点列表
    requestPeers(socket) {
        const message = {
            type: 'peers_request',
            data: {
                host: this.host,
                port: this.port
            }
        };
        this.sendToSocket(socket, message);
    }
    // 发送节点列表到请求节点
    sendPeers(socket, data) {
        this.peers.set(`${data.host}:${data.port}`, socket);
        const peersArray = Array.from(this.peers.keys());
        const message = {
            type: 'peers_response',
            data: peersArray
        };
        this.sendToSocket(socket, message);
    }
    // 处理接收到的节点列表
    handlePeersResponse(data) {
        console.debug('Received peers response: ', data);
        data.forEach(peerAddress => {
            if (!this.peers.has(peerAddress) && this.seedPeers.indexOf(peerAddress) === -1) {
                const [host, port] = peerAddress.split(':');
                this.connectToPeer(host, parseInt(port));
            }
        
        });
    }
    // 保持程序活跃
    keepAlive() {
        setInterval(() => {
            console.debug('Keeping the program alive');
            // 每隔 1 分钟向所有节点发送 keep_alive 消息
            this.broadcast(JSON.stringify({
                type: 'keep_alive',
                data: null
            }));
        }, 1000 * 60);
        // 5s 打印一次节点列表和区块高度
        setInterval(() => {
            console.debug('Peers: ', Array.from(this.peers.keys()));
            console.debug('Blockchain height: ', this.blockchain.height);
        }, 5000);
    }
    // 广播消息，当一个节点接收到新的区块时，广播给其他节点
    broadcast(message) {
        console.debug('Broadcasting message: ', message);
        this.peers.forEach((peer) => {
            peer.write(message + '\n');
        });
    }
    // 连接到其他节点
    connectToPeer(host, port) {
        if (this.peers.has(`${host}:${port}`)) {
            console.debug(`Already connected to peer: ${host}:${port}`);
            return;
        }//如果自己就是种子节点，不连接自己
        if (host === this.host && port === this.port) {
            console.debug(`Can not connect to self: ${host}:${port}`);
            return;
        }
        const socket = net_1.default.createConnection(port, host, () => {
            this.handleConnection(socket);
        });
        this.setupSocketEventHandlers(socket);
        console.debug('Adding peer: ', `${host}:${port}`);
        this.peers.set(`${host}:${port}`, socket);
    }
    // 尝试连接到种子节点
    connectToSeedPeers() {
        this.seedPeers.forEach(peerAddress => {
            const [host, port] = peerAddress.split(':');
            // 如果自己就是种子节点，不连接自己
            if (host === this.host && port === this.port.toString()) {
                return;
            }
            this.connectToPeer(host, parseInt(port));
        });
    }
    // 处理新连接，每个新连接都会向对方请求区块链数据和节点列表
    handleConnection(socket) {
        console.debug('New peer connected');
        this.setupSocketEventHandlers(socket);
        this.requestBlockchain(socket);
        this.requestPeers(socket);
    }
    // 设置 socket 事件处理程序，针对 data、error、close 事件作出处理
    setupSocketEventHandlers(socket) {
        socket.on('data', (data) => this.handleSocketData(socket, data));
        socket.on('error', (error) => this.handleSocketError(socket, error));
        socket.on('close', () => this.handleSocketClose(socket));
    }
    // 处理接收到的数据，处理粘包问题，并反序列化消息
    handleSocketData(socket, data) {
        const messages = data.toString().split('\n').filter(messageStr => messageStr);
        messages.forEach(messageStr => {
            const message = JSON.parse(messageStr);
            console.debug('Received message: ', message);
            this.handleMessage(socket, message);
        });
    }
    // 处理 socket 错误
    handleSocketError(socket, error) {
        console.error('Connection error: ', error);
        this.removePeer(socket);
    }
    // 处理 socket 关闭
    handleSocketClose(socket) {
        console.debug('Connection closed');
        this.removePeer(socket);
    }
    // 发送消息到 socket，序列化消息
    sendToSocket(socket, message) {
        const messageStr = JSON.stringify(message) + '\n';
        console.debug('Sending message: ', messageStr);
        socket.write(messageStr);
    }
    // 从节点列表中移除节点
    removePeer(socket) {
        const key = `${socket.remoteAddress}:${socket.remotePort}`;
        this.peers.delete(key);
    }
}
exports.P2PServer = P2PServer;
