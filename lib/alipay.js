/**
 * Created by ference on 2017/4/8.
 */

var utl = require('./utl');
const base64 =require('base64-js')

const encoder = new TextEncoder()

var alipay_gate_way = 'https://openapi.alipay.com/gateway.do';
var alipay_gate_way_sandbox = 'https://openapi.alipaydev.com/gateway.do';

/**
 *
 * @param {Object} opts
 * @param {String} opts.appId  支付宝的appId
 * @param {String} opts.notifyUrl  支付宝服务器主动通知商户服务器里指定的页面http/https路径
 * @param {String | Buffer} opts.rsaPrivate  商户私钥pem文件路径
 * @param {String | Buffer} opts.rsaPublic  支付宝公钥pem文件路径
 * @param {String} opts.signType   签名方式, 'RSA' or 'RSA2'
 * @param {Boolean} [opts.sandbox] 是否是沙盒环境
 * @constructor
 */
function Alipay(opts) {
    this.appId = opts.appId;
    this.notifyUrl = opts.notifyUrl;

    this.rsaPrivateRaw = opts.rsaPrivate
    this.rsaPublicRaw = opts.rsaPublic

    this.appCertSn = opts.appCertSn
    this.rootCertSn = opts.rootCertSn

    this.sandbox = !!opts.sandbox;
}

var props = Alipay.prototype;

props.initKeys = async function(){
    this.rsaPrivate = await crypto.subtle.importKey(
        'pkcs8',
        utl.keyStr2Bytes(this.rsaPrivateRaw),
        {
            name: "RSASSA-PKCS1-v1_5",
            hash: "SHA-256"
        },
        false,
        ['sign']
    )
    this.rsaPublic = await crypto.subtle.importKey(
        'spki',
        utl.keyStr2Bytes(this.rsaPublicRaw),
        {
            name: "RSASSA-PKCS1-v1_5",
            hash: "SHA-256"
        },
        false,
        ['verify']
    )
}

props.makeParams = function(method, biz_content) {
    return {
        alipay_root_cert_sn:this.rootCertSn,
        app_cert_sn:this.appCertSn,
        app_id: this.appId,
        method: method,
        format: 'JSON',
        charset: 'utf-8',
        sign_type: 'RSA2',
        timestamp: new Date().format('yyyy-MM-dd hh:mm:ss'),
        version: '1.0',
        notify_url: this.notifyUrl,
        biz_content: JSON.stringify(biz_content)
    };
};

/**
 * 签名校验
 * @param {Object} response 支付宝的响应报文
 */
props.signVerify = async function (response) {
    var ret = utl.copy(response);
    var sign = ret['sign'];
    ret.sign = undefined;
    ret.sign_type = undefined;

    var response_type = [
        'alipay_trade_app_pay_response',
        'alipay_trade_create_response',
        'alipay_trade_query_response',
        'alipay_trade_refund_response',
        'alipay_trade_precreate_response',
        'alipay_trade_pay_response',
        'alipay_trade_cancel_response',
        'alipay_trade_close_response',
        'alipay_trade_order_settle_response',
        'alipay_trade_fastpay_refund_query_response'
    ];
    // 支付宝（电脑网站支付）响应报文的结构 https://docs.open.alipay.com/api_1/alipay.trade.fastpay.refund.query/
    var res = response_type.reduce(function(prev, currentType){
        if (currentType in ret) return ret[currentType];
        return prev;
    }, null);

    if(res) {
        return await utl.signVerify(JSON.stringify(res), sign, this.rsaPublic);
    } else {
        var tmp = utl.encodeParams(ret);
        return await utl.signVerify(tmp.unencode, sign, this.rsaPublic);
    }
}

props.signParams = async function(params){
    var body = await utl.processParams(params, this.rsaPrivate);
    return (this.sandbox? alipay_gate_way_sandbox : alipay_gate_way) + '?' + body
}

module.exports = Alipay;
