/**
 * Created by ference on 2017/4/8.
 */

var path = require('path');
var Alipay = require('../lib/alipay');

var outTradeId = Date.now().toString();
const keys = require('./keys')


var ali = new Alipay({
    appId: '2016080300159077',
    notifyUrl: 'http://www.iobox.me/callback/alipay',
    rsaPrivate: keys.private,
    rsaPublic: keys.aliPublic,
    sandbox: true,
    signType: 'RSA'
});

const res = ali.query({
    outTradeId: outTradeId
})
console.log(res)

// ali.close({
//     outTradeId: outTradeId
// }).then(function (ret) {
//     console.log("***** ret.body=" + ret.body);
// });


// ali.refund({
//     outTradeId: outTradeId,
//     operatorId: 'XX001',
//     refundAmount: '2.01',
//     refundReason: '退款'
// }).then(function (ret) {
//     console.log("***** ret.body=" + ret.body);
// });


// ali.billDownloadUrlQuery({
//     billType: 'trade',
//     billDate: '2017-03'
// }).then(function (ret) {
//     console.log("***** ret.body=" + ret.body);
// });
