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

            var service = this;

            /*** INTERFACE ***/
            /** ----- part1: 工单 ----- **/
            /** 1.1 工单更新逻辑 **/
            /**
             * service order overview update button
             * @param isOnline
             * @param reqestBody : online is json body , offline is object{order, assignUsers, childOrders}
             * @returns {*}
             */
            this.updateWorkOrderUtilInfo = function (isOnline, reqestBody) {
                var deferred = $q.defer();
                
                if(isOnline){
                    var requestUrl = '/WorkDetailService?action=saveAction';

                    console.log('current url:::', requestUrl);

                   deferred.resolve(service.restRequest(requestUrl, 'POST', reqestBody));
                }else{
                    var res;
                    res = service.offlineSubmitButtom(reqestBody.order, reqestBody.assignUsers, reqestBody.childOrders);
                    deferred.resolve(res);
                }
                return deferred.promise;
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
                    var SupportEngineersListToDevare;

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
                                    if(entry[0].Support_Engineer__c_sid == uItem){
                                        SupportEngineersListToDevare.push(entry[0]);
                                    }
                                });
                            });
                        }
                    }, function (err) {
                        deferred.reject(err);
                    });

                    if(SupportEngineersListToDevare.length > 0){
                        LocalDataService.devareSObjects('Support_Engineer__c', SupportEngineersListToDevare).then(function (result) {
                            if (!result){
                                //console.error("!result");
                                deferred.reject('Failed to devare Support Engineer.');
                                return;
                            }
                        }, function (error) {
                            console.log('Support Engineer devare error:::', error);
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
            };

            /** 1.2 工单初始化逻辑 **/
            /**
             * init service order overview
             * @param isOnline
             * @param sooId: online is id, offline is soup entry id
             * @param userId: online is id, offline is soup entry id
             * @returns {*}
             */
            this.getWorkOrderUtilInfo = function (isOnline, sooId, userId) {
                var deferred = $q.defer();

                if(isOnline){
                    var requestUrl = "/WorkDetailService/"+ sooId+ "/"+ userId;
                    console.log('current url:::', requestUrl);

                    deferred.resolve(service.restRequest(requestUrl, 'GET', {}));
                }else{
                    var res;
                    res = service.offlineGetWorkDetailInfo(sooId, userId);
                    deferred.resolve(res);
                }
                return deferred.promise;
            };

            this.offlineGetWorkDetailInfo = function (soosid, usersid) {
                var deferred = $q.defer();
                var initializeResult = new Object();

                service.getServiceOrderOverviewInfo(soosid).then(function (sooResult) {
                    initializeResult['soResult'] = sooResult;
                    return service.getServiceOrdersInfo(soosid);
                }).then(function (soResults) {
                    initializeResult['childOrders'] = soResults;
                    return service.getWorkItemsForOverview(soosid);
                }).then(function (wiResults) {
                    initializeResult['workItems'] = wiResults;
                    return service.getAssignedUserInfo(soosid, usersid);
                }).then(function (assginUserResults) {
                    initializeResult['assignUser'] = assginUserResults;
                    return service.getsavedAssginedUser(soosid);
                }).then(function (assginSavedUserResults) {
                    initializeResult['savedUser'] = assginSavedUserResults;
                }).catch(function (error) {
                    deferred.reject(error);
                });

                deferred.resolve(initializeResult);

                return deferred.promise;
            };

            this.getServiceOrderOverviewInfo = function (sooSid) {
                var deferred = $q.defer();
                var sooResult = new Object();

                var sql = "Select {Service_Order_Overview__c:_soup} from {Service_Order_Overview__c} where {Service_Order_Overview__c:_soupEntryId} = '" + sooSid + "'";

                var querySpec = navigator.smartstore.buildSmartQuerySpec(sql, SMARTSTORE_COMMON_SETTING.PAGE_SIZE_FOR_ALL);
                navigator.smartstore.runSmartQuery(querySpec, function (cursor) {
                    if (cursor && cursor.currentPageOrderedEntries && cursor.currentPageOrderedEntries.length) {
                        angular.forEach(cursor.currentPageOrderedEntries, function (entry) {
                            sooResult['Mobile_Offline_Name__c'] = entry[0].Mobile_Offline_Name__c;
                            sooResult['Work_Order_Type__c'] = entry[0].Work_Order_Type__c;
                            sooResult['Description__c'] = entry[0].Description__c;
                            sooResult['Service_Suggestion__c'] = entry[0].Service_Suggestion__c;

                            sooResult.Account_Ship_to__c = entry[0].Account_Ship_to__c;
                            sooResult.Service_Order_Type__c = entry[0].Service_Order_Type__c;
                            sooResult.Status__c = entry[0].Status__c;
                            sooResult.Service_Order_Owner__c = entry[0].Service_Order_Owner__c;
                            sooResult.Plan_Date__c = entry[0].Plan_Date__c;
                            sooResult.Truck_Serial_Number__c = entry[0].Truck_Serial_Number__c;
                            sooResult.Subject__c = entry[0].Subject__c;
                            sooResult._soupEntryId = entry[0]._soupEntryId;
                        });
                    }
                    deferred.resolve(sooResult);
                }, function (err) {
                    deferred.reject(err);
                });
                return deferred.promise;
            };

            this.getServiceOrdersInfo = function(sooSid){
                var deferred = $q.defer();

                var sql =  "select {Service_Order__c:_soup}\
                         from {Service_Order__c}\
                         where {Service_Order__c:Service_Order_Overview__c_sid} ='"+sooSid+"'";
                var querySpec = navigator.smartstore.buildSmartQuerySpec(sql, SMARTSTORE_COMMON_SETTING.PAGE_SIZE_FOR_ALL);
                navigator.smartstore.runSmartQuery(querySpec, function (cursor) {
                    var soResults = [];
                    if (cursor && cursor.currentPageOrderedEntries && cursor.currentPageOrderedEntries.length) {
                        console.log('searchChildOrderSidsForParent::sql::', cursor.currentPageOrderedEntries);
                        angular.forEach(cursor.currentPageOrderedEntries, function (entry) {
                            soResults.push(entry[0]);
                        });
                    }
                    deferred.resolve(soResults);
                }, function (err) {
                    deferred.reject(err);
                });
                return deferred.promise;
            };

            this.getAssignedUserInfo = function (soosid, usersid) {
                var deferred = $q.defer();
                var userWithNameResults = [];
                var recId;

                service.getRecordTypeId('BTU__c', 'Service_Team').then(function (recTypeId) {
                    recId = recTypeId;
                    if(recId == null){
                        deferred.reject('record id is null');
                    }
                    var whereStr = "where {BTU__c:Manager__c_sid} = '"+ usersid + "' and {BTU__c:RecordTypeId} = '"+ recId + "'";
                    return service.getBTUInfoWithWhereStr(whereStr, 'getParentId');
                }).then(function (parentId) {
                    if(parentId == null){
                        deferred.reject('parent id is null');
                    }
                    var whereStr2 = "where {BTU__c:_soupEntryId} = '"+ parentId + "'";
                    return service.getBTUInfoWithWhereStr(whereStr2, 'getParentId');
                }).then(function (grandfatherId) {
                    if(grandfatherId == null){
                        deferred.reject('grandfather Id is null');
                    }
                    var whereStr3 = "where {BTU__c:Parent__c} = '"+ grandfatherId + "' and {BTU__c:RecordTypeId} = '"+ recId + "'";
                    return service.getBTUInfoWithWhereStr(whereStr3, 'getBtuId');
                }).then(function (parentBTUIds) {
                    if(parentBTUIds == null || parentBTUIds.length < 1){
                        deferred.reject('parent btu is null');
                    }
                    var sqlInString = "'" + parentBTUIds.join("','") + "'";
                    var whereStr4 = "where {BTU__c:Parent__c} in ("+ grandfatherId + ") and {BTU__c:RecordTypeId} = '"+ recId + "'";
                    return getBTUInfoWithWhereStr(whereStr4, 'getManagersid');
                }).then(function (mangersIds) {
                    return service.getUserNameWithsIds(mangersIds);
                }).then(function (res) {
                    if(res != null){
                        userWithNameResults = res;
                    }
                }).catch(function (error) {
                    deferred.reject(error);
                });

                deferred.resolve(userWithNameResults);

                return deferred.promise;
            };

            this.getsavedAssginedUser = function (soosid) {
                var deferred = $q.defer();
                var getResult = [];

                service.getSupportEngineerSoids(soosid).then(function (sesids) {
                    return service.getUserNameWithsIds(sesids);
                }).then(function (res) {
                    if(res != null){
                        getResult = res;
                    }
                }).catch(function (error) {
                    deferred.reject(error);
                });

                deferred.resolve(getResult);

                return deferred.promise;
            };

            this.getBTUInfoWithWhereStr = function (whereStr, action) {
                var deferred = $q.defer();
                var getResult;

                var sql =  "select {BTU__c:_soup} from {BTU__c} ";
                if(whereStr != null){
                    sql += whereStr;
                }
                var querySpec = navigator.smartstore.buildSmartQuerySpec(sql, SMARTSTORE_COMMON_SETTING.PAGE_SIZE_FOR_ALL);
                navigator.smartstore.runSmartQuery(querySpec, function (cursor) {
                    if (cursor && cursor.currentPageOrderedEntries && cursor.currentPageOrderedEntries.length) {
                        angular.forEach(cursor.currentPageOrderedEntries, function (entry) {
                            if(action == 'getParentId'){
                                getResult = entry[0].Parent__c;
                            }else if (action == 'getManagersid'){
                                getResult = [];
                                getResult = entry[0].Manager__c_sid;
                            }else if (action == 'getBtuId'){
                                getResult = [];
                                getResult.push(entry[0].Id);
                            }
                        });
                    }
                    deferred.resolve(getResult);
                }, function (err) {
                    deferred.reject(err);
                });
                return deferred.promise;
            };

            this.getSupportEngineerSoids = function (soosid) {
                var deferred = $q.defer();
                var usids = [];

                var sql =  "select {Support_Engineer__c:_soup}\
                         from {Support_Engineer__c}\
                         where {Support_Engineer__c:Service_Order_Overview__c_sid} = '"+ soosid + "'";
                var querySpec = navigator.smartstore.buildSmartQuerySpec(sql, SMARTSTORE_COMMON_SETTING.PAGE_SIZE_FOR_ALL);
                navigator.smartstore.runSmartQuery(querySpec, function (cursor) {
                    if (cursor && cursor.currentPageOrderedEntries && cursor.currentPageOrderedEntries.length) {
                        angular.forEach(cursor.currentPageOrderedEntries, function (entry) {
                            usids.push(entry[0].Support_Engineer__c_sid);
                        });
                    }
                    deferred.resolve(usids);
                }, function (err) {
                    deferred.reject(err);
                });
                return deferred.promise;
            };

            this.getUserNameWithsIds = function (usids) {
                var deferred = $q.defer();
                var userwithName = [];

                if(usids == null || usids.length < 1){
                    deferred.reject('user soup entry id is null');
                }

                var sqlInString = "'" + usids.join("','") + "'";

                var sql =  "select {User:_soup}\
                         from {User}\
                         where {User:_soupEntryId} in (" +sqlInString+ ")";
                var querySpec = navigator.smartstore.buildSmartQuerySpec(sql, SMARTSTORE_COMMON_SETTING.PAGE_SIZE_FOR_ALL);
                navigator.smartstore.runSmartQuery(querySpec, function (cursor) {
                    if (cursor && cursor.currentPageOrderedEntries && cursor.currentPageOrderedEntries.length) {
                        angular.forEach(cursor.currentPageOrderedEntries, function (entry) {
                            userwithName.push(entry[0]._soupEntryId + ',' + entry[0].Name);
                        });
                    }
                    deferred.resolve(userwithName);
                }, function (err) {
                    deferred.reject(err);
                });
                return deferred.promise;
            };



            this.getWorkItemsForOverview = function (sooSid) {
                var deferred = $q.defer();
                var getResult = [];

                service.searchChildOrderSidsForParent(sooSid).then(function (sosids) {
                    return service.getWorkItems(sosids);
                }).then(function (res) {
                    if(res != null){
                        getResult = res;
                    }
                }).catch(function (error) {
                    deferred.reject(error);
                });

                deferred.resolve(getResult);

                return deferred.promise;
            };

            this.getWorkItems = function(sids){
                var deferred = $q.defer();

                if(sids == null || sids.length < 1){
                    console.log('getWorkItems::NULL');
                    deferred.resolve(null);
                    return deferred.promise;
                }

                var sqlInString = "'" + sids.join("','") + "'";

                var sql =  "select {Work_Item__c:_soup}\
                         from {Work_Item__c}\
                         where {Work_Item__c:Service_Order__c_sid} in (" +sqlInString+ ")";

                var querySpec = navigator.smartstore.buildSmartQuerySpec(sql, SMARTSTORE_COMMON_SETTING.PAGE_SIZE_FOR_ALL);
                navigator.smartstore.runSmartQuery(querySpec, function (cursor) {
                    var results = [];
                    if (cursor && cursor.currentPageOrderedEntries && cursor.currentPageOrderedEntries.length) {
                        angular.forEach(cursor.currentPageOrderedEntries, function (entry) {
                            results.push({
                                Id: entry[0].Id,
                                Name: entry[0].Name,
                                Service_Suggestion__c: entry[0].Service_Suggestion__c,
                                Arrival_Time__c: entry[0].Arrival_Time__c,
                                Departure_Time__c: entry[0].Departure_Time__c,
                                Start_Time__c: entry[0].Start_Time__c,
                                Finish_Time__c: entry[0].Finish_Time__c,
                                Service_Order__c: entry[0].Service_Order__c,
                                Service_Order__c_sid: entry[0].Service_Order__c_sid,
                                Service_Order__c_type: entry[0].Service_Order__c_type,
                                _soupEntryId: entry[0]._soupEntryId
                            });
                        });
                    }
                    deferred.resolve(results);
                }, function (err) {
                    deferred.reject(err);
                });
                return deferred.promise;
            };

            this.searchChildOrderSidsForParent = function(sooSid){
                var deferred = $q.defer();

                var sql =  "select {Service_Order__c:_soup}\
                         from {Service_Order__c}\
                         where {Service_Order__c:Service_Order_Overview__c_sid} ='"+sooSid+"'";
                var querySpec = navigator.smartstore.buildSmartQuerySpec(sql, SMARTSTORE_COMMON_SETTING.PAGE_SIZE_FOR_ALL);
                navigator.smartstore.runSmartQuery(querySpec, function (cursor) {
                    var soIds = [];
                    if (cursor && cursor.currentPageOrderedEntries && cursor.currentPageOrderedEntries.length) {
                        angular.forEach(cursor.currentPageOrderedEntries, function (entry) {
                            soIds.push(entry[0]._soupEntryId);
                        });
                    }
                    deferred.resolve(soIds);
                }, function (err) {
                    deferred.reject(err);
                });
                return deferred.promise;
            };

            /** 1.3 工单状态更新逻辑 **/


            /** ----- part2:客户 ----- **/
            this.queryAccountInfo = function(keyword, limitStr, isOnline){
                var deferred = $q.defer();
                //var result = new Object();
                if(isOnline){
                    var requestUrl = '/TruckFleetTransferService?action=queryAcct';
                    if(keyword != null && keyword != ''){
                        requestUrl += '&keyWord=' + keyword;
                        if(limitStr != null && limitStr != ''){
                            requestUrl += '&limitStr=' + limitStr;
                        }
                    }else{
                        deferred.reject('keyword lost !');
                    }

                    deferred.resolve(this.restRequest(requestUrl, 'GET', {}));
                }else{
                    var res = this.searchAccounts(keyword);
                    deferred.resolve(res);
                }
                return deferred.promise;
            }





            /*** FUNCTION ***/

            this.getRecordTypeId = function (sobjectType, devName) {
                var deferred = $q.defer();
                var recId;

                var sql =  "select {RecordType:_soup}\
                         from {RecordType}\
                         where {RecordType:SobjectType} = '"+ sobjectType + "' and {RecordType:DeveloperName} = '" +devName+ "'";
                var querySpec = navigator.smartstore.buildSmartQuerySpec(sql, SMARTSTORE_COMMON_SETTING.PAGE_SIZE_FOR_ALL);
                navigator.smartstore.runSmartQuery(querySpec, function (cursor) {
                    if (cursor && cursor.currentPageOrderedEntries && cursor.currentPageOrderedEntries.length) {
                        angular.forEach(cursor.currentPageOrderedEntries, function (entry) {
                            recId = entry[0].Id;
                        });
                    }
                    deferred.resolve(recId);
                }, function (err) {
                    deferred.reject(err);
                });
                return deferred.promise;
            };

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

            this.restRequest = function (requerstUrl, method, body) {
                var deferred = $q.defer();
                var result = new Object();

                ForceClientService.getForceClient()
                    .apexrest(
                        requerstUrl,
                        method,
                        body,null,function success(res) {
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
                var deferred = $q.defer();

                var sql =  "select {Account:_soup}\
                         from {Account}\
                         where {Account:Name} like '%"+keyword+"%'\
                             or {Account:SAP_Number__c} like '%"+keyword+"%'";
                var querySpec = navigator.smartstore.buildSmartQuerySpec(sql, SMARTSTORE_COMMON_SETTING.PAGE_SIZE_FOR_ALL);
                navigator.smartstore.runSmartQuery(querySpec, function (cursor) {
                    var accounts = [];
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