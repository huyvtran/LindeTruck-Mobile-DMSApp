angular.module('oinio.NewOfferController', [])
    .controller('NewOfferController', function ($scope, $ionicPopup, $stateParams, HomeService, $state, $rootScope,SQuoteService) {
        var toDisplayDelCarBool = false;
        var tabSVViewNewIndex = 1;
        var selectAcctSetId;
        $scope.currentOrdertest = [1,2,3,4];
        $(document).ready(function () {
        });

        $scope.goBack = function () {
            window.history.back();
        };
        $scope.openSelectPage = function (ele) {
            console.log('cssss:::',$('#selectCustomer'));

            $('div.newWorkList_main').animate({
                opacity:'0.6'
            },'slow','swing',function () {
                $('div.newWorkList_main').hide();
                $('div.newWorkList_truckSelect').animate({
                    opacity:'1'
                },'normal').show();

                if(ele === 'customer') {
                    $('#selectCustomer').css('display', 'block');
                    $('#selectTruck').css('display', 'none');

                }else{
                    $('#selectTruck').css('display', 'block');
                    $('#selectCustomer').css('display', 'none');
                    setTimeout(function() {
                        $scope.selectAccountOfContacts();
                    },100);
                }
            });
        };
        $scope.closeSelectPage = function () {
            $('div.newWorkList_truckSelect').animate({
                opacity:'0.6'
            },'slow',function () {
                $('div.newWorkList_truckSelect').hide();
                $('div.newWorkList_main').animate({
                    opacity:'1'
                },'normal').show();
            });
        };
        $scope.getAccts = function (keyWord) {
            //调用接口获取结果
            SQuoteService.searchAccounts(keyWord).then(function (response) {
                let accountsName = [];
                let accountsId = [];
                if (response.length > 0) {
                    for (let index = 0; index < response.length; index++) {
                        accountsName.push(response[index]);
                        accountsId.push(response[index].Id);
                    }
                    $scope.contentItems = accountsName;
                    $scope.getIds = accountsId;
                    console.log("AccountServicegw22",accountsName);
                }
                else {
                    var ionPop = $ionicPopup.alert({
                        title: "结果",
                        template: "没有客户数据"
                    });
                    ionPop.then(function () {
                        //$ionicHistory.goBack();
                        //$state.go("app.home");
                    });
                }
            }, function (error) {
                $log.error('AccountService.searchAccounts Error ' + error);
            }).finally(function () {
                //AppUtilService.hideLoading();
            });
        };

        $scope.selectAccount = function (acct) {
            SQuoteService.getAccount(acct.Id).then(function (response) {
                console.log(" SQuoteService.getAccount",response);
                selectAcctSetId = acct.Id;
                $scope.searchResultAddress = response.Address__c;
                $scope.searchResultAcctName = response.Name;
            }, function (error) {
                $log.error('getAccount Error ' + error);
            }).finally(function () {
                //AppUtilService.hideLoading();
            });
            $scope.closeSelectPage();
        };
        
        $scope.selectContacts = function (item) {
            $scope.selectContactsName = item.Name;
            $scope.closeSelectPage();
        };
        $scope.selectAccountOfContacts = function () {
            SQuoteService.getContacts(selectAcctSetId).then(function (response) {
                console.log("SQuoteService.getContacts",response);
                let contactsAll = [];
                if (response.length > 0) {
                    for (let index = 0; index < response.length; index++) {
                        contactsAll.push(response[index]);
                    }
                    $scope.contactsItems = contactsAll;
                }
                else {
                    var ionPop = $ionicPopup.alert({
                        title: "结果",
                        template: "没有客户数据"
                    });
                    ionPop.then(function () {
                        //$ionicHistory.goBack();
                        //$state.go("app.home");
                    });
                }

            }, function (error) {
                $log.error('getAccount Error ' + error);
            }).finally(function () {
                //AppUtilService.hideLoading();
            });
            // $scope.init20Trucks(acct.Id);
        };
        $scope.toDisplayDelCarView = function () {
            // var div = document.getElementById("addDelCarView");/*w和h都要用这部分，故单独定义一个div*/
            // var OpenClose_ArrowDiv = document.getElementById("OpenClose_Arrow");
            // var w = parseInt(div.style.width);
            // var h = parseInt(div.style.height);
            // // div.style.width=(w+30)+"px";
            // if (toDisplayDelCarBool) {
            //     div.style.height = '65px';
            //     toDisplayDelCarBool = false;
            //     OpenClose_ArrowDiv.className = 'arrow_Left_White';
            // } else {
            //     div.style.height = '275px';
            //     toDisplayDelCarBool = true;
            //     OpenClose_ArrowDiv.className = 'arrow_Down_White';

            // }
        };
        $scope.toAddSVViewTest = function (element) {
            console.log("toAddSVViewTest");
            element.parentNode.removeChild(element.parentNode);
        };
        $scope.toAddTableView = function () {
            // tabSVViewNewIndex++;
            // tabSVViewSetId = "tabSVViewId" + tabSVViewNewIndex;

            // var tabExample = document.getElementById("tabExample");
            // var tabExampleDiv = document.getElementById("tabExampleDiv");
            // var tabAdd = document.getElementById("tabExampleAdd");
            // 获得h1里的内容
            // var com = tabExample.innerHTML;
            // 克隆节点
            // var con = tabExample.cloneNode(true);
            // // 将内容写到克隆的节点内
            // con.innerHTML = com;
            // console.log("con", con);

            // var tr = document.createElement('tr')
            // tr.innerHTML = '<tr id="tabExampleDiv"><td id="tabExample" class="ad_Right_Td_Group"><table cellpadding="0" cellspacing="0" border="0" class="ad_Right_Table"><tr id="tabSVViewId1"><td class="ad_Right_Td" ng-click="toTabSVView()"><div class="pos_rel"><div> 车体号1 </div><div class="del_red_icon"></div></div></td></tr><tr><td class="ad_Right_Td"><select id="selectStatusId"><option>全部</option><option>未安排</option></select></td></tr><tr><td class="ad_Right_Td "><div> 车型1 </div></td></tr><tr><td class="ad_Right_Td "><div> 车系1 </div></td></tr><tr><td class="ad_Right_Td "><select id="selectStatusId"><option>全部</option><option>未安排</option></select></td></tr><tr><td class="ad_Right_Td "><select id="selectStatusId"><option>保养任务</option></select></td></tr><tr><td class="ad_Right_Td"><input class="ad_Input" /></td></tr></table></td>';
            // tabAdd.parentNode.insertBefore(tr, tabAdd);

            // var elements = tabExampleDiv.getElementsByTagName("table"); 
            // for(var i=0; i<elements.length; i++){ 
            //     console.log("elements[i].name","i:"+i +"elements:"+ elements[i].name+"id:"+elements[i].id);
            // }
            // var counttabSVViewNewIndex = "tabSVViewId" + parseInt(tabSVViewNewIndex-1);
            // var tabSVViewNewId = document.getElementById(counttabSVViewNewIndex);

            // console.log("tabSVViewNewId", tabSVViewNewId+" counttabSVViewNewIndex: "+counttabSVViewNewIndex+" tabSVViewNewIndex: "+tabSVViewNewIndex);
            // let tr = document.createElement('tr')
            // tr.innerHTML = '<tr><td id=' + tabSVViewSetId + ' class="ad_Right_Td" onclick=\"angular.element(this).scope().toAddSVViewTest(angular.element(this))\"> <div class="pos_rel"><div> ' + "车体号1" + ' </div><div class="del_red_icon"></div></div></td></tr>';
            // tabSVViewNewId.parentNode.replaceChild(tr, tabSVViewNewId);
        }


        $scope.toAddSVView = function () {
            var tabExampleSV = document.getElementById("tabExampleSV");
            var tabExampleSVAdd = document.getElementById("tabExampleSVAdd");
            // 获得h1里的内容
            var comSV = tabExampleSV.innerHTML;
            // 克隆节点
            var conSV = tabExampleSV.cloneNode(true);
            // 将内容写到克隆的节点内
            conSV.innerHTML = comSV;
            // console.log(con);
            tabExampleSVAdd.parentNode.insertBefore(conSV, tabExampleSVAdd);

        }

        $scope.toTabSVView = function () {
            var tabExampleDiv = document.getElementById("tabExampleDiv");

            for (var i = 0; i < tabExampleDiv.childNodes.length; i++) {//oList是做的ul的对象。
                //nodeType是节点的类型，利用nodeType来判断节点类型，再去控制子节点
                //nodeType==1 是元素节点
                //nodeType==3 是文本节点
                if (tabExampleDiv.childNodes[i].nodeType == 1) {//查找到oList内的元素节点
                    console.log(tabExampleDiv.childNodes[i]);//在控制器日志中显示找到的元素节点
                }

                console.log("tabExampleDiv:", tabExampleDiv.childNodes[i]);//在控制器日志中显示找到的元素节点

            }

        }
        $scope.toDelSVView = function () {


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

