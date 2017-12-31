module.exports = VirtualFootball;

var OBJ = require('../../../Utils/ObjRoot').getObj;
var uuid = require('node-uuid');
var Schema = require('../../../db_structure');
var PlayerContainer = require('../Player/PlayerContainer');

function VirtualFootball(){

    var no = 0;             //场次
    var matchState = 0;
    var lastTime = 0;
    var event = 0;
    var hostTeamId = 0;
    var hostTeamGoal = 0;
    var guestTeamId = 0;
    var guestTeamGoal = 0;
    var hostWinTimes = 0;
    var hostWinSupport = 0;
    var drawTimes = 0;
    var drawSupport = 0;
    var guestWinTimes = 0;
    var guestWinSupport = 0;
    var hostNextGoalTimes = 0;
    var hostNextGoalSupport = 0;
    var zeroGoalTimes = 0;
    var zeroGoalSupport = 0;
    var guestNextGoalTimes = 0;
    var guestNextGoalSupport = 0;

    var betItem1 = 0;
    var betItem2 = 0;
    var betItem3 = 0;

    var canBet = true;

    var classLogVirtualBet = OBJ('DbMgr').getStatement(Schema.LogVirtualBet());
    var classVirtualSchedule = OBJ('DbMgr').getStatement(Schema.VirtualSchedule());

    init();
    function init(){
        //申请虚拟足球数据
        OBJ('DataCenterModule').send({module:'VirtualFootball', func:'getCurData'});
    }
    //当前比较数据数据中心回执
    this.resCurData = function(source, data){
        no = data.no;
        matchState = data.matchState;
        lastTime = data.lastTime;
        event = data.event;
        hostTeamId = data.hostTeamId;
        hostTeamGoal = data.hostTeamGoal;
        guestTeamId = data.guestTeamId;
        guestTeamGoal = data.guestTeamGoal;
        hostWinTimes = data.hostWinTimes;
        hostWinSupport = data.hostWinSupport;
        drawTimes = data.drawTimes;
        drawSupport = data.drawSupport;
        guestWinTimes = data.guestWinTimes;
        guestWinSupport = data.guestWinSupport;
        hostNextGoalTimes = data.hostNextGoalTimes;
        hostNextGoalSupport = data.hostNextGoalSupport;
        zeroGoalTimes = data.zeroGoalTimes;
        zeroGoalSupport = data.zeroGoalSupport;
        guestNextGoalTimes = data.guestNextGoalTimes;
        guestNextGoalSupport = data.guestNextGoalSupport;

        if(matchState == 0 || matchState == 1)
            canBet = true;
        else
            canBet = false;
    };
    //刷新比赛事件
    this.refreshMatchEvent = function(source, data){
        event = data.event;
        hostTeamId = data.hostTeamId;
        hostTeamGoal = data.hostTeamGoal;
        guestTeamId = data.guestTeamId;
        guestTeamGoal = data.guestTeamGoal;
        hostWinTimes = data.hostWinTimes;
        hostWinSupport = data.hostWinSupport;
        drawTimes = data.drawTimes;
        drawSupport = data.drawSupport;
        guestWinTimes = data.guestWinTimes;
        guestWinSupport = data.guestWinSupport;
        hostNextGoalTimes = data.hostNextGoalTimes;
        hostNextGoalSupport = data.hostNextGoalSupport;
        zeroGoalTimes = data.zeroGoalTimes;
        zeroGoalSupport = data.zeroGoalSupport;
        guestNextGoalTimes = data.guestNextGoalTimes;
        guestNextGoalSupport = data.guestNextGoalSupport;

        //广播
        var push = new pbSvrcli.Push_GoalAndBetArea();
        var goalAndBetArea = new pbSvrcli.GoalAndBetArea();
        goalAndBetArea.setHostteamid(hostTeamId);
        goalAndBetArea.setHostteamgoal(hostTeamGoal);
        goalAndBetArea.setGuestteamid(guestTeamId);
        goalAndBetArea.setGuestteamgoal(guestTeamGoal);
        goalAndBetArea.setHostwintimes(hostWinTimes);
        goalAndBetArea.setHostwinsupport(hostWinSupport);
        goalAndBetArea.setDrawtimes(drawTimes);
        goalAndBetArea.setDrawsupport(drawSupport);
        goalAndBetArea.setGuestwintimes(guestWinTimes);
        goalAndBetArea.setGuestwinsupport(guestWinSupport);
        goalAndBetArea.setHostnextgoaltimes(hostNextGoalTimes);
        goalAndBetArea.setHostnextgoalsupport(hostNextGoalSupport);
        goalAndBetArea.setZerogoaltimes(zeroGoalTimes);
        goalAndBetArea.setZerogoalsupport(zeroGoalSupport);
        goalAndBetArea.setGuestnextgoaltimes(guestNextGoalTimes);
        goalAndBetArea.setGuestnextgoalsupport(guestNextGoalSupport);
        goalAndBetArea.setEvent(event);
        push.setGoalandbetarea(goalAndBetArea);
        io.sockets.in('VirtualFootMainInfo').emit(pbSvrcli.Push_GoalAndBetArea.Type.ID, push.serializeBinary());
    };
    //刷新比赛状态
    this.refreshMatchState = function(source, data){
        matchState = data.matchState;
        lastTime = data.lastTime;
        no = data.no;
        if(matchState == 0 || matchState == 1)
            canBet = true;
        else
            canBet = false;
        if(matchState == 2){
            //关闭投注状态，告诉数据中心可以开始结算了
            OBJ('DataCenterModule').send({module:'VirtualFootball', func:'canSettlement'});
        }

        //广播
        var push = new pbSvrcli.Push_MatchInfo();
        var matchInfo = new pbSvrcli.MatchInfo();
        matchInfo.setMatchstate(matchState);
        matchInfo.setLastsecond(parseInt(lastTime/1000));
        matchInfo.setHostwinnum(0);
        matchInfo.setDrawnum(0);
        matchInfo.setGuestwinnum(0);
        push.setMatchinfo(matchInfo);
        io.sockets.in('VirtualFootMainInfo').emit(pbSvrcli.Push_MatchInfo.Type.ID, push.serializeBinary());
    };
    //刷新投注项
    this.refreshBetItem = function(source, data){
        betItem1 = data.betItem1;
        betItem2 = data.betItem2;
        betItem3 = data.betItem3;
    };
    //获取主页请求
    this.askVirtualFootMainInfo = function(askVirtualFootMainInfo, socket){
        socket.join('VirtualFootMainInfo');

        var res = new pbSvrcli.Res_VirtualFootMainInfo();
        var matchInfo = new pbSvrcli.MatchInfo();
        matchInfo.setMatchstate(matchState);
        matchInfo.setLastsecond(parseInt(lastTime/1000));
        matchInfo.setHostwinnum(0);
        matchInfo.setDrawnum(0);
        matchInfo.setGuestwinnum(0);
        res.setMatchinfo(matchInfo);
        var goalAndBetArea = new pbSvrcli.GoalAndBetArea();
        goalAndBetArea.setHostteamid(hostTeamId);
        goalAndBetArea.setHostteamgoal(hostTeamGoal);
        goalAndBetArea.setGuestteamid(guestTeamId);
        goalAndBetArea.setGuestteamgoal(guestTeamGoal);
        goalAndBetArea.setHostwintimes(hostWinTimes);
        goalAndBetArea.setHostwinsupport(hostWinSupport);
        goalAndBetArea.setDrawtimes(drawTimes);
        goalAndBetArea.setDrawsupport(drawSupport);
        goalAndBetArea.setGuestwintimes(guestWinTimes);
        goalAndBetArea.setGuestwinsupport(guestWinSupport);
        goalAndBetArea.setHostnextgoaltimes(hostNextGoalTimes);
        goalAndBetArea.setHostnextgoalsupport(hostNextGoalSupport);
        goalAndBetArea.setZerogoaltimes(zeroGoalTimes);
        goalAndBetArea.setZerogoalsupport(zeroGoalSupport);
        goalAndBetArea.setGuestnextgoaltimes(guestNextGoalTimes);
        goalAndBetArea.setGuestnextgoalsupport(guestNextGoalSupport);
        goalAndBetArea.setEvent(event);
        res.setGoalandbetarea(goalAndBetArea);
        res.setBetitem1(betItem1);
        res.setBetitem2(betItem2);
        res.setBetitem3(betItem3);
        OBJ('WsMgr').send(socket, pbSvrcli.Res_VirtualFootMainInfo.Type.ID, res.serializeBinary());
    };
    //获取竞猜记录请求
    this.askGuessingRecord = function(askGuessingRecord, socket){
        socket.leave('VirtualFootMainInfo');
        var player = OBJ('PlayerContainer').findPlayer(socket);
        if(null == player)
            return;
        var page = askGuessingRecord.getPage();
        classLogVirtualBet.find({'user_id':player.userId}, null, 
            {skip:page*12, limit:12, sort:{'bet_date':-1}}, function(err, data){
                if(err){
                    console.log(err);
                    return;
                }
                if(data.length == 0)
                    return;
                var res = new pbSvrcli.Res_GuessingRecord();
                var arr = [];
                for(var item of data){
                    var row = new pbSvrcli.GuessingRecord();
                    row.setIssue(item.balance_schedule_id);
                    row.setHostteamid(item.host_team_id);
                    row.setGuestteamid(item.guest_team_id);
                    row.setBetdate(item.bet_date.getTime());
                    row.setBetarea(item.bet_area);
                    row.setBettimes(item.bet_times);
                    row.setBetcoin(item.bet_coin);
                    row.setGetcoin(parseInt(item.distribute_coin));
                    arr.push(row);
                }
                res.setGuessingrecordsList(arr);
                player.send(pbSvrcli.Res_GuessingRecord.Type.ID, res.serializeBinary());
        });
    };
    //获取开奖历史请求
    this.askVirtualHistory = function(askGuessingRecord, socket){
        socket.leave('VirtualFootMainInfo');
        var player = OBJ('PlayerContainer').findPlayer(socket);
        if(null == player)
            return;
        var page = askGuessingRecord.getPage();
        classVirtualSchedule.find(null, null, 
            {skip:page*12, limit:12, sort:{'date_num':-1}}, function(err, data){
                if(err){
                    console.log(err);
                    return;
                }
                if(data.length == 0)
                    return;
                var res = new pbSvrcli.Res_VirtualHistory();
                var arr = [];
                for(var item of data){
                    var row = new pbSvrcli.VirtualHistory();
                    /**
                     var insertValue = {
                            'date':timeAgent.no.substr(0, timeAgent.no.length-3),
                            'date_num':timeAgent.no,
                            'host':matchAgent.hostTeam.Team,
                            'guest':matchAgent.guestTeam.Team,
                            'score':matchAgent.hostTeamGoal+':'+matchAgent.guestTeamGoal,
                            'all_bet':all_bet,
                            'distribution':distribution
                        };
                     */
                    row.setIssue(item.date_num);
                    row.setHostteamid(item.host_team_id);
                    row.setGuestteamid(item.guest_team_id);
                    row.setHostteamgoal(item.host_team_goal);
                    row.setGuestteamgoal(item.guest_team_goal);
                    arr.push(row);
                }
                res.setVirtualhistoryList(arr);
                player.send(pbSvrcli.Res_VirtualHistory.Type.ID, res.serializeBinary());
        });
    };
    //投注请求
    var waitMap = new Map();
    this.askVirtualBet = function(askVirtualBet, socket){
        var player = OBJ('PlayerContainer').findPlayer(socket);
        if (null == player)
            return;
        //获取投注金额
        var betCoin = 1000;
        var betItem = askVirtualBet.getCoinitem();
        if(1 == betItem)
            betCoin = betItem1;
        else if(2 == betItem)
            betCoin = betItem2;
        else if(3 == betItem)
            betCoin = betItem3;
        
        if(player.gameCoin < betCoin)
            return;

        //生成唯一ID
        var uid = uuid.v4();
        waitMap.set(uid, {player:player, betBeforeCoin: player.gameCoin, betArea: askVirtualBet.getBetarea()});
        OBJ('WalletAgentModule').send({module:'WalletSvrAgent', func:'reqBet', data:{
            userid:player.userId, 
            outType:1, 
            outTypeDescription:'足球竞猜', 
            uuid:uid, 
            betCoin:betCoin.toString()
        }});
    };
    //投注钱包回执
    this.resVirtualBet = function(source, data){
        var res = new pbSvrcli.Res_VirtualBet();
        var waitValue = waitMap.get(data.uuid);
        waitMap.delete(data.uuid);
        if(null == waitValue.player)
            return; //扣了钱但是投注会失败，正常情况下不会出现，除非钱包挂掉
        var player = waitValue.player;
        player.gameCoin = data.balance;
        res.setResult(data.res);
        res.setCoin(data.balance);
        //投注
        player.send(pbSvrcli.Res_VirtualBet.Type.ID, res.serializeBinary());
        //生成投注记录
        var modelLogVirtualBet = OBJ('DbMgr').getModel(Schema.LogVirtualBet());
        modelLogVirtualBet.user_id = player.userId;
        modelLogVirtualBet.user_name = player.userName;
        modelLogVirtualBet.bet_date = Date.now();
        modelLogVirtualBet.bet_coin = data.betCoin;
        modelLogVirtualBet.bet_area = waitValue.betArea;
        modelLogVirtualBet.bet_times = getCurAreaTimes(waitValue.betArea);
        modelLogVirtualBet.bet_distribute_coin = parseInt(modelLogVirtualBet.bet_coin*modelLogVirtualBet.bet_times);
        modelLogVirtualBet.distribute_coin = 0;
        modelLogVirtualBet.before_bet_coin = waitValue.betBeforeCoin;
        modelLogVirtualBet.status = 0;
        modelLogVirtualBet.balance_schedule_id = no;
        modelLogVirtualBet.server_id = SERVERID;
        modelLogVirtualBet.out_trade_no = data.uuid;
        modelLogVirtualBet.trade_no = data.trade_no;
        modelLogVirtualBet.settlement_out_trade_no = '';
        modelLogVirtualBet.settlement_trade_no = '';
        modelLogVirtualBet.host_team_id = hostTeamId;
        modelLogVirtualBet.guest_team_id = guestTeamId;
        modelLogVirtualBet.save(function(err){
            if(err){
                console.log(err);
            }
        });
    };

    function getCurAreaTimes(area){
        switch(area){
            case 1: return hostWinTimes;
            case 2: return drawTimes;
            case 3: return guestWinTimes;
            case 4: return hostNextGoalTimes;
            case 5: return zeroGoalTimes;
            case 6: return guestNextGoalTimes;
            default:
                return 0;
        }
    }

    this.run = function(Timestamp){
        
    };
}