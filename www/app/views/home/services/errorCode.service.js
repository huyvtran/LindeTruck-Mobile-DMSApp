 /**
   * @ngdoc service
   * @name oinio.services:ErrorCodeServices
   *
   * @description
   */
  angular
    .module('oinio.services')
    .service('ErrorCodeServices',
      function ($q, $http, APP_SETTINGS, $log, $filter, LocalDataService, ConnectionMonitor,
                LocalSyncService, IonicLoadingService) {

        var service = this;

        /**
         * 获取全部Truck Series
         * */
        service.getAllTruckSeries = function () {

          var deferred = $q.defer();

          service.getErrorCodeAllData().then(function (codeFiles) {
            console.log('codeFile', codeFiles);

            const seriesIds = screenAllTruckSeries(codeFiles);
            console.log('seriesIds',seriesIds);

            deferred.resolve(seriesIds);

          }, function (error) {
            deferred.reject(error);
          });

          return deferred.promise;
        };


        /**
         * 获取全部Truck Series 的 CarType
         * */
        service.getTruckSeriesOfAllCarType = function (series) {

          var deferred = $q.defer();

          service.getErrorCodeAllData().then(function (codeFiles) {

            const carTypes = screenAllTruckCarType(codeFiles, series);
            console.log('carTypes',carTypes);

            deferred.resolve(carTypes);

          }, function (error) {
            deferred.reject(error);
          });

          return deferred.promise;

        };


        /**
         * 根据 series   carType  code 得到错误信息
         * */
        service.queryTruckErrorInfo = function (series, carType, code) {

          var deferred = $q.defer();

          service.getErrorCodeAllData().then(function (codeFiles) {

            const errorInfo = _.where(codeFiles, {'Series': series, 'CarType': carType, 'Code': code});
            deferred.resolve(errorInfo);

          }, function (error) {

            deferred.reject(error);
          });

          return deferred.promise;

        };



        service.getErrorCodeAllData = function () {

          var deferred = $q.defer();

          $http.get(APP_SETTINGS.TRUCK_ERROR_CODE_FILE).then(function (codeFile) {
            deferred.resolve(codeFile.data);
          }, function (error) {
            deferred.reject(error);
          });

          return deferred.promise;

        };


        function screenAllTruckSeries(codeFiles) {

          var truckSeries = [];
          angular.forEach(codeFiles, function (codeFile) {
           const series =  _.pick(codeFile, 'Series');

            truckSeries.push(series.Series);
          });

          return _.uniq(truckSeries);
        }


        function screenAllTruckCarType(codeFiles, series) {


          const carTypes = _.where(codeFiles, {'Series': series});

          console.log('carTypes',carTypes);

          var truckCarTypes = [];
          angular.forEach(carTypes, function (carType) {

            const newCarType =  _.pick(carType, 'CarType');

            console.log('carType',newCarType);

            truckCarTypes.push(newCarType.CarType);
          });

          return _.uniq(truckCarTypes);

        }

      });





























