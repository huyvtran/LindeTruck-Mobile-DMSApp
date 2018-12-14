angular.module('oinio.SendMorePeopleController', [])
    .controller('SendMorePeopleController', function ($scope, $rootScope, $ionicPopup, $filter, $log, $state, $stateParams,
                                                      ConnectionMonitor, LocalCacheService,ForceClientService,AppUtilService) {

        var vm = this,
            localWorkers=[],
            currentOrderId=null,
            oCurrentUser = LocalCacheService.get('currentUser') || {};

        $scope.workers=[];
        $scope.selectWorkersArr=[];
        $scope.getInitDataUri="/WorkDetailService";
        $scope.postUri="/services/apexrest/HomeService?action=saveSE&SupportEngineerMap=";
        $scope.$on('$ionicView.beforeEnter', function () {
            LocalCacheService.set('previousStateForSCReady', $state.current.name);
            LocalCacheService.set('previousStateParamsForSCReady', $stateParams);

        });

        $scope.$on('$ionicView.enter', function () {
            console.log("$stateParams.workOrderId",$stateParams.workOrderId);
            currentOrderId = $stateParams.workOrderId;
            AppUtilService.showLoading();
            ForceClientService.getForceClient().apexrest(
                $scope.getInitDataUri+'/'+currentOrderId+'/'+oCurrentUser.Id,
                "GET",
                {},
                null,
                function callBack(res) {
                    AppUtilService.hideLoading();
                    $scope.initAssignUserData(res.assignUser);
                    $scope.initSavedUserData(res.savedUser,res.assignUser);
                },function error(msg) {
                    AppUtilService.hideLoading();
                    console.log(msg);
                    $ionicPopup.alert({
                        title:"舒适化小组内成员数据失败",
                        template:msg
                    });
                    return false;
                }
            );

        });
        $scope.initAssignUserData=function(workersStrArr){
            if(workersStrArr!=undefined && workersStrArr!=null){
                for (var i=0;i<workersStrArr.length;i++){
                    var singleArr  = workersStrArr[i].split(',');
                    $scope.workers.push({label:singleArr[0],value:singleArr[1]});
                }
                localWorkers = $scope.workers;
            }
        };

        $scope.initSavedUserData=function(savedUsers,workersStrArr){
            if(savedUsers!=undefined && savedUsers != null){
                if (savedUsers.length>0){
                    for (var i=0;i<savedUsers.length;i++){
                        for(var j=0;j<workersStrArr.length;j++){
                            if ((savedUsers[i].split(','))[0]==(workersStrArr[j].split(','))[0]){
                                $scope.selectWorkersArr.push({label:workersStrArr[j].split(',')[0],value:workersStrArr[j].split(',')[1]});
                            }
                        }
                    }
                }
            }

            setTimeout(function () {
                for (var i=0;i<$scope.selectWorkersArr.length;i++){
                    $("input.ckbox_woker_searchresult_item").each(function (index, element) {
                        if($(element).attr("data-recordid") == $scope.selectWorkersArr[i].label) {
                            $(this).prop("checked", true);
                        }
                    });
                }
            },300);
        };

        $scope.goBack=function () {
          window.history.back();
        };

        $scope.getWorkers =function (keyWords) {

            if (keyWords==null||keyWords==""){
                $scope.workers=localWorkers;
                setTimeout(function () {
                    for (var i=0;i<$scope.selectWorkersArr.length;i++){
                        $("input.ckbox_woker_searchresult_item").each(function (index, element) {
                            if($(element).attr("data-recordid") == $scope.selectWorkersArr[i].label) {
                                $(this).prop("checked", true);
                            }
                        });
                    }
                },300);


            }else{
                var tempWorkers=$scope.workers;
                $scope.workers=[];
                for (var i=0;i<tempWorkers.length;i++){
                    if (tempWorkers[i].value.trim().toLowerCase().indexOf(keyWords.toLowerCase())>-1){
                        $scope.workers.push(tempWorkers[i]);
                    }
                }
            }
        };

        $scope.changeWorkerTab = function (index) {
            if (index === '1') {
                $("#addWorker_Tab_1").addClass("selectTruck_Tab_Active");
                $("#addWorker_Tab_2").removeClass("selectTruck_Tab_Active");

                $('#addWorker_result').css('display', 'block');
                $('#addWorker_checked').css('display', 'none');
            } else if (index === '2') {
                $("#addWorker_Tab_1").removeClass("selectTruck_Tab_Active");
                $("#addWorker_Tab_2").addClass("selectTruck_Tab_Active");

                $('#addWorker_result').css('display', 'none');
                $('#addWorker_checked').css('display', 'block');
            }
        };


        $scope.checkAllWorkersResult = function () {
            let ele = $("#ckbox_worker_searchresult_all");

            console.log('checkAllSearchResults:::',ele.prop("checked"));
            if(ele.prop("checked")) {
                $("input.ckbox_woker_searchresult_item").each(function (index, element) {
                    $(this).prop("checked", true);
                });

                angular.forEach($scope.workers, function (searchResult) {
                    let existFlag = false;
                    angular.forEach($scope.selectWorkersArr, function (selected) {
                        if(searchResult.label == selected.label){
                            existFlag = true;
                        }
                    });
                    if(!existFlag){
                        $scope.selectWorkersArr.push(searchResult);
                    }
                });
            }else{
                $("input.ckbox_woker_searchresult_item").each(function (index, element) {
                    console.log('666:::',element.checked);
                    element.checked = false;
                });

                let arr_temp = [];
                angular.forEach($scope.selectWorkersArr, function (selected) {
                    let existFlag = false;
                    angular.forEach($scope.workers, function (searchResult) {
                        if(searchResult.label == selected.label){
                            existFlag = true;
                        }
                    });
                    if(!existFlag){
                        arr_temp.push(selected);
                    }
                });
                $scope.selectWorkersArr = arr_temp;
            }
        };

        $scope.checkCurrentSelectWorker = function (ele) {
            let element = $("input.ckbox_woker_searchresult_item[data-recordid*='"+ele.label+"']");
            console.log('checkSearchResults::',element);

            if(element != null && element.length > 0) {
                if(element[0].checked) {
                    let existFlag = false;
                    for (var i = 0; i < $scope.selectWorkersArr.length; i++) {
                        if (ele.label == $scope.selectWorkersArr[i].label) {
                            existFlag = true;
                        }
                    }
                    if (!existFlag) {
                        $scope.selectWorkersArr.push(ele);
                    }
                }else{
                    let temp = [];
                    for (var i = 0; i < $scope.selectWorkersArr.length; i++) {
                        if (ele.label != $scope.selectWorkersArr[i].label) {
                            temp.push($scope.selectWorkersArr[i]);
                        }
                    }
                    $scope.selectWorkersArr = temp;
                }
            }else{
                console.log('checkSearchResults::error');
            }
        };

        $scope.deleteAllWorkersResult=function () {
            $("input.ckbox_woker_searchresult_item").each(function (index, element) {
                element.checked = false;
            });
            document.getElementById("ckbox_worker_searchresult_all").checked = false;

            $scope.selectWorkersArr = [];
        };

        $scope.deleteCurrentSelectWorker=function (ele) {
            let new_temp = [];

            for (var i=0;i<$scope.selectWorkersArr.length;i++){
                if(ele.label != $scope.selectWorkersArr[i].label){
                    new_temp.push($scope.selectWorkersArr[i]);
                }
            }

            $("input.ckbox_woker_searchresult_item").each(function (index, element) {
                if($(element).attr("data-recordid") == ele.label && element.checked) {
                    element.checked = false;
                }
            });
            document.getElementById("ckbox_worker_searchresult_all").checked = false;
            $scope.selectWorkersArr = new_temp;
        };


        $scope.submit=function () {
            var postData=[];
            for (var i =0;i<$scope.selectWorkersArr.length;i++){
                postData.push({
                    "Name":$scope.selectWorkersArr[i].value,
                    "Support_Engineer__c":$scope.selectWorkersArr[i].label,
                    "Service_Order_Overview__c":currentOrderId
                });
            }
            AppUtilService.showLoading();
            ForceClientService.getForceClient().apexrest(
                $scope.postUri+JSON.stringify(postData),
                "POST",
                {},
                null,function callBack(res) {
                    console.log(res);
                    AppUtilService.hideLoading();
                    if (res.status.toLowerCase()=="success"){
                        $state.go("app.home");
                        $rootScope.getSomeData();
                    }else{
                        $ionicPopup.alert({
                            title:"提交失败",
                            template:res.message
                        });
                        return false;
                    }
                },function error(msg) {
                    console.log(msg);
                    AppUtilService.hideLoading();
                    $ionicPopup.alert({
                        title:"提交失败",
                        template:msg
                    });
                    return false;
                }
            );

        };
    });
