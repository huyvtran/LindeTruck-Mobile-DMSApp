(function() {

  'use strict';
  /**
   * @ngdoc service
   * @name oinio.services:TimeCardService
   *
   * @description
   */
  angular
    .module('oinio.services')
    .service('TimeCardService',
      function ($q, $log, $http, $interval, $rootScope, $timeout, $ionicPopup, $ionicLoading, $cordovaFileTransfer,
                $cordovaFileOpener2, LocalSyncService, SmartStoreService, ForceClientService) {

        var service = this;
        var accesstoken = '';

        /**
         * fetch accesstoken
         * */
        service.clickTimeCard = function (payload) {

          var deferred = $q.defer();

          var timeCardUrl = $rootScope.timeCardLindeCRMURL
                            + `common/accesstoken?appId=${$rootScope.lindeAppId}&secret=${$rootScope.lindeSecret}&companyCode=${$rootScope.lindeCompanyCode}`;

          $http({
            method: 'GET',
            contentType: 'application/json',
            // url: "http://106.14.144.146:660/api/common/accesstoken?appId=linde20180702&secret=363a0910db1dcc47806b63f700ab4b94&companyCode=linde"
            url: timeCardUrl
          }).then(function successCallback(response) {
            console.log('response', response);
            $log.log('>>>> URL：' + timeCardUrl);
            $log.log('>>>> Response：' + JSON.stringify(response.data));
            accesstoken = response.data.data.accessToken;
            console.log('accesstokenResponse', accesstoken);

            requestClickTimeCard(payload);

            // setAccesstoken(response.data.data.accessToken);
            deferred.resolve(response);
          }, function errorCallback(response) {
            console.log('accesstokenError', response);

            $log.log('>>>> URL：' + timeCardUrl);
            $log.log('>>>> Error：' + JSON.stringify(response));
            deferred.reject(response);
          });

          return deferred.promise;

        };

        service.fetchVersionInfo = function () {

          ForceClientService.getForceClient().apexrest('/version', 'GET', {}, null, function (response) {
            console.log('VersionSuccess:', response);

            //获取版本
            var serverAppVersion = response.SEApp_Current_Version;
            var serverMinVersion = response.SEApp_Min_Version;
            var urlPath =  response.PackagePath;
            cordova.getAppVersion.getVersionNumber().then(function (version) {
                if (compareVersion(version, serverAppVersion) == -1) {
                    if (compareVersion(version, serverMinVersion) == -1){
                        forceShowUpdateConfirm(serverMinVersion, urlPath);
                    } else {
                        showUpdateConfirm(serverAppVersion, urlPath);
                    }
                }
            });

          }, function (error) {
            console.log('error:', error);
          });

        };

        // 强制更新对话框
        function forceShowUpdateConfirm(version,urlPath) {
          var confirmPopup = $ionicPopup.show({
            title: '版本升级' + version,
            template: "您有新的版本需要升级，请点击升级按钮进行升级",
            buttons: [
              {
                text: '<b>升级</b>',
                type: 'button-positive',
                onTap: function (e) {
                  $ionicLoading.show({
                    template: '已经下载：0%'
                  });
                  var url = urlPath; //可以从服务端获取更新APP的路径
                  var filename = url.split('/').pop();
                  var targetPath = cordova.file.externalRootDirectory + filename;//APP下载存放的路径，可以使用cordova file插件进行相关配置
                  //var targetPath = cordova.file.externalDataDirectory + filename;
                  var trustHosts = true;
                  var options = {};
                  $cordovaFileTransfer.download(url, targetPath, options, trustHosts).then(function (result) {
                    // 打开下载下来的APP
                    $ionicLoading.hide();
                    $cordovaFileOpener2.open(targetPath, 'application/vnd.android.package-archive').then(
                      function callBack(res) {
                        console.log(res);
                        // 成功
                      }, function (err) {
                        console.log('err', err);
                        // 错误
                      });
                  }, function (err) {
                    alert('下载失败，请开启读写权限');
                    $ionicLoading.hide();
                  }, function (progress) {
                    //进度，这里使用文字显示下载百分比
                    var downloadProgress = (progress.loaded / progress.total) * 100;
                    $ionicLoading.show({
                      template: '已经下载：' + Math.floor(downloadProgress) + '%'
                    });
                    if (downloadProgress > 99) {
                      $ionicLoading.hide();
                    }
                  });
                }
              }]
          });
        }

        // 显示是否更新对话框
        function showUpdateConfirm(version, urlPath) {
          var confirmPopup = $ionicPopup.confirm({
            title: '版本升级' + version,
            template: "您有新的版本需要升级，请点击升级按钮进行升级",
            cancelText: '取消',
            okText: '升级'
          });
          confirmPopup.then(function (res) {
            if (res) {
              $ionicLoading.show({
                template: '已经下载：0%'
              });
              var url = urlPath; //可以从服务端获取更新APP的路径
              var filename = url.split('/').pop();
              var targetPath = cordova.file.externalRootDirectory + filename;//APP下载存放的路径，可以使用cordova file插件进行相关配置
              //var targetPath = cordova.file.externalDataDirectory + filename;
              var trustHosts = true;
              var options = {};
              $cordovaFileTransfer.download(url, targetPath, options, trustHosts).then(function (result) {
                // 打开下载下来的APP
                SmartStoreService.dropSoupByConfig(false, false, true).then(function () {

                });
                $cordovaFileOpener2.open(targetPath, 'application/vnd.android.package-archive').then(function () {
                  // 成功
                }, function (err) {
                  console.log('err', err);
                  // 错误
                });
                $ionicLoading.hide();
              }, function (err) {
                alert('下载失败，请开启读写权限');
                $ionicLoading.hide();
              }, function (progress) {
                //进度，这里使用文字显示下载百分比
                var downloadProgress = (progress.loaded / progress.total) * 100;
                $ionicLoading.show({
                  template: '已经下载：' + Math.floor(downloadProgress) + '%'
                });
                if (downloadProgress > 99) {
                  $ionicLoading.hide();
                }
              });
            } else {
              // 取消更新
            }
          });
        }

        var getRequestHeaders = function () {
          var headers = {};

          headers['accessToken'] = accesstoken;

          return headers;
        };

        //Time Card
        // payload
        var requestClickTimeCard = function (payload) {

          var deferred = $q.defer();

          $http({
            method: 'POST',
            contentType: 'application/json',
            headers: getRequestHeaders(),
            url: $rootScope.timeCardLindeCRMURL + 'linde/mainData',

            data: payload
          }).then(function successCallback(response) {
            console.log('response', response);
            $log.log('>>>> URL：' + $rootScope.timeCardLindeCRMURL + 'linde/mainData');
            $log.log('>>>> Response：' + JSON.stringify(response));
            deferred.resolve(response);
          }, function errorCallback(response) {
            console.log('response', response);
            $log.log('>>>> URL：' + $rootScope.timeCardLindeCRMURL + 'linde/mainData');
            $log.log('>>>> Error：' + JSON.stringify(response));
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
        };

        /**
         * fetch se app Session
         * */
        service.getSeAppSession = function () {
          var stopEvent = $interval(function () {
            //每分钟执行一次定时任务
            ForceClientService.getForceClient().apexrest('/HomeService?action=keepOnline', 'POST', {}, null, function (response) {
              console.log('keepOnline:', response);

            }, function (error) {
              console.log('error:', error);
            });
            }, 1740000);
        };

        /**
         * 版本号比较
         *0代表相等，1代表version1大于version2，-1代表version1小于version2
         * @param version1
         * @param version2
         * @return
         */
        var compareVersion = function (version1, version2) {
          if (version1 == version2) {
            return 0;
          }
          var version1Array = version1.split(".");
          var version2Array = version2.split(".");
          let index = 0;
          var diff = 0;
          let minLen = Math.min(version1Array.length, version2Array.length);
          while (index < minLen && (diff = parseInt(version1Array[index]) - parseInt(version2Array[index])) == 0) {
            index++;
          }
          if (diff == 0) {
            for (let i = index; i < version1Array.length; i++) {
              if (parseInt(version1Array[i]) > 0) {
                return 1;
              }
            }

            for (let i = index; i < version2Array.length; i++) {
              if (parseInt(version2Array[i]) > 0) {
                return -1;
              }
            }
            return 0;
          } else {
            return diff > 0 ? 1 : -1;
          }
        }

      });





})();
