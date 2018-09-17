angular.module('oinio.NewOfferController', [])
    .controller('NewOfferController', function ($scope, $ionicPopup, $stateParams, HomeService, $state, $rootScope) {
        var toDisplayDelCarBool = false;
        var toDisplaySearchBool = false;

        $scope.goBack = function () {
            window.history.go(-1);
        };
        $scope.goSearch = function () {
            var searchGroupDiv = document.getElementById("searchGroupDiv");
            if (toDisplaySearchBool) {
                toDisplaySearchBool = false;
                searchGroupDiv.className = 'search_Group to_Hide';
            } else {
                toDisplaySearchBool = true;
                searchGroupDiv.className = 'search_Group';

            }
        };
        $scope.toDisplayDelCarView = function () {
            var div = document.getElementById("addDelCarView");/*w和h都要用这部分，故单独定义一个div*/
            var OpenClose_ArrowDiv = document.getElementById("OpenClose_Arrow");
            var w = parseInt(div.style.width);
            var h = parseInt(div.style.height);
            // div.style.width=(w+30)+"px";
            if (toDisplayDelCarBool) {
                div.style.height = '65px';
                toDisplayDelCarBool = false;
                OpenClose_ArrowDiv.className = 'arrow_Left_White';
            } else {
                div.style.height = '275px';
                toDisplayDelCarBool = true;
                OpenClose_ArrowDiv.className = 'arrow_Down_White';

            }
        };

        $scope.toAddTableView = function () {

            //添加一个列
            // count = 1;
            // var div = document.getElementById("tabExample");
            // div.style.height = (count*80)+'px';
            // count++;
            // var columnID = "1";

            // var tab = document.getElementById("tabExample");
            // var rowLength = tab.rows.length;
            // var columnLength = tab.rows[1].cells.length;
            // console.log("columnLength:", columnLength);
            // for (var i = 0; i < rowLength; i++) {
            //     if (i == 0) {
            //         var oTd = tab.rows[0].insertCell(columnLength);
            //         oTd.innerHTML = "<tr> <td style='border: 1px solid #979797 background: #eee9e9;padding: 0 1%;font-size: 0.8rem; height: 40px;width: 80px;'>  <div> 车体号1 </div> </td></tr> ";
            //     } else if (i == 1) {//第一列:序号
            //         var oTd = tab.rows[1].insertCell(columnLength);
            //         oTd.innerHTML = "<tr> <td style='border: 1px solid #979797'>  <input class='ad_Input'/> </td></tr> ";
            //     } else if (i > 1) {
            //         var oTd = tab.rows[i].insertCell(columnLength);
            //         oTd.id = "column" + columnID;
            //         oTd.innerHTML = "<tr> <td style='border: 1px solid #979797'>  <div> 车体号1 </div> </td></tr> ";
            //     }
            // }
            var tabExample = document.getElementById("tabExample");
            var tabExampleDiv = document.getElementById("tabExampleDiv");
            var tabAdd = document.getElementById("tabExampleAdd");
            // 获得h1里的内容
            var com = tabExample.innerHTML;
            // 克隆节点
            var con = tabExample.cloneNode();
            // 将内容写到克隆的节点内
            con.innerHTML = com;
            // console.log(con);
            tabExampleDiv.insertBefore(con,tabAdd);

        }
        $scope.submitOrder = function () {
            var mobiDate = $("#currentDate").val();

            if (!mobiDate) {
                $ionicPopup.alert({
                    title: "请选择日期"
                });
                return;
            }
            var selectUserGroup = $("#selectUserGroup").get(0).selectedIndex;//选择index           
            var selectUserEntryId = $scope.allUser[selectUserGroup].userSoupEntryId;//所有用户数组
            var selectUserId = $scope.allUser[selectUserGroup].userId;//所有用户ID

            // 提交请求
            var userSoupEntryId = new Object();
            userSoupEntryId.Id = selectUserId;
            userSoupEntryId._soupEntryId = selectUserEntryId;
            var orderSoupEntryId = new Object();
            orderSoupEntryId._soupEntryId = $stateParams.SendSoupEntryId;

            HomeService.modifyWorkOrder(orderSoupEntryId, userSoupEntryId, mobiDate).then(function (sobject) {
                $state.go('app.home', {}, { reload: false })
                    .then(function () {
                        setTimeout(function () {
                            $rootScope.getSomeData();
                        }, 100);
                    })
            }, function (error) {
                console.log('modifyWorkOrder Error ' + error);
                $ionicPopup.alert({
                    title: "数据错误"
                });
            });

        };

    });

