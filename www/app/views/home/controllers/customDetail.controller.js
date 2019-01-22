(function () {
    'use strict';

    angular.module('oinio.CustomDetailController', [])
        .controller('CustomDetailController', function ($scope, $http,$ionicPopup, $filter, $rootScope, $log, $state, $stateParams, $ionicHistory, $cordovaFile, AccountService,
                                                        AppUtilService,Service1Service) {
            var myfileEntity;
            $scope.localLatitude = null;
            $scope.localLongitude = null;
            $scope.account = null;
            var fileTextresult;
            // cordova.plugins.backgroundMode.overrideBackButton();
            //创建文件
            window.requestFileSystem(LocalFileSystem.PERSISTENT, 1024 * 1024, function (fs) {
                console.log('file system open:' + fs.name);
                console.info(fs);
                fs.root.getFile('lindeMapgw.txt', {
                    create: true,
                    exclusive: false
                }, function (fileEntity) {
                    console.info(fileEntity);
                    console.log('文件地址：' + fileEntity.toURL()); //file:///data/data/io.cordova.myapp84ea27/files/files/test1.txt
                    // fileEntry.name == 'someFile.txt'
                    // fileEntry.fullPath == '/someFile.txt'
                    myfileEntity = fileEntity
                    writeFile(fileEntity, "中文内容");
                });
            });


            $rootScope.tirarFoto = function () {
                // window.clearTimeout();

                baidumap_location.getCurrentPosition(function (result) {
                    console.log(JSON.stringify(result, null, 4));
                    writeFile(myfileEntity, JSON.stringify(result, null, 4));
                }, function (error) {
                    console.log(error);
                });

            };

            $scope.$on("$ionicView.beforeEnter", function () {
                $scope.accountName = "";
                $scope.accountAddress = "";
                $scope.accountSAP = "";
            });

            $scope.$on("$ionicView.enter", function () {
                //AppUtilService.showLoading();
                $scope.getBaseInfo();
                $scope.getContactInfo();
            });

            $scope.$on("$ionicView.leave", function () {

            });

            //获取基础信息
            $scope.getBaseInfo = function () {
                //调用接口获取结果
                console.log("$stateParams.SendPassId", $stateParams.SendPassId);
                //online
                AppUtilService.showLoading();
                Service1Service.getAccountWithDetails($stateParams.SendPassId,true)
                    .then(function callBack(account) {
                        AppUtilService.hideLoading();
                        console.log("getAccount", account);
                        if (account != null) {
                            $scope.account = account;
                            $scope.accountName = account.Name;
                            $scope.accountAddress = account.Address__c;
                            $scope.accountSalesMan = account.Salesman_formula__c;
                            //online
                            $scope.accountGroup = account.Sale_Group_Code__r.Name;
                            //offline
                            // account.Sale_Group_Code__r.then(function (account) {
                            //     if (typeof (account) != 'undefined') {
                            //         $scope.accountGroup = account.Name;
                            //     }
                            // }, function error(msg) {
                            //     $log.error('getAccount(Id).then error ' ,msg);
                            //     console.log(msg);
                            // });
                        }
                        else {
                            $ionicPopup.alert({
                                title: "搜索结果",
                                template: "没有数据"
                            });
                        }
                    },function error(msg) {
                        AppUtilService.hideLoading();
                        $log.error('Service1Service.getAccountWithDetails Error ', msg);
                    })
                    .finally(function () {
                        AppUtilService.hideLoading();
                    });

                //offline
                // AccountService.getAccountWithDetails($stateParams.SendPassId).then(function (account) {
                //     console.log("getAccount", account);
                //     if (account != null) {
                //         $scope.account = account;
                //         $scope.accountName = account.Name;
                //         $scope.accountAddress = account.Address__c;
                //         $scope.accountSalesMan = account.Salesman_formula__c;
                //
                //         account.BTU__r.then(function (account) {
                //             if (typeof (account) != 'undefined') {
                //                 $scope.accountGroup = account.Name;
                //             }
                //
                //         }, function (error) {
                //             $log.error('getAccount(Id).then error ' + error);
                //         });
                //
                //     }
                //     else {
                //         $ionicPopup.alert({
                //             title: "搜索结果",
                //             template: "没有数据"
                //         });
                //     }
                // }, function (error) {
                //     $log.error('AccountService.searchAccounts Error ' + error);
                // }).finally(function () {
                //     AppUtilService.hideLoading();
                // });
            };

            //获取联系人信息
            $scope.getContactInfo = function () {
                //online
                Service1Service.getContactsObjectByAcctId($stateParams.SendPassId,true).then(function callBack(contacts) {
                    console.log("getContacts", contacts);
                    if (contacts.length > 0) {
                        $scope.contentItems = contacts;
                    }
                },function error(msg) {
                    $log.error('Service1Service.getContactsObjectByAcctId Error ' ,msg);
                    console.log(msg);
                });

                //offline
                //调用接口获取结果 $rootScope.accountId  "001p000000Qx9m2AAB"
                // AccountService.getContacts($stateParams.SendPassId).then(function (contacts) {
                //     console.log("getContacts", contacts);
                //     if (contacts.length > 0) {
                //         $scope.contentItems = contacts;
                //     }
                // }, function (error) {
                //     $log.error('AccountService.searchAccounts Error ' + error);
                //     console.log(msg);
                // });
            };

            document.getElementById("contactsInfo").style.display = "none";//隐藏
            document.getElementById("contractInfo").style.display = "none";//隐藏
            document.getElementById("locationInfo").style.display = "none";//隐藏
            document.getElementById("labelInfo").style.display = "none";//隐藏
            document.getElementById("offerInfo").style.display = "none";//隐藏
            document.getElementById("carstopInfo").style.display = "none";//隐藏
            document.getElementById("businessInfo").style.display = "none";//隐藏
            document.getElementById("workorderInfo").style.display = "none";//隐藏

            $scope.toDisplayBaseInfo = function () {
                if (document.getElementById("div_baseInfo").style.display == "none") {
                    document.getElementById("div_baseInfo").style.display = "";//显示
                    document.getElementById("div_baseInfoImg").className = "OpenClose_Btn arrow_Down_Red";
                } else {
                    document.getElementById("div_baseInfo").style.display = "none";//隐藏
                    document.getElementById("div_baseInfoImg").className = "OpenClose_Btn arrow_Left_Red";

                }
            };
            $scope.toDisplayContacts = function () {//联系人
                if (document.getElementById("contactsInfo").style.display == "none") {
                    document.getElementById("contactsInfo").style.display = "";//显示
                    document.getElementById("div_contactsImg").className = "OpenClose_Btn arrow_Down_Red";
                } else {
                    document.getElementById("contactsInfo").style.display = "none";//隐藏
                    document.getElementById("div_contactsImg").className = "OpenClose_Btn arrow_Left_Red";

                }
            };
            $scope.toDisplayContract = function () {//合同
                if (document.getElementById("contractInfo").style.display == "none") {
                    document.getElementById("contractInfo").style.display = "";//显示
                    document.getElementById("div_ContractImg").className = "OpenClose_Btn arrow_Down_Red";
                } else {
                    document.getElementById("contractInfo").style.display = "none";//隐藏
                    document.getElementById("div_ContractImg").className = "OpenClose_Btn arrow_Left_Red";

                }
            };
            $scope.toDisplayLocation = function(){//GPS信息读取
                if (document.getElementById("locationInfo").style.display == "none") {
                    document.getElementById("locationInfo").style.display = "block";//显示
                    document.getElementById("div_LocationImg").className = "OpenClose_Btn arrow_Down_Red";
                } else {
                    document.getElementById("locationInfo").style.display = "none";//隐藏
                    document.getElementById("div_LocationImg").className = "OpenClose_Btn arrow_Left_Red";

                }
            };
            $scope.toDisplayLabel = function () {//标签
                if (document.getElementById("labelInfo").style.display == "none") {
                    document.getElementById("labelInfo").style.display = "";//显示
                    document.getElementById("div_LabelImg").className = "OpenClose_Btn arrow_Down_Red";
                } else {
                    document.getElementById("labelInfo").style.display = "none";//隐藏
                    document.getElementById("div_LabelImg").className = "OpenClose_Btn arrow_Left_Red";

                }
            };
            $scope.toDisplayOffer = function () {//报价
                if (document.getElementById("offerInfo").style.display == "none") {
                    document.getElementById("offerInfo").style.display = "";//显示
                    document.getElementById("div_OfferImg").className = "OpenClose_Btn arrow_Down_Red";
                } else {
                    document.getElementById("offerInfo").style.display = "none";//隐藏
                    document.getElementById("div_OfferImg").className = "OpenClose_Btn arrow_Left_Red";

                }
            };
            $scope.toDisplayCarstop = function () {//车档
                if (document.getElementById("carstopInfo").style.display == "none") {
                    document.getElementById("carstopInfo").style.display = "";//显示
                    document.getElementById("div_CarstopImg").className = "OpenClose_Btn arrow_Down_Red";
                } else {
                    document.getElementById("carstopInfo").style.display = "none";//隐藏
                    document.getElementById("div_CarstopImg").className = "OpenClose_Btn arrow_Left_Red";

                }
            };
            $scope.toDisplayBusiness = function () {//商机
                if (document.getElementById("businessInfo").style.display == "none") {
                    document.getElementById("businessInfo").style.display = "";//显示
                    document.getElementById("div_BusinessImg").className = "OpenClose_Btn arrow_Down_Red";
                } else {
                    document.getElementById("businessInfo").style.display = "none";//隐藏
                    document.getElementById("div_BusinessImg").className = "OpenClose_Btn arrow_Left_Red";

                }
            };
            $scope.toDisplayWorkorder = function () {//工单
                if (document.getElementById("workorderInfo").style.display == "none") {
                    document.getElementById("workorderInfo").style.display = "";//显示
                    document.getElementById("div_WorkorderImg").className = "OpenClose_Btn arrow_Down_Red";
                } else {
                    document.getElementById("workorderInfo").style.display = "none";//隐藏
                    document.getElementById("div_WorkorderImg").className = "OpenClose_Btn arrow_Left_Red";

                }

                cordova.plugins.backgroundMode.setDefaults({ silent: true });
                cordova.plugins.backgroundMode.setDefaults({
                    title: 'TheTitleOfYourProcess',
                    text: 'Executing background tasks.'
                });

                // $rootScope.SetTimerInterval = setInterval($rootScope.tirarFoto, 10000);

            };


          $scope.goToContactsInfo = function (item) {
            $state.go('app.changeLinkMan',{userInfo : item, account : $scope.account});

          };

            $scope.goBack = function () {
                // $ionicHistory.goBack();
                window.history.back();
            };

            $scope.readGpsFromImg =function () {
                try {
                    navigator.camera.getPicture(function onPhotoDataSuccess(imgData) {
                            console.log(imgData);
                            navigator.geolocation.getCurrentPosition(function success(position) {
                                console.log(position);
                                $scope.localLatitude = position.coords.latitude;
                                $scope.localLongitude = position.coords.longitude;
                                //offline
                                // AccountService.updateAcctOfficeLocation($stateParams.SendPassId,$scope.localLongitude,$scope.localLatitude).then(function success(res) {
                                //     console.log(res);
                                // },function error(msg) {
                                //     console.log(msg);
                                // });
                                //online
                                Service1Service.updateAcctOfficeLocation($stateParams.SendPassId,$scope.localLongitude,$scope.localLatitude,true).then(function callBack(res) {
                                    console.log(res);
                                },function error(msg) {
                                    console.log(msg);
                                });

                            }, function error(msg) {

                                console.log(msg);
                            });
                        },
                        function onError(error) {
                            return;
                        }
                        , {
                            quality: 50,
                            destinationType: Camera.DestinationType.FILE_URI
                        }
                    );
                } catch (e) {
                    return;
                }
            };


            $scope.jumpToLocalMapApp = function (addressStr) {
                $http({
                    method: 'GET',
                    // url: 'http://api.map.baidu.com/place/v2/search?query='+
                    // JSON.stringify(addressStr)+'&bounds=19.356894,73.324615,53.583491,134.845176&output=json&ak=RBfIl5ZzQ4BowljtLFOHurr4DEp8hAoo'
                     url:"http://api.map.baidu.com/geocoder/v2/?address="+JSON.stringify(addressStr)+"&output=json&ak=RBfIl5ZzQ4BowljtLFOHurr4DEp8hAoo"
                }).then(function successCallback(response) {
                    // 请求成功执行代码
                    console.log("successCallback",response);
                    var lat = response.data.result.location.lat;
                    var lng = response.data.result.location.lng;
                    appAvailability.check("com.baidu.BaiduMap",function () {
                        //success callback
                        var sApp = startApp.set({ /* params */
                            "action":"ACTION_VIEW",
                            "category":"CATEGORY_DEFAULT",
                            "type":"text/css",
                            "package":"com.baidu.BaiduMap",
                            "uri":"baidumap://map/marker?location="+lat+","+lng+"&title="+encodeURI(addressStr)+"&coord_type=wgs84&traffic=on&src=andr.baidu.openAPIdemo",
                            "flags":["FLAG_ACTIVITY_CLEAR_TOP","FLAG_ACTIVITY_CLEAR_TASK"],
                            "intentstart":"startActivity"
                        });
                        sApp.start(function() { /* success */
                            //alert("OK");
                        }, function(error) { /* fail */
                            alert(error);
                        });
                    },function () {
                        //error callback
                        var confirmPopup = $ionicPopup.confirm({
                            title: '友情提示',
                            template: '您尚未安装该app，是否安装',
                            cancelType:'item-customer-bg-lightred',
                            okText: '网页下载',
                            okType:'item-customer-bg-darkred',
                            cancelText:'暂不安装'
                        });
                        confirmPopup.then(function(res){
                            if(res){
                                console.log("安装中......");
                                window.open('http://map.baidu.com/zt/client/index/');
                            }else{
                                console.log("取消安装......");
                            }
                        });
                    });

                }, function errorCallback(response) {
                    // 请求失败执行代码
                    console.log("errorCallback",response);
                });
            };

            //写入文件
            var writeFile = function (fileEntry, dataObj) {
                fileEntry.createWriter(function (fileWriter) {
                    //写入结束
                    fileWriter.onwriteend = function () {
                        console.log('写入文件成功');
                        //读取内容
                        //  readFile(fileEntry);
                    }
                    fileWriter.onerror = function (e) {
                        console.log('写入文件失败:' + e.toString());
                    }
                    if (!dataObj) {
                        dataObj = new Blob(['some file data'], { type: 'text/plain' });
                    }

                    fileWriter.write(dataObj);

                });
            }


            //读取文件内容
            var readFile = function (fileEntry) {
                fileEntry.file(function (file) {
                    var reader = new FileReader();
                    reader.onloadend = function () {
                        console.log('读取文件成功：' + reader.result);
                        //显示文件
                        console.info(fileEntry.fullPath);
                    }
                    reader.readAsText(file);
                }, function (err) {
                    console.info('读取文件失败');
                });
            }


        });


})();

