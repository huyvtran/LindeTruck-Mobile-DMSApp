(function () {

  'use strict';
  angular.module('oinio.controllers')
    .controller('NewLinkManController',
      function ($scope, $rootScope, $filter, $state, $log, $stateParams, $ionicPopup, ConnectionMonitor, AppUtilService,
                LocalCacheService, Service1Service) {

        var vm           = this,
            oCurrentUser = LocalCacheService.get('currentUser') || {};
        vm.isOnline = null;
        vm.allStatus = [];
        vm.postionTypes = [];
        var selectAccountId = '',
            soupEntryId     = '';
        /**
         * @func    $scope.$on('$ionicView.beforeEnter')
         * @desc
         */
        $scope.$on('$ionicView.beforeEnter', function () {

          LocalCacheService.set('previousStateForSCReady', $state.current.name);
          LocalCacheService.set('previousStateParamsForSCReady', $stateParams);

          vm.allStatus.push({label: '在岗', value: '10'});
          vm.allStatus.push({label: '退休', value: '20'});
          vm.allStatus.push({label: '清除', value: '30'});
          vm.allStatus.push({label: '离职', value: '40'});
          vm.allStatus.push({label: '转岗', value: '50'});

          vm.postionTypes.push({label: '决策层总经理', value: 'A'});
          vm.postionTypes.push({label: '决策层副总经理', value: 'B'});
          vm.postionTypes.push({label: '采购部门主管', value: 'C'});
          vm.postionTypes.push({label: '采购部门科员', value: 'D'});
          vm.postionTypes.push({label: '技术部门主管', value: 'E'});
          vm.postionTypes.push({label: '技术部门科员', value: 'F'});
          vm.postionTypes.push({label: '使用部门主管', value: 'G'});
          vm.postionTypes.push({label: '使用部门维修', value: 'H'});
          vm.postionTypes.push({label: '使用部门司机', value: 'I'});
          vm.postionTypes.push({label: '使用部门科员', value: 'J'});

        });

        $scope.$on('$ionicView.enter', function () {
          vm.isOnline = ConnectionMonitor.isOnline();
          if (oCurrentUser) {
            vm.username = oCurrentUser.Name;
          }
          getContacts();
        });
        /**
         * 打开搜索页面
         * @param ele
         */
        $scope.openSelectPage = function (ele) {
          console.log('cssss:::', $('#selectCustomer'));
          if (ele === 'customer') {
            $('#selectCustomer').css('display', 'block');
            $('#selectContact').css('display', 'none');
          } else {
            $('#selectContact').css('display', 'block');
            $('#selectCustomer').css('display', 'none');
          }
          $('div.newWorkList_main').animate({
            opacity: '0.6'
          }, 'slow', function () {
            $('div.newWorkList_main').hide();
            $('div.newLinkMan_Select').animate({
              opacity: '1'
            }, 'normal').show();
          });
        };

        /**
         * 关闭搜索页面
         */
        $scope.closeSelectPage = function () {
          console.log('aaaaa');
          $('div.newLinkMan_Select').animate({
            opacity: '0.6'
          }, 'slow', function () {
            $('div.newLinkMan_Select').hide();
            $('div.newWorkList_main').animate({
              opacity: '1'
            }, 'normal').show();
          });
        };
        /**
         * 搜索文字改变
         * @param keyWord
         */
        $scope.searchChange = function (keyWord) {

        };

        /**
         * 查询客户
         * @param keyWord
         */
        $scope.getAccts = function (keyWord) {
          //调用接口获取结果
          AppUtilService.showLoading();
          Service1Service.searchAccounts(keyWord, true).then(function (response) {
            console.log('AccountServicegw', keyWord);
            AppUtilService.hideLoading();

            let accountsName = [];
            let accountsId = [];
            if (response != null && response.length > 0) {
              for (let index = 0; index < response.length; index++) {
                accountsName.push(response[index]);
                accountsId.push(response[index].Id);
              }
              $scope.contentItems = accountsName;
              $scope.getIds = accountsId;
              console.log('AccountServicegw11', accountsName);
            } else {
              var ionPop = $ionicPopup.alert({
                title: '结果',
                template: '没有客户数据'
              });
              ionPop.then(function () {
                $state.go('app.home');
              });
            }
          }, function (error) {
            $log.error('AccountService.searchAccounts Error ' + error);
            AppUtilService.hideLoading();

          }).finally(function () {
            AppUtilService.hideLoading();

          });
        };

        /**
         * 点击单个客户
         * @param acct
         */
        $scope.selectAccount = function (acct) {
          $scope.searchResultAcctName = acct.Name;
          selectAccountId = acct.Id;
          soupEntryId = acct._soupEntryId;
          this.closeSelectPage();
        };
        /**
         * 点击单个联系人
         */
        $scope.selectContact = function (linkMan) {
          $scope.chooseLinkManName = linkMan.displayName;
          $scope.chooseLinkManPhoneNumber = linkMan.phoneNumber;
          this.closeSelectPage();
        };

        /**
         * 取消
         */
        $scope.goBack = function () {
          window.history.back();
        };
        /**
         * 保存
         */
        $scope.saveContactData = function () {
          var re                 = /^[A-Za-z\d]+([-_.][A-Za-z\d]+)*@([A-Za-z\d]+[-.])+[A-Za-z\d]{2,4}$/,
              linManName         = $scope.chooseLinkManName,
              acctName           = $scope.searchResultAcctName,
              linkManPhoneNumber = $scope.chooseLinkManPhoneNumber,
              linkManEmail       = $scope.chooseLinkManEmail,
              linkManstatus      = $('#chooseLinkManStatus').val(),
              linkManPostionType = $('#chooseLinkManPostionType').val();
          if (linManName != null && linManName != '' && linkManPhoneNumber != null) {
            if (acctName != null && acctName != '' && selectAccountId != null && selectAccountId != '') {
              if (linkManEmail != null && re.test(linkManEmail)) {
                AppUtilService.showLoading();
                // Service1Service.getContactsObjectByAcctId(selectAccountId, true).then(function (result) {

                  // console.log('getContactsObjectByAcctId', result);
                  // if (result && result.length!=0){
                  //   var phoneAll = [];
                  //   for (var i = 0; i < result.length; i++) {
                  //     phoneAll.push(result[i].Phone);
                  //   }
                  //   if (phoneAll.indexOf(linkManPhoneNumber) == -1) {
                      var obj = {};
                      obj.Name = linManName;
                      obj.Phone = linkManPhoneNumber;
                      obj.MobilePhone = linkManPhoneNumber;
                      obj.Email = linkManEmail;
                      obj.Contact_State__c = linkManstatus;
                      obj.Position_Type__c = linkManPostionType;
                      obj.Account = {Id: selectAccountId, _soupEntryId: soupEntryId};
                      var objs = [obj];
                      Service1Service.saveContacts(objs, true).then(function (response) {
                        AppUtilService.hideLoading();

                        console.log('saveContacts：', response);
                        if (response.status == 'success') {

                          var inoicPop = $ionicPopup.alert({
                            title: '保存成功'
                          });
                          inoicPop.then(function () {
                            $state.go('app.home');
                          });

                        }
                      }, function (error) {
                        $log.error(error);
                        AppUtilService.hideLoading();
                      });
                    // } else {
                    //   var inoicPop = $ionicPopup.alert({
                    //     title: '已存在该联系人'
                    //   });
                    //   inoicPop.then(function () {
                    //     $('#chooseLinkManName').focus();
                    //   });
                    // }
                  // }else {
                  //   AppUtilService.hideLoading();
                  //   var inoicPop = $ionicPopup.alert({
                  //     title: '客户数据不完整'
                  //   });
                  // }

                // }, function (err) {
                //   $log.error(err);
                //   AppUtilService.hideLoading();
                //
                // });
              } else {
                var inoicPop = $ionicPopup.alert({
                  title: '请输入正确格式的邮箱'
                });
                inoicPop.then(function () {
                  $('#linkManEmail').focus();
                });
              }
            } else {
              var inoicPop = $ionicPopup.alert({
                title: '请选择客户'
              });
              inoicPop.then(function () {
                $('#searchResultAcctName').focus();
              });
            }
          } else {
            var inoicPop = $ionicPopup.alert({
              title: '请填写姓名和电话'
            });
            inoicPop.then(function () {
              $('#chooseLinkManName').focus();
            });
          }
        };

        var getContacts = function () {
          var options = new ContactFindOptions();
          var fields = ['displayName', 'phoneNumbers'];
          options.filter = '';
          options.multiple = true;
          options.hasPhoneNumber = true;
          navigator.contacts.find(fields, function (contacts) {
            onSuccess(contacts);
          }, function onError(error) {
            console.log(error);
          }, options);
        };

        var onSuccess = function (contacts) {
          var arr = [];
          for (var i = 0; i < contacts.length; i++) {
            var obj = {};
            obj.displayName = contacts[i].displayName;
            obj.phoneNumber = contacts[i].phoneNumbers[0].value;
            arr.push(obj);
          }
          $scope.contacts = arr;
        };

      });

})();
