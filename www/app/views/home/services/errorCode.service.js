(function() {

  'use strict';
  /**
   * @ngdoc service
   * @name oinio.services:ErrorCodeServices
   *
   * @description
   */
  angular
    .module('oinio.services')
    .service('ErrorCodeServices',
      function ($q, ForceClientService, $http, APP_SETTINGS, $log, $filter, base64, LocalDataService, ConnectionMonitor,
                LocalSyncService, IonicLoadingService) {

        var service = this;

        /**
         * 获取全部Truck Series
         * */
        service.getAllTruckSeries = function (codeFiles) {

          var deferred = $q.defer();

          const seriesIds = screenAllTruckSeries(codeFiles);
          console.log('seriesIds', seriesIds);

          deferred.resolve(seriesIds);

          return deferred.promise;
        };

        /**
         * 获取全部Truck Series 的 CarType
         * */
        service.getTruckSeriesOfAllCarType = function (codeFiles, series) {

          var deferred = $q.defer();

          const carTypes = screenAllTruckCarType(codeFiles, series);
          console.log('carTypes', carTypes);

          deferred.resolve(carTypes);

          return deferred.promise;

        };

        /**
         * 根据 series   carType  code 得到错误信息
         * */
        service.queryTruckErrorInfo = function (codeFiles, series, carType, code) {

          var deferred = $q.defer();
          // const errorInfo = _.where((codeFiles), {'Series': series, 'CarType': carType, 'PartCode': code});
          // if (errorInfo.length != 0) {
          //   deferred.resolve(errorInfo);
          // } else {
          //   deferred.reject("没有数据");
          // }

          ForceClientService.getForceClient().apexrest(`/ErrorCodeService?action=exactLookup&Series=${series}&CarType=${carType}&PartCode=${code}`, 'GET', {}, null, function (response) {
            console.log('VersionSuccess:', response);
            deferred.resolve(response);

          }, function (error) {
            // console.log('error:', error);
            deferred.reject("没有数据");
          });



          return deferred.promise;

        };

        /**
         * 获取所有error Code
         * */
        service.getErrorCodeAllData = function () {

          var deferred = $q.defer();
          // var errorCode = '';

          ForceClientService.getForceClient().apexrest('/ErrorCodeService?action=queryErrorCode', 'GET', {}, null, function (response) {
            console.log('VersionSuccess:', response);
            deferred.resolve(response);

          }, function (error) {
            // console.log('error:', error);
            deferred.reject(error);
          });

          // service.getErrorCodeTxtAllData('errorCodeCarType.json').then(function (codeFile) {
          //
          //   // errorCode = codeFile;
          //   deferred.resolve(codeFile);
          //
          //   // service.getErrorCodeTxtAllData('errorCode1.txt').then(function (codeFile1) {
          //   //
          //   //   errorCode = errorCode + codeFile1;
          //   //
          //   //   service.getErrorCodeTxtAllData('errorCode2.txt').then(function (codeFile2) {
          //   //
          //   //     errorCode = errorCode + codeFile2;
          //   //
          //   //     deferred.resolve(errorCode);
          //   //
          //   //   }, function (error) {
          //   //     deferred.reject(error);
          //   //   });
          //   //
          //   // }, function (error) {
          //   //   deferred.reject(error);
          //   // });
          //
          // }, function (error) {
          //   deferred.reject(error);
          //
          // });

          return deferred.promise;

        };

        // service.getErrorCodeTxtAllData = function (fileName) {
        //
        //   var deferred = $q.defer();
        //
        //   getAppEntry(fileName).then(function (appEntry) {
        //
        //     readFile(appEntry).then(function (result) {
        //
        //       // const codeResult = base64.decode(result);
        //
        //       deferred.resolve(result);
        //
        //     }, function (error) {
        //       deferred.reject(error);
        //     });
        //
        //   }, function (error) {
        //     deferred.reject(error);
        //   });
        //
        //   return deferred.promise;
        //
        // };
        //
        // function getAppEntry(fileName) {
        //   return new Promise((resolve, reject) => {
        //     const fileURL = `${cordova.file.applicationDirectory}www/app/core/configuration/${fileName}`;
        //     window.resolveLocalFileSystemURL(fileURL,
        //       appEntry => {
        //         resolve(appEntry);
        //       }, error => {
        //         reject(error);
        //       });
        //   });
        // };
        //
        // function readFile(fileEntry) {
        //   return new Promise((resolve, reject) => {
        //     fileEntry.file(file => {
        //       const reader = new FileReader();
        //       reader.onloadend = function () {
        //         resolve(this.result);
        //       };
        //       reader.readAsText(file);
        //
        //     }, onErrorReadFile => {
        //       reject(onErrorReadFile);
        //     });
        //   });
        // };

        function screenAllTruckSeries(codeFiles) {

          var truckSeries = [];
          angular.forEach(codeFiles, function (codeFile) {
            // const series = _.pick(codeFile, 'Series');

            // truckSeries.push(series.Series);
            truckSeries.push(codeFile['Series']);
          });

          var trucks = _.uniq(truckSeries);

          return trucks;
        };

        function screenAllTruckCarType(codeFiles, series) {

          const carTypes = _.where(codeFiles, {'Series': series});
          // var truckCarTypes = [];
          // angular.forEach(codeFiles, function (codeFile) {
          //   console.log(codeFile[series]);
          //   truckCarTypes = codeFile[series];
          // });


          var truckCarTypes = carTypes[0].CarType;
          console.log('carTypes', carTypes[0].CarType);
          console.log('carTypes', truckCarTypes);

          // var truckCarTypes = [];
          // angular.forEach(carTypes, function (carType) {
          //
          //   const newCarType = _.pick(carType, 'CarType');
          //
          //   console.log('carType', newCarType);
          //
          //   truckCarTypes.push(newCarType.CarType);
          // });

          return _.uniq(truckCarTypes);

        };

      });
})();
