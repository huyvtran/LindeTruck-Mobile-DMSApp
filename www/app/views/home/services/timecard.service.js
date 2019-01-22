/**
 * @ngdoc service
 * @name oinio.services:TimeCardService
 *
 * @description
 */
angular
  .module('oinio.services')
  .service('TimeCardService',
    function ($q, $http, LocalSyncService) {

      var service = this;
      var lindechinaoa = 'https://lindechinaoatest.gaiaworkforce.com/api/';
      var accesstoken = '';

      /**
       * fetch accesstoken
       * */
      service.fetchAccesstoken = function () {

        var deferred = $q.defer();

        $http({
          method: 'GET',
          contentType: 'application/json',
          url: lindechinaoa + 'common/accesstoken?appId=linde&secret=linde2018&companyCode=lindechinatest'
        }).then(function successCallback(response) {
          console.log('response',response);
          accesstoken = response.data.data.accessToken;
          // setAccesstoken(response.data.data.accessToken);
          deferred.resolve(response);
        }, function errorCallback(response) {
          console.log('response',response);
          deferred.reject(response);
        });

        return deferred.promise;

      };


      var getRequestHeaders = function() {
        var headers = {};

        headers['accessToken'] = accesstoken;

        return headers;
      };


      //Time Card
      // payload
      service.clickTimeCard = function(payload) {

        var deferred = $q.defer();

        $http({
          method: 'POST',
          contentType: 'application/json',
          headers: getRequestHeaders(),
          url: lindechinaoa + 'linde/mainData',
          data:payload
        }).then(function successCallback(response) {
          console.log('response',response);
          deferred.resolve(response);
        }, function errorCallback(response) {
          console.log('response',response);
          deferred.reject(response);
        });

        return deferred.promise;

      };

      /**
       * get accesstoken
       * */
      service.setAccesstoken = function (accessToken) {
        accesstoken = accessToken;
      };

      /**
       * get accesstoken
       * */
      service.getAccesstoken = function () {
        return accesstoken;
      }




    });

