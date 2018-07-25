cordova.define("com.oinio.cordova.plugin.PdfViewer.PdfViewer", function(require, exports, module) {
window.openPDF = function (parameters, callback) {
    cordova.exec(function () {
    }, function () {
    }, "PdfViewer", "openPDF", [ parameters ]);
};

});
