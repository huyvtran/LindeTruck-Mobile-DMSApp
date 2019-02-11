/**
 * @ngdoc service
 * @name oinio.services:TimeCardService
 *
 * @description
 */
angular
  .module('oinio.services')
  .service('TimeCardService',
    function ($q, $http, $interval, $timeout, $ionicPopup, $ionicLoading, $cordovaFileTransfer, $cordovaFileOpener2, LocalSyncService, ForceClientService) {

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
          setLoopFetchAccesstoken();
          deferred.resolve(response);
        }, function errorCallback(response) {
          console.log('response',response);
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
          cordova.getAppVersion.getVersionNumber().then(function (version) {
            //如果本地与服务端的APP版本不符合
            if (version != serverAppVersion) {
              if (version != serverMinVersion) {
                //更新方式
                forceShowUpdateConfirm(serverAppVersion);
              } else {
                //强制更新方式
                showUpdateConfirm(serverAppVersion);
              }

            } else {
              if (version != serverMinVersion) {
                //强制更新方式
                forceShowUpdateConfirm(serverAppVersion);
              }
            }
          });

        }, function (error) {
          console.log('error:', error);
        });

      };

      // 强制更新对话框
      function forceShowUpdateConfirm(version) {
        var confirmPopup = $ionicPopup.show({
          title: '版本升级' + version,
          template: "您有新的版本需要升级，请点击升级按钮进行升级",
          buttons:  [
            {
              text: '<b>升级</b>',
              type: 'button-positive',
              onTap: function (e) {
                $ionicLoading.show({
                  template: '已经下载：0%'
                });
                var url = 'http://139.219.108.57:98/SEApp.apk'; //可以从服务端获取更新APP的路径
                var filename = url.split('/').pop();
                var targetPath = cordova.file.externalRootDirectory + filename;//APP下载存放的路径，可以使用cordova file插件进行相关配置
                //var targetPath = cordova.file.externalDataDirectory + filename;
                var trustHosts = true;
                var options = {};
                $cordovaFileTransfer.download(url, targetPath, options, trustHosts).then(function (result) {
                  // 打开下载下来的APP
                  $ionicLoading.hide();
                  $cordovaFileOpener2.open(targetPath, 'application/vnd.android.package-archive').then(function callBack(res) {
                    console.log(res);
                    // 成功
                  }, function (err) {
                    console.log('err',err);
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
      function showUpdateConfirm(version) {
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
            var url = 'http://139.219.108.57:98/SEApp.apk'; //可以从服务端获取更新APP的路径
            var filename = url.split('/').pop();
            var targetPath = cordova.file.externalRootDirectory + filename;//APP下载存放的路径，可以使用cordova file插件进行相关配置
            //var targetPath = cordova.file.externalDataDirectory + filename;
            var trustHosts = true;
            var options = {};
            $cordovaFileTransfer.download(url, targetPath, options, trustHosts).then(function (result) {
              // 打开下载下来的APP
              $cordovaFileOpener2.open(targetPath.toURL(), 'application/vnd.android.package-archive').then(function () {
                // 成功
              }, function (err) {
                console.log('err',err);
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


      var setLoopFetchAccesstoken = function () {

        var stopEvent = $interval(function(){
          //每分钟执行一次定时任务
          $http({
            method: 'GET',
            contentType: 'application/json',
            url: lindechinaoa + 'common/accesstoken?appId=linde&secret=linde2018&companyCode=lindechinatest'
          }).then(function successCallback(response) {
            console.log('response',response);
            accesstoken = response.data.data.accessToken;
          }, function errorCallback(response) {
            console.log('response',response);
          });
        },174000);

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

