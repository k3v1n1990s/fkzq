// +----------------------------------------------------------------------
// | 疯狂足球
// +----------------------------------------------------------------------
// | Copyright (c) 2017 All rights reserved.
// +----------------------------------------------------------------------
// | Author: Zhengks
// +----------------------------------------------------------------------
module.exports = GameSvr;

var OBJ = require('../Utils/ObjRoot').getObj;

var MsgMgr = require('../Utils/Manager/MsgMgr');
var RpcMgr = require('../Utils/Manager/RpcMgr');
var WsMgr = require('../Utils/Manager/WsMgr');
var ModuleMgr = require('../Utils/Manager/ModuleMgr');
var DbMgr = require('../Utils/Manager/DbMgr');
var LogMgr = require('../Utils/Manager/LogMgr');

var RpcModule = require('./Module/Rpc/RpcModule');
var PlayerModule = require('./Module/Player/PlayerModule');
var LoginModule = require('./Module/Login/LoginModule');
var VirtualFootModule = require('./Module/VirtualFootball/VirtualFootballModule');
var RealFootModule = require('./Module/RealFootball/RealFootballModule');

var configs = require("../config");
var mongoCfg = configs.mongodb();

global.pbSvrcli = require('../Msg/MsgFile/msg.svrcli_pb');

function GameSvr(){}

GameSvr.start = function (serverId, ip, port) {
    //管理器初始化
    console.log('开始启动服务('+serverId+') pid('+process.pid+')...');
    console.log('ip:' + ip + ' 监听端口:'+port);
    new LogMgr();
    new RpcMgr();
    new MsgMgr();
    new ModuleMgr();
    new DbMgr().init(mongoCfg);
    GameSvr.registerModule();
    OBJ('RpcMgr').run(serverId, function(){
        //RPC组件不需要socket，所以提前初始化
        console.log('服务已启动...');
        new WsMgr().run(port, GameSvr.regsterFun);
        GameSvr.run();
    });
};

//运行
GameSvr.run = function() {
    OBJ('ModuleMgr').run(configs.gameSvrConfig().runInterval);
};

//所有用户模块注册
GameSvr.registerModule = function(){
    new RpcModule();
    new LoginModule();
    new PlayerModule();
    new VirtualFootModule();
    new RealFootModule();
}

//与客户端交互的模块这边还需要注册socket事件
GameSvr.regsterFun = function(socket){
    OBJ('LoginModule').registerFun(socket);
    OBJ('PlayerModule').registerFun(socket);
    OBJ('VirtualFootballModule').registerFun(socket);
    OBJ('RealFootballModule').registerFun(socket);
};



