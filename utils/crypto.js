const cryptojs = require('crypto-js')
module.exports = (md5, hmac) => cryptojs.HmacMD5(md5, hmac).toString(cryptojs.enc.Hex)
