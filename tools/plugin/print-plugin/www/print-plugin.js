var exec = require('cordova/exec');

// module.exports={
//     checkBlueTooth:function (arg0, success, error) {
//         exec(success, error, 'PrintPlugin', 'checkBlueTooth', [arg0]);
//     },
//     getBlueToothDevices:function (arg0, success, error) {
//         exec(success, error, 'PrintPlugin', 'getBlueToothDevices', [arg0]);
//     },
//     connectBlueToothDevice:function (arg0, success, error) {
//         exec(success, error, 'PrintPlugin', 'connectBlueToothDevice', [arg0]);
//     },
//     printTicket:function (arg0, success, error) {
//         exec(success, error, 'PrintPlugin', 'printTicket', [arg0]);
//     }
// };


exports.checkBlueTooth = function (arg0, success, error) {
    exec(success, error, 'PrintPlugin', 'checkBlueTooth', [arg0]);
};

exports.getBlueToothDevices = function (arg0, success, error) {
    exec(success, error, 'PrintPlugin', 'getBlueToothDevices', [arg0]);
};

exports.connectBlueToothDevice = function (arg0, success, error) {
    exec(success, error, 'PrintPlugin', 'connectBlueToothDevice', [arg0]);
};

exports.printTicket = function (arg0, success, error) {
    exec(success, error, 'PrintPlugin', 'printTicket', [arg0]);
};
