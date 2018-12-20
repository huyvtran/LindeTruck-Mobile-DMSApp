/**
 * @ngdoc service
 * @name oinio.services:TransferRequestService
 *
 * @description
 */
angular
  .module('oinio.services')
  .service('TransferRequestService',
    function ($q, $http, APP_SETTINGS, $log, $filter) {

      var service = this;

      /**
       * 转出客户接口
       * */
      service.truckFleetTransferService = function (codeFiles) {

        var deferred = $q.defer();

        const seriesIds = screenAllTruckSeries(codeFiles);
        console.log('seriesIds', seriesIds);

        deferred.resolve(seriesIds);

        return deferred.promise;
      };


    });

