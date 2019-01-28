(function() {

    'use strict';

    /**
     * @ngdoc service
     * @name oinio.services:dualModeService
     *
     * @description
     */
    angular
        .module('oinio.services')
        .service('dualModeService', function($q, $log, $filter,LocalDataService, SMARTSTORE_COMMON_SETTING,ConnectionMonitor,ForceClientService,
                                            LocalSyncService,IonicLoadingService) {

            let service = this;

            /*** INTERFACE ***/
            /** ----- part1: 工单 ----- **/
            /** 1.1 工单更新逻辑 **/
            this.updateWorkOrderUtilInfo = function (isOnline, jsonReqestOnline, objRequestOffline) {
                let deferred = $q.defer();
                
                if(isOnline){
                    let requestUrl = '/WorkDetailService?action=saveAction';

                    console.log('current url:::', requestUrl);

                    ForceClientService.getForceClient()
                        .apexrest(
                            requestUrl,
                            'POST',
                            jsonReqestOnline
                            ,null,function success(res) {
                                console.log(res);
                                result =  res;
                                deferred.resolve(result);
                            },
                            function error(msg) {
                                console.log(msg);
                                deferred.reject(msg);
                            });
                }else{
                    let res;
                    res = service.offlineSubmitButtom(objRequestOffline.order, objRequestOffline.assignUsers, objRequestOffline.childOrders);
                    deferred.resolve(res);
                }
            };
            
            this.offlineSubmitButtom = function (serviceOrderOverviewObj, assignUsers, serviceorderObjs ) {
                var deferred = $q.defer();

                service.updateServiceOrderOverview(serviceOrderOverviewObj, assignUsers).then(function (result1) {
                    var soIds = [];
                    soIds = service.getSoupEntryId(serviceorderObjs);
                    return service.updateServiceOrders(soIds,serviceorderoverviewObj,serviceorderObjs);
                }).then(function (result2) {
                    return service.updateMainServiceOrder(serviceorderObjs, serviceOrderOverviewObj);
                }).then(function (result3) {
                    return service.dmlSupportEngineer(assignUsers, serviceOrderOverviewSId);
                }).then(function (result4) {
                    return service.synchronize();
                }).then(function () {
                    deferred.resolve('done');
                }).catch(function (error) {
                    deferred.reject(error);
                });

                return deferred.promise;
            };


            /**
             * update ServiceOrderOverview
             * @param serviceOrderOverviewObj:serviceOrderOverview Obj
             * @param assignUsers: assign user soup entry ids
             * @returns {*}
             */
            this.updateServiceOrderOverview = function (serviceOrderOverviewObj, assignUsers) {
                console.log('serviceOrderOverviewObj:: '+serviceOrderOverviewObj);
                var deferred = $q.defer();

                LocalDataService.getSObject('Service_Order_Overview__c',serviceOrderOverviewObj._soupEntryId).then(function(sobject) {
                    sobject['Mobile_Offline_Name__c'] = order.Mobile_Offline_Name__c;
                    sobject['Work_Order_Type__c'] = order.Work_Order_Type__c;
                    sobject['Description__c'] = order.Description__c;
                    sobject['Service_Suggestion__c'] = order.Service_Suggestion__c;
                    sobject['Subject__c'] = order.Subject__c;
                    sobject['Service_Order_Sub_Type__c'] = order.Service_Order_Sub_Type__c;

                    if(assignUsers.length == 1 || (assignUsers.length > 1 && assignUsers.indexOf(sobject['Service_Order_Owner__c_sid']) == -1)){
                        sobject['Service_Order_Owner__c_sid'] = assignUsers[0];
                        sobject['Service_Order_Owner__c_type'] = 'User';
                    }


                    LocalDataService.updateSObjects('Service_Order_Overview__c', [sobject]).then(function(result) {
                        if (!result){
                            deferred.reject('Failed to update service order overview!');
                            return;
                        }
                        deferred.resolve(result);
                    }, function (error) {
                        deferred.reject('Failed to update service order overview!');
                    });
                }, angular.noop);

                return deferred.promise;
            };

            this.updateServiceOrders = function (serviceorderSids,serviceorderoverviewObj,serviceorderObjs) {
                var deferred = $q.defer();

                LocalDataService.getSObjects('Service_Order__c',serviceorderSids).then(function(sobjects) {

                    angular.forEach(sobjects, function (sobject) {
                        sobject['Mobile_Offline_Name__c'] = serviceorderoverviewObj.Mobile_Offline_Name__c;
                        sobject['Work_Order_Type__c'] = serviceorderoverviewObj.Work_Order_Type__c;
                        sobject['Description__c'] = serviceorderoverviewObj.Description__c;
                        sobject['Service_Suggestion__c'] = serviceorderoverviewObj.Service_Suggestion__c;
                        sobject['Subject__c'] = serviceorderoverviewObj.Subject__c;

                        angular.forEach(serviceorderObjs, function (child) {
                            if(sobject._soupEntryId == child._soupEntryId){
                                var isNeedUpdate = false;
                                if(child.Operation_Hour__c != 0 &&  child.Operation_Hour__c != null){
                                    sobject['Operation_Hour__c'] = child.Operation_Hour__c;
                                    isNeedUpdate = true;
                                }
                                if(child.New_Operation_Hour__c != 0 &&  child.New_Operation_Hour__c != null){
                                    sobject['New_Operation_Hour__c'] = child.New_Operation_Hour__c;
                                    isNeedUpdate = true;
                                }
                                if(child.Service_Suggestion__c != null){
                                    sobject['Service_Suggestion__c'] = child.Service_Suggestion__c;
                                    isNeedUpdate = true;
                                }
                                if(child.Maintenance_Level__c != null){
                                    sobject['Maintenance_Level__c'] = child.Maintenance_Level__c;
                                    isNeedUpdate = true;
                                }

                                if(isNeedUpdate){
                                    var nowDate = new Date();
                                    sobject['Measure_Date__c'] = nowDate.toLocaleDateString();
                                    sobject['Need_Update_Truck_Hour__c'] = true;
                                }
                            }
                        });
                    });

                    LocalDataService.updateSObjects('Service_Order__c', sobjects).then(function(result) {
                        if (!result){
                            deferred.reject('Failed to update service orders!');
                            return;
                        }
                        deferred.resolve(result);
                    }, function (error) {
                        deferred.reject('Failed to update service orders!');
                    });

                }, angular.noop);

                return deferred.promise;
            };

            this.updateMainServiceOrder = function (serviceorderObjs, serviceOrderOverviewObj) {
                var deferred = $q.defer();

                LocalDataService.getSObject('Service_Order_Overview__c',serviceOrderOverviewObj._soupEntryId).then(function(sobject) {
                    if(serviceorderObjs.length > 0 && sobject['Main_Service_Order__c_sid'] == null){
                        sobject['Main_Service_Order__c_sid'] = serviceorderObjs[0]._soupEntryId;
                        sobject['Main_Service_Order__c_type'] = 'Service_Order__c';
                    }


                    LocalDataService.updateSObjects('Service_Order_Overview__c', [sobject]).then(function(result) {
                        if (!result){
                            deferred.reject('Failed to update service order overview!');
                            return;
                        }
                        deferred.resolve(result);
                    }, function (error) {
                        deferred.reject('Failed to update service order overview!');
                    });
                }, angular.noop);

                return deferred.promise;
            };

            this.dmlSupportEngineer = function (userIds, serviceOrderOverviewSId) {
                var deferred = $q.defer();

                LocalDataService.createSObject('Support_Engineer__c').then(function(sobject) {
                    var SupportEngineersListToInsert;
                    var SupportEngineersListToDelete;

                    angular.forEach(userIds, function (uId){
                        var newSupportEngineer;
                        newSupportEngineer['Name'] = uId;
                        newSupportEngineer['Support_Engineer__c_sid'] = uId;
                        newSupportEngineer['Support_Engineer__c_type'] = 'User';
                        newSupportEngineer['Service_Order_Overview__c_sid'] = serviceOrderOverviewSId;
                        newSupportEngineer['Service_Order_Overview__c_type'] = 'Service_Order_Overview__c';
                        SupportEngineersListToInsert.push(newSupportEngineer);
                    });

                    var sql = "Select {Support_Engineer__c:_soup} from {Support_Engineer__c} where {Support_Engineer__c:Service_Order_Overview__c_sid} = '" + serviceOrderOverviewSId + "'";

                    var querySpec = navigator.smartstore.buildSmartQuerySpec(sql, SMARTSTORE_COMMON_SETTING.PAGE_SIZE_FOR_ALL);
                    navigator.smartstore.runSmartQuery(querySpec, function (cursor) {
                        if (cursor && cursor.currentPageOrderedEntries && cursor.currentPageOrderedEntries.length) {
                            angular.forEach(cursor.currentPageOrderedEntries, function (entry) {
                                angular.forEach(userIds, function (uItem) {
                                    if(entry.Support_Engineer__c_sid == uItem){
                                        SupportEngineersListToDelete.push(entry);
                                    }
                                });
                            });
                        }
                    }, function (err) {
                        deferred.reject(err);
                    });

                    if(SupportEngineersListToDelete.length > 0){
                        LocalDataService.deleteSObjects('Support_Engineer__c', SupportEngineersListToDelete).then(function (result) {
                            if (!result){
                                //console.error("!result");
                                deferred.reject('Failed to delete Support Engineer.');
                                return;
                            }
                        }, function (error) {
                            console.log('Support Engineer delete error:::', error);
                        });
                    }

                    LocalDataService.saveSObjects('Support_Engineer__c', SupportEngineersListToInsert).then(function(result) {
                        if (!result){
                            deferred.reject('Failed to insert Support Engineer.');
                            return;
                        }
                    }, function (error) {
                        console.log('Support Engineer insert error:::', error);
                    });

                }, angular.noop);
                deferred.resolve('dmlSupportEngineer success!');
                return deferred.promise;
            }

            /** ----- part2:客户 ----- **/
            this.queryAccountInfo = function(keyword, limitStr, isOnline){
                let deferred = $q.defer();
                //let result = new Object();
                if(isOnline){
                    let requestUrl = '/TruckFleetTransferService?action=queryAcct';
                    if(keyword != null && keyword != ''){
                        requestUrl += '&keyWord=' + keyword;
                        if(limitStr != null && limitStr != ''){
                            requestUrl += '&limitStr=' + limitStr;
                        }
                    }else{
                        deferred.reject('keyword lost !');
                    }

                    deferred.resolve(this.restRequest(requestUrl));
                }else{
                    let res = this.searchAccounts(keyword);
                    deferred.resolve(res);
                }
                return deferred.promise;
            }





            /*** FUNCTION ***/

            /**
             * get objects soup entry ids
             * @param obj
             * @returns {*}
             */
            this.getSoupEntryId = function (obj) {
                var deferred = $q.defer();
                var soupEntryId = [];

                angular.forEach(obj, function (ObjItem) {
                    if(obj._soupEntryId == null){
                        deferred.reject('soup entry id can not be null!');
                    }else{
                        soupEntryId.push(obj._soupEntryId);
                    }
                });
                deferred.resolve(soupEntryId);
                return deferred.promise;
            }

            this.restRequest = function (requerstUrl) {
                let deferred = $q.defer();
                let result = new Object();

                ForceClientService.getForceClient()
                    .apexrest(
                        requerstUrl,
                        'GET',
                        {

                        },null,function success(res) {
                            console.log(res);
                            result =  res;
                            deferred.resolve(result);
                        },
                        function error(msg) {
                            console.log(msg);
                            deferred.reject(msg);
                        });
                return deferred.promise;
            }

            /**
             * @func  searchAccounts
             * @desc  search (fuzzy) Account list by account name or account sap number
             * @param {String} keyword - part of account name or account sap number
             * @returns {Promise} [Account] - Account list, including Id, Name, SAP_Number__c
             */
            this.searchAccounts = function(keyword){
                console.log('searchAccounts.keyword:%s', keyword);
                let deferred = $q.defer();

                let sql =  "select {Account:_soup}\
                         from {Account}\
                         where {Account:Name} like '%"+keyword+"%'\
                             or {Account:SAP_Number__c} like '%"+keyword+"%'";
                let querySpec = navigator.smartstore.buildSmartQuerySpec(sql, SMARTSTORE_COMMON_SETTING.PAGE_SIZE_FOR_ALL);
                navigator.smartstore.runSmartQuery(querySpec, function (cursor) {
                    let accounts = [];
                    if (cursor && cursor.currentPageOrderedEntries && cursor.currentPageOrderedEntries.length) {
                        angular.forEach(cursor.currentPageOrderedEntries, function (entry) {
                            accounts.push({
                                Id: entry[0].Id,
                                Name: entry[0].Name,
                                Address__c: entry[0].Address__c,
                                SAP_Number__c: entry[0].SAP_Number__c,
                                _soupEntryId: entry[0]._soupEntryId
                            });
                        });
                    }
                    deferred.resolve(accounts);
                }, function (err) {
                    $log.error(err);
                    console.error(err);
                    deferred.reject(err);
                });
                console.log('searchAccounts::', deferred.promise);
                return deferred.promise;
            };

            /**
             * synchronize to salesforce if device is online
             */
            this.synchronize = function () {
                var deferred = $q.defer();

                if (ConnectionMonitor.isOnline()) {
                    IonicLoadingService.show($filter('translate')('cl.sync.lb_synchronizing'));
                    LocalSyncService.syncUpObjectByAll().then(function () {
                        IonicLoadingService.hide();
                        deferred.resolve();
                    });
                } else {
                    deferred.resolve();
                }

                return deferred.promise;
            };
        });
})();