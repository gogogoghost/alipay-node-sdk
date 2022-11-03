/**
 * Created by ference on 2017/4/8.
 */

const base64 = require('base64-js')
//字符串转utf8编码字节
const encoder = new TextEncoder()

var utl = module.exports = {};

Date.prototype.format = function (fmt) {
    var o = {
        "M+": this.getMonth() + 1, //月份
        "d+": this.getDate(), //日
        "h+": this.getHours(), //小时
        "m+": this.getMinutes(), //分
        "s+": this.getSeconds(), //秒
        "q+": Math.floor((this.getMonth() + 3) / 3), //季度
        "S": this.getMilliseconds() //毫秒
    };
    if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (var k in o)
        if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
    return fmt;
}

/**
 * 浅拷贝
 * @param obj
 * @returns {{}}
 */
utl.copy = function (obj) {
    var ret = {};
    for(var k in obj) {
        ret[k] = obj[k];
    }
    return ret;
}

/**
 * 对请求参数进行组装、编码、签名，返回已组装好签名的参数字符串
 * @param {{Object} params  请求参数
 * @param {String} privateKey 商户应用私钥
 * @param {String} [signType] 签名类型 'RSA2' or 'RSA'
 * @returns {String}
 */
utl.processParams = async function (params, privateKey) {
    var ret = utl.encodeParams(params);
    var sign = await utl.sign(ret.unencode, privateKey);
    return ret.encode + '&sign=' + encodeURIComponent(sign);
};

/**
 * 对请求参数进行组装、编码
 * @param {Object} params  请求参数
 * @returns {Object}
 */
utl.encodeParams = function (params) {
    var keys = [];
    for(var k in params) {
        var v = params[k];
        if (params[k] !== undefined && params[k] !== "") keys.push(k);
    }
    keys.sort();

    var unencodeStr = "";
    var encodeStr = "";
    var len = keys.length;
    for(var i = 0; i < len; ++i) {
        var k = keys[i];
        if(i !== 0) {
            unencodeStr += '&';
            encodeStr += '&';
        }
        unencodeStr += k + '=' + params[k];
        encodeStr += k + '=' + encodeURIComponent(params[k]);
    }
    return {unencode:unencodeStr, encode:encodeStr};
};

/**
 * 对字符串进行签名验证
 * @param {String} str 要验证的参数字符串
 * @param {String} sign 要验证的签名
 * @param {String} publicKey 支付宝公钥
 * @param {String} [signType] 签名类型
 * @returns {Boolean}
 */
utl.signVerify = async function (str, sign, publicKey) {
    // 支付宝将url中的/全部加上了转义符，而JSON.stringify后的并没有，所以手动给加一下
    str=str.replace(/\//g,'\\/')
    // 签名转bytes
    const signBytes = base64.toByteArray(sign)
    return await crypto.subtle.verify(
        'RSASSA-PKCS1-v1_5',
        publicKey,
        signBytes.buffer,
        encoder.encode(str).buffer
    );
};

/**
 * 对字符串进行签名
 * @param {String} str 要签名的字符串
 * @param {String} privateKey 商户应用私钥
 * @param {String} [signType] 签名类型
 * @returns {String}
 */
utl.sign = async function (str, privateKey) {
    const resBytes = await crypto.subtle.sign(
        'RSASSA-PKCS1-v1_5',
        privateKey,
        encoder.encode(str).buffer
    )
    return base64.fromByteArray(new Uint8Array(resBytes))
}