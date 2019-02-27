/**
 * @ngdoc service
 * @name oinio.services:LindeUrlManage
 *
 * @description
 */
angular
  .module('oinio.services')
  .service('LindeUrlManage',
    function ($q, $http, $interval, $rootScope, $filter, $state, $stateParams, LocalDataService, ForceClientService, TimeCardService) {

      var service = this;

      /**
       * set linde Url
       * */
      service.setLindeUrl = function () {

        var forceClient = ForceClientService.getForceClient().instanceUrl;
        if (forceClient.charAt(16)=='.') {
          $rootScope.forceClientProd = true;
        }else {
          $rootScope.forceClientProd = false;
        }

        if ($rootScope.forceClientProd){
          $rootScope.devLindeCRMURL = "http://webapps.linde-xiamen.com.cn/CCWeb4PDAForCRM4Proc"; //生产环境
          $rootScope.timeCardLindeCRMURL = "http://106.14.144.146:660/api/"; //打卡生产环境
          $rootScope.apkDownloadURL = "http://cnxmnazure-vm11.chinacloudapp.cn:98/Prod_seapp.apk"; //生产环境APK下载地址
          $rootScope.lindeAppId = "linde20180702"; //生产环境appID
          $rootScope.lindeSecret = "363a0910db1dcc47806b63f700ab4b94"; //生产环境Secret
          $rootScope.lindeCompanyCode = "linde"; //生产环境CompanyCode

        } else {
          $rootScope.devLindeCRMURL = "http://webapps.linde-xiamen.com.cn/CCWeb4PDAForCRM"; //测试环境
          $rootScope.timeCardLindeCRMURL = "https://lindechinaoatest.gaiaworkforce.com/api/"; //打卡测试环境
          $rootScope.apkDownloadURL = "http://139.219.108.57:98/SEApp.apk"; //测试环境APK下载地址
          $rootScope.lindeAppId = "linde"; //测试环境appID
          $rootScope.lindeSecret = "linde2018"; //生产环境Secret
          $rootScope.lindeCompanyCode = "lindechinatest"; //生产环境CompanyCode
        }

        TimeCardService.fetchAccesstoken();

      };


    });
