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
                    //var soIds = [];
                    //soIds = service.getSoupEntryId(serviceorderObjs);
                    return service.getSoupEntryId(serviceorderObjs);
                    //return service.updateServiceOrders(soIds,serviceOrderOverviewObj,serviceorderObjs);
                }).then(function (soids) {
                    //var soIds = [];
                    //soIds = service.getSoupEntryId(serviceorderObjs);
                    return service.updateServiceOrders(soids,serviceOrderOverviewObj,serviceorderObjs);
                }).then(function (result2) {
                    return service.updateMainServiceOrder(serviceorderObjs, serviceOrderOverviewObj);
                }).then(function (result3) {
                    return service.dmlSupportEngineer(assignUsers, serviceOrderOverviewObj._soupEntryId);
                })/*.then(function (result4) {
                    return service.synchronize();
                })*/.then(function (result4) {
                    deferred.resolve(service.generateResult('Success', 'Action Success!'));
                }).catch(function (error) {
                    deferred.reject(service.generateResult('Fail', error));
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
                    sobject['Mobile_Offline_Name__c'] = serviceOrderOverviewObj.Mobile_Offline_Name__c;
                    sobject['Work_Order_Type__c'] = serviceOrderOverviewObj.Work_Order_Type__c;
                    sobject['Description__c'] = serviceOrderOverviewObj.Description__c;
                    sobject['Service_Suggestion__c'] = serviceOrderOverviewObj.Service_Suggestion__c;
                    sobject['Subject__c'] = serviceOrderOverviewObj.Subject__c;
                    sobject['Service_Order_Sub_Type__c'] = serviceOrderOverviewObj.Service_Order_Sub_Type__c;

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
                                    //var nowDate = new Date();
                                    //sobject['Measure_Date__c'] = nowDate.toLocaleDateString();
                                    sobject['Measure_Date__c'] = service.getCurrentDateString();
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
                                    if(entry[0].Support_Engineer__c_sid == uItem){
                                        SupportEngineersListToDelete.push(entry[0]);
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
                var sooObj;

                service.getServiceOrderOverviewInfo(soosid).then(function (sooResult) {
                    //initializeResult['soResult'] = sooResult;
                    sooObj = sooResult;
                    return service.getReleatedAccountInfo(sooObj.Account_Ship_to__c_sid);
                }).then(function (accResult) {
                    sooObj['Account_Ship_to__r'] = accResult;
                    //initializeResult['childOrders'] = soResults;
                    return service.getRelatedUserInfo(sooObj.Service_Order_Owner__c_sid);
                }).then(function (userResult) {
                    sooObj['Service_Order_Owner__r'] = userResult;
                    initializeResult['soResult'] = sooObj;
                    return service.getServiceOrdersInfo(soosid);
                }).then(function (soResults) {
                    initializeResult['childOrders'] = soResults;
                    return service.getWorkItemsForOverview(soosid);
                }).then(function (wiResults) {
                    //initializeResult['workItems'] = wiResults;
                    return service.getCreateByInfoForWorkItem(wiResults);
                }).then(function (wiResultsNew) {
                    initializeResult['workItems'] = wiResultsNew;
                    return service.getAssignedUserInfo(soosid, usersid);
                }).then(function (assginUserResults) {
                    initializeResult['assignUser'] = assginUserResults;
                    return service.getsavedAssginedUser(soosid);
                }).then(function (assginSavedUserResults) {
                    initializeResult['savedUser'] = assginSavedUserResults;
                    deferred.resolve(initializeResult);
                }).catch(function (error) {
                    deferred.reject(service.generateResult('Fail', error));
                });
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
                            sooResult['Name'] = entry[0].Name;
                            sooResult['Mobile_Offline_Name__c'] = entry[0].Mobile_Offline_Name__c;
                            sooResult['Work_Order_Type__c'] = entry[0].Work_Order_Type__c;
                            sooResult['Description__c'] = entry[0].Description__c;
                            sooResult['Service_Suggestion__c'] = entry[0].Service_Suggestion__c;

                            sooResult.Account_Ship_to__c = entry[0].Account_Ship_to__c;
                            sooResult.Account_Ship_to__c_sid = entry[0].Account_Ship_to__c_sid;
                            sooResult.Service_Order_Type__c = entry[0].Service_Order_Type__c;
                            sooResult.Status__c = entry[0].Status__c;
                            sooResult.Service_Order_Owner__c = entry[0].Service_Order_Owner__c;
                            sooResult.Service_Order_Owner__c_sid = entry[0].Service_Order_Owner__c_sid;
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

            this.getReleatedAccountInfo = function (acctsid) {
                var deferred = $q.defer();
                var accResult = new Object();

                if(acctsid == null || acctsid == ''){
                    deferred.resolve(accResult);
                    return deferred.promise;
                }

                LocalDataService.getSObject('Account',acctsid).then(function(sobject) {
                    accResult['Id'] = sobject.Id;
                    accResult['Name'] = sobject.Name;
                    accResult['Address__c'] = sobject.Address__c;
                    accResult['Customer_Number__c'] = sobject.Customer_Number__c;
                    accResult['_soupEntryId'] = sobject._soupEntryId;
                    deferred.resolve(accResult);
                }, angular.noop);

                return deferred.promise;
            };

            this.getCreateByInfoForWorkItem = function (wiResults) {
                var deferred = $q.defer();
                var userResultsMap = new Map();

                var createdUsersid =[];
                angular.forEach(wiResults, function (wiItem) {
                    if(wiItem.CreatedById != null){
                        createdUsersid.push(wiItem.CreatedById_sid);
                    }
                });

                if(createdUsersid.length < 1){
                    deferred.resolve(wiResults);
                    return deferred.promise;
                }

                LocalDataService.getSObjects('User',createdUsersid).then(function(sobjects) {
                    angular.forEach(sobjects, function (sobject) {
                        var userResult = new Object();
                        userResult['Id'] = sobject.Id;
                        userResult['Name'] = sobject.Name;
                        userResult['_soupEntryId'] = sobject._soupEntryId;
                        userResultsMap.set(sobject._soupEntryId, userResult);
                    });
                    angular.forEach(wiResults, function (wiItem) {
                        wiItem.CreatedBy = userResultsMap.get(wiItem.CreatedById_sid);
                    });
                    deferred.resolve(wiResults);
                }, angular.noop);

                return deferred.promise;
            };

            this.getRelatedUserInfo = function (userSid) {
                var deferred = $q.defer();
                var userResult = new Object();

                if(userSid == null || userSid == ''){
                    deferred.resolve(userResult);
                    return deferred.promise;
                }

                LocalDataService.getSObject('User',userSid).then(function(sobject) {
                    userResult['Id'] = sobject.Id;
                    userResult['Name'] = sobject.Name;
                    userResult['_soupEntryId'] = sobject._soupEntryId;
                    deferred.resolve(userResult);
                }, angular.noop);

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
                    if(recTypeId == null){
                        console.log('record type id is null');
                        //userWithNameResults.push();
                        recId = null;
                        deferred.resolve(null);
                        return deferred.promise;
                    }
                    var whereStr = "where {BTU__c:Manager__c_sid} = '"+ usersid + "' and {BTU__c:RecordTypeId} = '"+ recId + "'";
                    return service.getBTUInfoWithWhereStr(whereStr, 'getParentId');
                }).then(function (parentId) {
                    if(parentId == null){
                        console.log('parentId Id is null');
                        deferred.resolve([]);
                        return deferred.promise;
                    }
                    var whereStr3 = "where {BTU__c:Parent__c} = '"+ parentId + "' and {BTU__c:RecordTypeId} = '"+ recId + "'";
                    return service.getBTUInfoWithWhereStr(whereStr3, 'getManagersid');
                }).then(function (mangersIds) {
                    if(mangersIds == null || mangersIds.length <1){
                        console.log('mangersIds Id is null');
                        deferred.resolve([]);
                        return deferred.promise;
                    }
                    return service.getUserNameWithsIds(mangersIds);
                }).then(function (res) {
                    if(res != null){
                        userWithNameResults = res;
                    }
                    deferred.resolve(userWithNameResults);
                }).catch(function (error) {
                    deferred.resolve(error);
                });

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
                    deferred.resolve(getResult);
                }).catch(function (error) {
                    deferred.reject(error);
                });

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
                    console.log('user soup entry id is null');
                    //deferred.reject('user soup entry id is null');
                    deferred.resolve([]);
                    return deferred.promise;
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
                    deferred.resolve(getResult);
                }).catch(function (error) {
                    deferred.reject(error);
                });

                return deferred.promise;
            };

            this.getWorkItems = function(sids){
                var deferred = $q.defer();

                if(sids == null || sids.length < 1){
                    console.log('getWorkItems::NULL');
                    deferred.resolve([]);
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
                            results.push(entry[0]);
                            /*
                            results.push({
                                Id: entry[0].Id,
                                Name: entry[0].Name,
                                Service_Suggestion__c: entry[0].Service_Suggestion__c,
                                Arrival_Time__c: entry[0].Arrival_Time__c,
                                Departure_Time__c: entry[0].Departure_Time__c,
                                Leave_Time__c: entry[0].Leave_Time__c,
                                Start_Time2__c: entry[0].Start_Time2__c,
                                Finish_Time2__c: entry[0].Finish_Time2__c,
                                Service_Order__c: entry[0].Service_Order__c,
                                Service_Order__c_sid: entry[0].Service_Order__c_sid,
                                Service_Order__c_type: entry[0].Service_Order__c_type,
                                _soupEntryId: entry[0]._soupEntryId
                            });
                            */
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
            /**
             * update service order overview status value
             * @param isOnline
             * @param sooid :  online is id, offline is soupentry id
             * @param statusVal
             * @returns {*}
             */
            this.updateServiceOrderOverviewStatusUtil = function (isOnline, sooid, statusVal) {
                var deferred = $q.defer();

                if(isOnline){
                    var requestUrl = '/WorkDetailService?action=updateStatus&sooId='+ sooid + '&status=' + statusVal;

                    console.log('current url:::', requestUrl);

                    deferred.resolve(service.restRequest(requestUrl, 'POST', {}));
                }else{
                    var res;
                    res = service.offlineUpdateServiceOrderOverviewStatus(sooid, statusVal);
                    deferred.resolve(res);
                    /*
                    service.offlineUpdateServiceOrderOverviewStatus(sooid, statusVal).then(function (result) {
                        res = result;
                        return service.synchronize();
                    }).then(function () {
                        deferred.resolve(res);
                    }).catch(function (error) {
                        deferred.reject(service.generateResult('Fail', error));
                    });
                    */
                }
                return deferred.promise;
            };

            this.offlineUpdateServiceOrderOverviewStatus = function (soosid, statusStr) {
                var deferred = $q.defer();

                LocalDataService.getSObject('Service_Order_Overview__c',soosid).then(function(sobject) {
                    if(sobject['Status__c'] != statusStr){
                        sobject['Status__c'] = statusStr;
                    }

                    LocalDataService.updateSObjects('Service_Order_Overview__c', [sobject]).then(function(result) {
                        if (!result){
                            deferred.reject(service.generateResult('Fail', 'Failed to update service order overview!'));
                            return;
                        }
                        deferred.resolve(service.generateResult('Success', 'Status Update Success!'));
                    }, function (error) {
                        deferred.reject(service.generateResult('Fail', 'Failed to update service order overview!'));
                    });
                }, angular.noop);

                return deferred.promise;
            };

            /** 1.4 工单出发逻辑 **/
            /**
             * departure action
             * @param isOnline
             * @param sooid : online is id , offline is soup entry id
             * @param userId : online is id , offline is soup entry id
             * @param departureTime
             * @returns {*}
             */
            this.departureActionUtil = function (isOnline, sooid, userId, departureTime,carNo) {
                var deferred = $q.defer();

                if(isOnline){
                    var requestUrl = '/WorkDetailService?action=departure&sooId='+ sooid + '&departureTime='+ departureTime + '&userId='+userId+"&carNo="+carNo;

                    console.log('current url:::', requestUrl);

                    deferred.resolve(service.restRequest(requestUrl, 'POST', {}));
                }else{
                    var res;
                    res = service.offlineDepartureAction(sooid, departureTime, userId);
                    deferred.resolve(res);
                }
                return deferred.promise;
            };

            this.offlineDepartureAction = function (soosid, departureTime, userSid) {
                var deferred = $q.defer();

                service.updateServiceOrderOverviewOnOrder(soosid, true).then(function (mSoSid) {
                    return service.createWorkItem(mSoSid, departureTime, userSid);
                })/*.then(function (result) {
                    return service.synchronize();
                })*/.then(function (result) {
                    deferred.resolve(service.generateResult('Success', 'Departure Action Success !'));
                }).catch(function (error) {
                    deferred.reject(service.generateResult('Fail', error));
                });

                return deferred.promise;
            };

            /**
             * update service order overview onorder filed and return main service order soup id
             * @param soosid
             * @param onorderBoolean: boolean value
             * @returns {*}
             */
            this.updateServiceOrderOverviewOnOrder = function (soosid, onorderBoolean) {
                var deferred = $q.defer();
                var mainServiceOrderSid;

                LocalDataService.getSObject('Service_Order_Overview__c',soosid).then(function(sobject) {
                        sobject['On_Order__c'] = onorderBoolean;
                        mainServiceOrderSid = sobject['Main_Service_Order__c_sid'];

                    LocalDataService.updateSObjects('Service_Order_Overview__c', [sobject]).then(function(result) {
                        if (!result){
                            deferred.reject('Failed to update service order overview!');
                            return;
                        }
                        deferred.resolve(mainServiceOrderSid);
                    }, function (error) {
                        deferred.reject('Failed to update service order overview!');
                    });
                }, angular.noop);

                return deferred.promise;
            };

            this.createWorkItem = function (sosid, departureTime, userSid) {
                var deferred = $q.defer();

                LocalDataService.createSObject('Work_Item__c').then(function(sobject) {
                    var newWorkItem = new Object();
                    newWorkItem['Service_Order__c_sid'] = sosid;
                    newWorkItem['Support_Engineer__c_type'] = 'Service_Order__c';
                    newWorkItem['Departure_Time__c'] = departureTime;
                    newWorkItem['Engineer__c_sid'] = userSid;
                    newWorkItem['Engineer__c_type'] = 'User';
                    newWorkItem['Is_Processing__c'] = true;


                    LocalDataService.saveSObjects('Work_Item__c', [newWorkItem]).then(function(result) {
                        if (!result){
                            deferred.reject('Failed to insert WorkItem.');
                            return;
                        }
                        deferred.resolve(service.generateResult('Success', 'WorkItem Insert success!'));
                    }, function (error) {
                        console.log('WorkItem insert error:::', error);
                    });

                }, angular.noop);

                return deferred.promise;
            };


            /** 1.5 工单到达逻辑 **/
            /**
             * arrive action
             * @param isOnline
             * @param sooid : online is id , offline is soup entry id
             * @param userId : online is id , offline is soup entry id
             * @param arrivalTime
             * @returns {*}
             */
            this.arrivalActionUtil = function (isOnline, sooid, userId, arrivalTime ) {
                var deferred = $q.defer();

                if(isOnline){
                    var requestUrl = '/WorkDetailService?action=arrival&sooId='+ sooid + '&arrivalTime='+ arrivalTime + '&userId='+userId;

                    console.log('current url:::', requestUrl);

                    deferred.resolve(service.restRequest(requestUrl, 'POST', {}));
                }else{
                    var res;
                    res = service.offlineArrivalAction(sooid, arrivalTime, userId);
                    deferred.resolve(res);
                }
                return deferred.promise;
            };

            this.offlineArrivalAction = function (soosid, arrivalTime, userSid) {
                var deferred = $q.defer();
                var wiSids = [];
                var wiToUpdate = [];
                var result;

                service.getWorkItemsForOverview(soosid).then(function (wiObjs) {
                    if(wiObjs ==null || wiObjs.length < 1){
                        deferred.reject(service.generateResult('Fail', 'can not find work items !'));
                        return deferred.promise;
                    }

                    angular.forEach(wiObjs, function (wiItem) {
                            console.log(typeof wiItem.Is_Processing__c );
                        if(wiItem._soupEntryId != null && wiItem.Is_Processing__c
                            && wiItem.Engineer__c_sid == userSid && wiItem.Departure_Time__c != null
                            && wiItem.Arrival_Time__c == null && wiItem.Leave_Time__c == null){
                            wiSids.push(wiItem._soupEntryId);
                        }
                    });

                    if(wiSids.length < 1){
                        deferred.reject(service.generateResult('Fail', 'can not find work items !'));
                        return deferred.promise;
                    }

                    LocalDataService.getSObjects('Work_Item__c',wiSids).then(function(sobjects) {
                        angular.forEach(sobjects, function (sobject) {
                            sobject['Arrival_Time__c'] = arrivalTime;
                            wiToUpdate.push(sobject);
                        });


                        LocalDataService.updateSObjects('Work_Item__c', wiToUpdate).then(function(result) {
                            if (!result){
                                deferred.reject(service.generateResult('Fail', 'Failed to update work Item !'));
                                return deferred.promise;
                            }
                            deferred.resolve(service.generateResult('Success', 'arrival Action Success !'));
                        }, function (error) {
                            deferred.reject(service.generateResult('Fail', error));
                            return deferred.promise;
                        });
                    }, angular.noop);
                })/*.then(function (res) {
                    result = res;
                    return service.synchronize();
                }).then(function (res) {
                    deferred.resolve(res);
                })*/.catch(function (error) {
                    deferred.reject(service.generateResult('Fail', error));
                });

                return deferred.promise;
            };

            /** 1.6 工单离开逻辑 **/
            /**
             * leave action
             * @param isOnline
             * @param sooid : online is id , offline is soup entry id
             * @param userId : online is id , offline is soup entry id
             * @param arrivalTime
             * @param leaveTime
             * @returns {*}
             */
            this.leaveActionUtil = function (isOnline, sooid, userId, arrivalTime,leaveTime ) {
                var deferred = $q.defer();

                if(isOnline){
                    var requestUrl = '/WorkDetailService?action=leave&sooId='+ sooid + '&arrivalTime='+ arrivalTime + '&leaveTime='+ leaveTime + '&userId='+userId;

                    console.log('current url:::', requestUrl);

                    deferred.resolve(service.restRequest(requestUrl, 'POST', {}));
                }else{
                    var res;
                    res = service.offlineLeaveAction(sooid, arrivalTime, leaveTime, userId);
                    deferred.resolve(res);
                }
                return deferred.promise;
            };

            this.offlineLeaveAction = function (soosid, arrivalTime, leaveTime, userSid) {
                var deferred = $q.defer();
                var wiSids = [];
                var wiToUpdate = [];

                service.getWorkItemsForOverview(soosid).then(function (wiObjs) {
                    if(wiObjs ==null || wiObjs.length < 1){
                        deferred.reject(service.generateResult('Fail', 'can not find work items !'));
                        return deferred.promise;
                    }

                    angular.forEach(wiObjs, function (wiItem) {
                        if(wiItem._soupEntryId != null && wiItem.Is_Processing__c
                            && wiItem.Engineer__c_sid == userSid && wiItem.Departure_Time__c != null
                            && wiItem.Leave_Time__c == null){
                            wiSids.push(wiItem._soupEntryId);
                        }
                    });

                    if(wiSids.length < 1){
                        deferred.reject(service.generateResult('Fail', 'can not find work items !'));
                        return deferred.promise;
                    }

                    LocalDataService.getSObjects('Work_Item__c',wiSids).then(function(sobjects) {
                        angular.forEach(sobjects, function (sobject) {
                            if(sobject['Arrival_Time__c'] == null){
                                sobject['Arrival_Time__c'] = arrivalTime;
                            }
                            sobject['Start_Time2__c'] = arrivalTime;
                            sobject['Finish_Time2__c'] = leaveTime;
                            sobject['Leave_Time__c'] = leaveTime;
                            sobject['Is_Processing__c'] = false;
                            wiToUpdate.push(sobject);
                        });

                        LocalDataService.updateSObjects('Work_Item__c', wiToUpdate).then(function(result) {
                            if (!result){
                                deferred.reject(service.generateResult('Fail', 'Failed to update work Item !'));
                                return deferred.promise;
                            }
                            deferred.resolve('Success');
                        }, function (error) {
                            deferred.reject(service.generateResult('Fail', error));
                            return deferred.promise;
                        });
                    }, angular.noop);
                    return service.updateServiceOrderOverviewOnOrder(soosid, false);
                })/*.then(function (res) {
                    return service.synchronize();
                })*/.then(function (res) {
                    deferred.resolve(service.generateResult('Success', 'leave Action Success !'));
                }).catch(function (error) {
                    deferred.reject(service.generateResult('Fail', error));
                });

                return deferred.promise;
            };




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

            /** ----- part3:联系人 ----- **/
            this.updateContactsUtil = function (requestBody, isOnline) {
                var deferred = $q.defer();
                //var result = new Object();
                if(isOnline){
                    var param = JSON.stringify(requestBody);
                    var requestUrl = '/Service1Service?type=updateSobject';
                    if(param != null && param != ''){
                        requestUrl += '&param=' + param;
                    }else{
                        deferred.reject('param lost !');
                    }

                    deferred.resolve(this.restRequest(requestUrl, 'PUT', {}));
                }else{
                    var res = this.OfflineupdateContacts(requestBody);
                    deferred.resolve(res);
                }
                return deferred.promise;
            }

            this.OfflineupdateContacts = function (adrs) {
                console.log('update contacts:: ',adrs);
                var deferred = $q.defer();
                var adrIds = [];
                var newCon = [];
                var newItem;

                angular.forEach(adrs, function (entry) {
                    adrIds.push(entry._soupEntryId);
                });

                LocalDataService.getSObjects('Contact',adrIds).then(function(sobjects) {

                    console.log('sobject record:::', sobjects);
                    angular.forEach(sobjects, function (sobject) {
                        angular.forEach(adrs, function (adrItem){
                            console.log('sobjects id:::',sobject._soupEntryId);
                            console.log('adrItem id:::',adrItem._soupEntryId);
                            if(sobject._soupEntryId == adrItem._soupEntryId){
                                // newItem = service.cloneObj(sobject);
                                newItem = angular.copy(sobject);
                                newItem['LastName'] = adrItem.Name;
                                newItem['AccountId'] = adrItem.Account.Id;
                                newItem['AccountId_sid'] = adrItem.Account._soupEntryId;
                                newItem['AccountId_type'] = 'Account';
                                newItem['Phone'] = adrItem.Phone;
                                newItem['MobilePhone'] = adrItem.MobilePhone;
                                newItem['Email'] = adrItem.Email;
                                newItem['Contact_State__c'] = adrItem.Contact_State__c;
                                newItem['Position_Type__c'] = adrItem.Position_Type__c;
                                console.log('new item val:::', newItem);
                                newCon.push(newItem);
                            }
                        });

                    });

                    console.log('before update obj:::',newCon);

                    LocalDataService.updateSObjects('Contact', newCon).then(function(result) {
                        console.log('localSave:::',result);
                        if (!result){
                            //console.error("!result");
                            deferred.reject('Failed to get result.');
                            return;
                        }
                        //deferred.resolve(result);
                        service.synchronize().then(function () {
                            //deferred.resolve('done');
                            deferred.resolve(result);
                        });
                    }, function (error) {
                        // log error
                        console.log(error);
                    });

                },  function (error) {
                    // log error
                    console.log(error);
                });

                return deferred.promise;
            };




            /*** FUNCTION ***/
            this.getCurrentDateString = function () {
                var d = new Date().getDate();
                var m = new Date().getMonth()+1;
                var y = new Date().getFullYear();

                if(d<10){
                    d = '0' + d;
                }
                if(m<10){
                    m = '0' + m;
                }
                return y+'-'+m+'-'+d;
            };

            this.generateResult = function (status, info) {
                var deferred = $q.defer();

                var resultMap = new Object();

                resultMap['status'] = status;
                resultMap['message'] = info;

                deferred.resolve(resultMap);

                return deferred.promise;
            }

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
                    if(ObjItem._soupEntryId == null){
                        deferred.reject('soup entry id can not be null!');
                    }else{
                        soupEntryId.push(ObjItem._soupEntryId);
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