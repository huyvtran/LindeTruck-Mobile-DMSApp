(function() {

    'use strict';

    /**
     * @ngdoc service
     * @name oinio.services:SQuoteService
     *
     * @description
     */
    angular
        .module('oinio.services')
        .service('SOrderService', function($q, $filter, $log, LocalDataService, ConnectionMonitor, IonicLoadingService, LocalSyncService, SMARTSTORE_COMMON_SETTING) {

            let service = this;

            /**
             * @func  getOfflineName
             * @desc  search (fuzzy) Account list by account name or account sap number
             * @param {String} keyword - part of account name or account sap number
             * @returns {Promise} [Account] - Account list, including Id, Name, SAP_Number__c
             */

            this.getOfflineName = function(userId){
                console.log('getOfflineName.userId:%s', userId);
                let deferred = $q.defer();
                let maxId = 0;
                let str_date = service.getCurrentDateString();

                let sql =  "select {Service_Order_Overview__c:_soup}\
                         from {Service_Order_Overview__c}\
                         order by {Service_Order_Overview__c:_soupEntryId} desc limit 1";

                let querySpec = navigator.smartstore.buildSmartQuerySpec(sql, SMARTSTORE_COMMON_SETTING.PAGE_SIZE_FOR_ALL);
                navigator.smartstore.runSmartQuery(querySpec, function (cursor) {
                    if (cursor && cursor.currentPageOrderedEntries && cursor.currentPageOrderedEntries.length) {
                        angular.forEach(cursor.currentPageOrderedEntries, function (entry) {
                            maxId = entry[0]._soupEntryId + 1;
                        });
                    }

                }, function (err) {
                    $log.error(err);
                    console.error(err);
                    deferred.reject(err);
                });

                if(maxId == 0){
                    maxId = 1;
                }

                if(maxId < 10){
                    maxId = '0' + maxId;
                }

                if(Number(maxId) < 100){
                    maxId = '0' + maxId;
                }

                if(Number(maxId) < 1000){
                    maxId = '0' + maxId;
                }

                let result = str_date + userId + maxId;

                deferred.resolve(result);
                console.log('getOfflineName::', deferred.promise);
                return deferred.promise;
            };





            this.getDetails = function(sid){
                console.log('getDetails.sid:%s', sid);
                let deferred = $q.defer();


                let sql =  "select {Service_Order_Overview__c:_soup}\
                         from {Service_Order_Overview__c}\
                         where {Service_Order_Overview__c:_soupEntryId}='"+sid+"'";

                let querySpec = navigator.smartstore.buildSmartQuerySpec(sql, SMARTSTORE_COMMON_SETTING.PAGE_SIZE_FOR_ALL);
                navigator.smartstore.runSmartQuery(querySpec, function (cursor) {
                    let result = new Object();
                    if (cursor && cursor.currentPageOrderedEntries && cursor.currentPageOrderedEntries.length) {
                        angular.forEach(cursor.currentPageOrderedEntries, function (entry) {
                            result['Mobile_Offline_Name__c'] = entry[0].Mobile_Offline_Name__c;
                            result['Work_Order_Type__c'] = entry[0].Work_Order_Type__c;
                            result['Description__c'] = entry[0].Description__c;
                            result['Service_Suggestion__c'] = entry[0].Service_Suggestion__c;

                            result.Account_Ship_to__c = entry[0].Account_Ship_to__c;
                            result.Service_Order_Type__c = entry[0].Service_Order_Type__c;
                            result.Status__c = entry[0].Status__c;
                            result.Service_Order_Owner__c = entry[0].Service_Order_Owner__c;
                            result.Plan_Date__c = entry[0].Plan_Date__c;
                            result.Truck_Serial_Number__c = entry[0].Truck_Serial_Number__c;
                            result.Subject__c = entry[0].Subject__c;
                            result._soupEntryId = entry[0]._soupEntryId;
                        });
                    }
                    deferred.resolve(result);
                }, function (err) {
                    $log.error(err);
                    console.error(err);
                    deferred.reject(err);
                });

                console.log('getDetails::', deferred.promise);
                return deferred.promise;
            };






            this.getWorkItemsForOverview = function (sid) {
                let deferred = $q.defer();
                let ret;
                console.log('111111:::',sid);
                service.searchChildOrderSidsForParent(sid).then(function (sosids) {
                    console.log('222222:::',sosids);
                    return service.getWorkItems(sosids);
                }).catch(function (error) {
                    deferred.reject(error);
                });

                return deferred.promise;
            }







            this.getWorkItems = function(sids){
                console.log('getWorkItems.sid:%s', sids);
                let deferred = $q.defer();

                if(sids == null || sids.length < 1){
                    console.log('getWorkItems::NULL');
                    deferred.resolve(null);
                    return deferred.promise;
                }

                let sqlInString = "'" + sids.join("','") + "'";

                let sql =  "select {Work_Item__c:_soup}\
                         from {Work_Item__c}\
                         where {Work_Item__c:Service_Order__c_sid} in (" +sqlInString+ ")";

                let querySpec = navigator.smartstore.buildSmartQuerySpec(sql, SMARTSTORE_COMMON_SETTING.PAGE_SIZE_FOR_ALL);
                navigator.smartstore.runSmartQuery(querySpec, function (cursor) {
                    let results = [];
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
                    $log.error(err);
                    console.error(err);
                    deferred.reject(err);
                });

                console.log('getWorkItems::', deferred.promise);
                return deferred.promise;
            };



            this.getPrintDetails = function (sid) {
                let deferred = $q.defer();
                let ret;
                console.log('getPrintDetails:::',sid);

                service.getServiceOrderOverviewDetail(sid).then(function (result) {
                    console.log('getPrintDetails1:::',result);
                    ret = result;
                    return service.getAccountDetail(ret.Account_Ship_to__c_sid);
                }).then(function (acct) {
                    console.log('getPrintDetails2:::',acct);
                    ret.Account_Ship_to__r = acct;
                    return service.getUserDetail(ret.Service_Order_Owner__c_sid);
                }).then(function (user) {
                    console.log('getPrintDetails3:::',user);
                    ret.Service_Order_Owner__r = user;
                    return service.getWorkItems([sid]);
                }).then(function (workitems) {
                    console.log('getPrintDetails4:::',workitems);
                    ret.workItems = workitems;
                    return service.getChildOrders(sid);
                }).then(function (childOrders) {
                    console.log('getPrintDetails5:::',childOrders);
                    ret.childOrders = childOrders;
                    return service.getTruckModels(ret.childOrders);
                }).then(function (truckModels) {
                    console.log('getPrintDetails6:::',truckModels);
                    ret.truckModels = truckModels;
                    deferred.resolve(ret);
                }).catch(function (error) {
                    deferred.reject(error);
                });

                return deferred.promise;
            }


            this.getServiceOrderOverviewDetail = function (sid) {
                console.log('getServiceOrderOverviewDetail:: '+sid);
                var deferred = $q.defer();

                LocalDataService.getSObject('Service_Order_Overview__c',sid).then(function(sobject) {
                    deferred.resolve(sobject);
                }, angular.noop);

                return deferred.promise;
            };

            this.getAccountDetail = function (sid) {
                console.log('getAccountDetail:: '+sid);
                var deferred = $q.defer();

                if(sid == null || sid == ''){
                    deferred.resolve(null);
                    return deferred.promise;
                }

                LocalDataService.getSObject('Account',sid).then(function(sobject) {
                    deferred.resolve(sobject);
                }, angular.noop);

                return deferred.promise;
            };

            this.getUserDetail = function (sid) {
                console.log('getUserDetail:: '+sid);
                var deferred = $q.defer();

                if(sid == null || sid == ''){
                    deferred.resolve(null);
                    return deferred.promise;
                }

                LocalDataService.getSObject('User',sid).then(function(sobject) {
                    deferred.resolve(sobject);
                }, angular.noop);

                return deferred.promise;
            };

            this.getChildOrders = function(sid){
                console.log('getChildOrders.keyword:%s',sid);
                let deferred = $q.defer();

                let sql =  "select {Service_Order__c:_soup}\
                         from {Service_Order__c}\
                         where {Service_Order__c:Service_Order_Overview__c_sid} ='"+sid+"'";
                let querySpec = navigator.smartstore.buildSmartQuerySpec(sql, SMARTSTORE_COMMON_SETTING.PAGE_SIZE_FOR_ALL);
                navigator.smartstore.runSmartQuery(querySpec, function (cursor) {
                    let orders = [];
                    if (cursor && cursor.currentPageOrderedEntries && cursor.currentPageOrderedEntries.length) {
                        console.log('searchChildOrderSidsForParent::sql::', cursor.currentPageOrderedEntries);
                        angular.forEach(cursor.currentPageOrderedEntries, function (entry) {
                            orders.push(entry[0]);
                        });
                    }

                    console.log('getChildOrders::orders::', orders);
                    deferred.resolve(orders);
                }, function (err) {
                    $log.error(err);
                    console.error(err);
                    deferred.reject(err);
                });
                console.log('getChildOrders::', deferred.promise);
                return deferred.promise;
            };


            this.getTruckModels = function(sid){
                console.log('getTruckModels.keyword:%s',sid);
                let deferred = $q.defer();
                let truckSids = [];

                if(sid == null || sid.length < 1){
                    console.log('getTruckModels::NULL');
                    deferred.resolve(null);
                    return deferred.promise;
                }

                angular.forEach(sid, function (entry) {
                    truckSids.push(entry.Truck_Serial_Number__c_sid);
                });

                let sqlInString = "'" + truckSids.join("','") + "'";

                let sql =  "select {Truck_Fleet__c:_soup}\
                         from {Truck_Fleet__c}\
                         where {Truck_Fleet__c:_soupEntryId} in (" +sqlInString+ ")";
                let querySpec = navigator.smartstore.buildSmartQuerySpec(sql, SMARTSTORE_COMMON_SETTING.PAGE_SIZE_FOR_ALL);
                navigator.smartstore.runSmartQuery(querySpec, function (cursor) {
                    let orders = [];
                    if (cursor && cursor.currentPageOrderedEntries && cursor.currentPageOrderedEntries.length) {
                        console.log('searchChildOrderSidsForParent::sql::', cursor.currentPageOrderedEntries);
                        angular.forEach(cursor.currentPageOrderedEntries, function (entry) {
                            orders.push(entry[0].Model__c);
                        });
                    }

                    console.log('getTruckModels::orders::', orders);
                    deferred.resolve(orders);
                }, function (err) {
                    $log.error(err);
                    console.error(err);
                    deferred.reject(err);
                });
                console.log('getTruckModels::', deferred.promise);
                return deferred.promise;
            };

            this.setTruckIntoOrders = function (orders,trucks) {
                et deferred = $q.defer();
                let ret;

                angular.forEach(orders, function (order) {
                    angular.forEach(trucks, function (truck) {
                        if(order.Truck_Serial_Number__c_sid == truck._soupEntryId || order.Truck_Serial_Number__c == truck.Id){
                            order.Truck_Serial_Number__r = truck;
                        }
                    });
                });

                deferred.resolve(orders);
                return deferred.promise;
            }


            this.getOrdersSelectedTruck = function (sid) {
                let deferred = $q.defer();
                let ret;
                console.log('getOrdersSelectedTruck:::',sid);

                service.getChildOrders(sid).then(function (childOrders) {
                    console.log('getOrdersSelectedTruck1:::',childOrders);
                    ret.childOrders = childOrders;
                    return service.getTruckModels(ret.childOrders);
                }).then(function (truckModels) {
                    console.log('getOrdersSelectedTruck2:::',truckModels);
                    ret.truckModels = truckModels;
                    return service.setTruckIntoOrders(ret.childOrders,ret.truckModels);
                }).then(function (result) {
                    console.log('getOrdersSelectedTruck3:::',result);
                    deferred.resolve(result);
                }).catch(function (error) {
                    deferred.reject(error);
                });

                return deferred.promise;
            }






            /**
             * @func  workDetailSaveButton
             * @desc  save workDetailSaveButton
             * @param {Object} order - the data which should be save objects for,
             *      the data should contain
             *  Service_Order_Overview__c.Mobile_Offline_Name__c
             *  Service_Order_Overview__c.Work_Order_Type__c
             *  Service_Order_Overview__c.Description__c
             *  Service_Order_Overview__c.Service_Suggestion__c
             *  Service_Order_Overview__c.Subject__c
             *
             *
             *  {String}   str_suggest
             *  {String[]}  images - the array of base64 String value for images
             *
             *
             *  {DateTime} arrivaltime
             *  {DateTime} leaveTime
             *  {DateTime} startTime
             *  {DateTime} finishTime
             *
             * @returns {Promise} an array of Contact objects containing like
             *   "_soupId": 1234567890,
             */

            this.workDetailSaveButton = function (order,str_suggest,images,arrivaltime,leaveTime,startTime,finishTime) {
                let deferred = $q.defer();
                let ret;
                let sids_childOrder = [];

                service.saveWorkOrderOverview(order).then(function (soo) {
                    return service.searchChildOrderSidsForParent(soo[0]._soupEntryId);
                }).then(function (sosids) {
                    sids_childOrder = sosids;
                    return service.saveChildWorkOrder(sosids,order);
                }).then(function (childOrders) {
                    return service.saveWorkItems(sids_childOrder,str_suggest,arrivaltime,leaveTime,startTime,finishTime);
                }).then(function (wiSids) {
                    return service.saveAttachments(images,wiSids);
                }).then(function (res) {
                    return service.synchronize();
                }).then(function () {
                    deferred.resolve('done');
                }).catch(function (error) {
                    deferred.reject(error);
                });

                return deferred.promise;
            }



            this.saveWorkOrderOverview = function (order) {
                console.log('saveWorkOrder:: '+order);
                var deferred = $q.defer();

                LocalDataService.getSObject('Service_Order_Overview__c',order._soupEntryId).then(function(sobject) {
                    sobject['Mobile_Offline_Name__c'] = order.Mobile_Offline_Name__c;
                    sobject['Work_Order_Type__c'] = order.Work_Order_Type__c;
                    sobject['Description__c'] = order.Description__c;
                    sobject['Service_Suggestion__c'] = order.Service_Suggestion__c;
                    sobject['Subject__c'] = order.Subject__c;


                    LocalDataService.updateSObjects('Service_Order_Overview__c', [sobject]).then(function(result) {
                        console.log('localSave:::',result);
                        if (!result){
                            deferred.reject('Failed to get result.');
                            return;
                        }
                        console.log('localSave222:::',result);
                        deferred.resolve(result);
                        // service.synchronize().then(function () {
                        //     deferred.resolve('done');
                        // });
                    }, function (error) {
                        console.log(error);
                    });

                }, angular.noop);

                return deferred.promise;
            };

            this.searchChildOrderSidsForParent = function(sid){
                console.log('searchChildOrderSidsForParent.keyword:%s',sid);
                let deferred = $q.defer();

                let sql =  "select {Service_Order__c:_soup}\
                         from {Service_Order__c}\
                         where {Service_Order__c:Service_Order_Overview__c_sid} ='"+sid+"'";
                let querySpec = navigator.smartstore.buildSmartQuerySpec(sql, SMARTSTORE_COMMON_SETTING.PAGE_SIZE_FOR_ALL);
                navigator.smartstore.runSmartQuery(querySpec, function (cursor) {
                    let orders = [];
                    if (cursor && cursor.currentPageOrderedEntries && cursor.currentPageOrderedEntries.length) {
                        console.log('searchChildOrderSidsForParent::sql::', cursor.currentPageOrderedEntries);
                        angular.forEach(cursor.currentPageOrderedEntries, function (entry) {
                            orders.push(entry[0]._soupEntryId);
                        });
                    }

                    console.log('searchChildOrderSidsForParent::orders::', orders);
                    deferred.resolve(orders);
                }, function (err) {
                    $log.error(err);
                    console.error(err);
                    deferred.reject(err);
                });
                console.log('searchChildOrderSidsForParent::', deferred.promise);
                return deferred.promise;
            };


            this.saveChildWorkOrder = function (orderSids,parent) {
                console.log('saveWorkOrder:: '+orderSids);
                var deferred = $q.defer();

                LocalDataService.getSObjects('Service_Order__c',orderSids).then(function(sobjects) {

                    angular.forEach(sobjects, function (sobject) {
                        sobject['Mobile_Offline_Name__c'] = parent.Mobile_Offline_Name__c;
                        sobject['Work_Order_Type__c'] = parent.Work_Order_Type__c;
                        sobject['Description__c'] = parent.Description__c;
                        sobject['Service_Suggestion__c'] = parent.Service_Suggestion__c;
                        sobject['Subject__c'] = parent.Subject__c;
                    });

                    LocalDataService.updateSObjects('Service_Order__c', sobjects).then(function(result) {
                        console.log('localSave:::',result);
                        if (!result){
                            //console.error("!result");
                            deferred.reject('Failed to get result.');
                            return;
                        }
                        console.log('localSave222:::',result);
                        deferred.resolve(result);
                        // service.synchronize().then(function () {
                        //     deferred.resolve('done');
                        // });
                    }, function (error) {
                        // log error
                        console.log(error);
                    });

                }, angular.noop);

                return deferred.promise;
            };



            this.saveWorkItems = function (adrs,str_suggestion,arrivaltime,leaveTime,startTime,finishTime) {
                console.log('saveWorkItems:: '+adrs);
                var deferred = $q.defer();

                LocalDataService.createSObject('Work_Item__c').then(function(sobject) {
                    var newItem, adr;
                    var adrsToSave = [];

                    for (var i=0;i<adrs.length;i++){
                        adr = adrs[i];
                        newItem = service.cloneObj(sobject);

                        //newItem['Service_Order__c'] = adr.Service_Order_Owner__c;
                        newItem['Service_Order__c_sid'] = adr;
                        newItem['Service_Order__c_type'] = 'Service_Order__c';


                        newItem['Arrival_Time__c'] = arrivaltime;
                        newItem['Departure_Time__c'] = leaveTime;
                        newItem['Start_Time__c'] = startTime;
                        newItem['Finish_Time__c'] = finishTime;

                        newItem['Service_Suggestion__c'] = str_suggestion;

                        adrsToSave.push(newItem);
                        console.log('newItem::',newItem);
                    }

                    LocalDataService.saveSObjects('Work_Item__c', adrsToSave).then(function(result) {
                        let arr_sids = [];
                        console.log('saveWorkItems2:::',result);
                        if (!result){
                            //console.error("!result");
                            deferred.reject('Failed to get result.');
                            return;
                        }
                        for (var i=0;i<result.length;i++){
                            if (result[i].success){
                                //adrs[i]._soupEntryId = result[i]._soupEntryId;

                                let existFlag = false;
                                angular.forEach(arr_sids, function (s) {
                                    if(s == result[i]._soupEntryId){
                                        existFlag = true;
                                    }
                                });
                                if(!existFlag){
                                    arr_sids.push(result[i]._soupEntryId);
                                }
                            }
                        }
                        console.log('saveWorkItems3:::',arr_sids);
                        deferred.resolve(arr_sids);
                        // synchronize().then(function () {
                        //     deferred.resolve('done');
                        // });
                    }, function (error) {
                        // log error
                        console.log(error);
                    });

                }, angular.noop);

                return deferred.promise;
            };


            this.loopArray = function (x,params) {
                var deferred = $q.defer();
                if(x >= params.length){
                    return;
                }
                let param = params[x];
                LocalDataService.createAttachment(param).then((result) => {
                    console.log('saveWorkItems2:::',result);
                    if (!result){
                        //console.error("!result");
                        //deferred.reject('Failed to get result.');
                        return;
                    }
                    //deferred.resolve(adrs);
                    x++;

                    if ( x < params.length ) {
                        console.log("当前异步完成，进行下次循环");
                        service.loopArray(x,params);
                    }else if(x === params.length){
                        console.log("All Promise finished");
                        deferred.resolve(params);
                        return deferred.promise;
                    }

                }, function (error) {
                    console.log(error);
                    deferred.reject(error);
                });
                return deferred.promise;
            };



            this.AddAttachments = function (sids) {
                var deferred = $q.defer(),
                    results = [];

                var getNextSObject = function (index) {

                    if (index >= sids.length) {
                        deferred.resolve(results);
                    } else {
                        LocalDataService.createAttachment(sids[index]).then(function (result) {
                            results.push(result);
                            getNextSObject(++index);
                        }, function (error) {
                            deferred.reject(error);
                        });
                    }
                };

                getNextSObject(0);

                return deferred.promise;
            };



            this.saveImages2Attachments = function (images,sids) {
                console.log('saveImages2Attachments:: '+images);
                var deferred = $q.defer();
                let array_params = [];


                for (var i=0;i<images.length;i++){
                    for (var j=0;j<sids.length;j++){
                        var param = new Object();
                        param.contentType = 'image/jpeg';
                        param.parentObjectType = 'Work_Item__c';
                        param.body = images[i];
                        param.parentSoupEntryId = sids[j];
                        array_params.push(param);
                    }
                }
                console.log('array_params：：',array_params);
                deferred.resolve(array_params);

                return deferred.promise;
            };

            this.saveAttachments = function (images,sids) {
                let deferred = $q.defer();
                let ret;

                service.saveImages2Attachments(images,sids).then(function (array_params) {
                    console.log('saveAttachments::array_params：：',array_params);
                    return service.AddAttachments(array_params);
                }).then(function (res) {
                    console.log('saveAttachments::res：：',res);
                    deferred.resolve(res);
                }).catch(function (error) {
                    deferred.reject(error);
                });

                return deferred.promise;
            }


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


            /**
             * Deep clone for js object
             */
            this.cloneObj = function (obj) {
                var newObj = new Object();
                if(obj.RecordTypeId != null && obj.RecordTypeId != '') {
                    newObj['RecordTypeId'] = obj.RecordTypeId;
                    newObj['RecordTypeId_sid'] = obj.RecordTypeId_sid;
                    newObj['RecordTypeId_type'] = 'RecordType';
                }
                return newObj;
            };

            /**
             * Format date string for auto create order name
             */
            this.getCurrentDateString = function () {
                let d = new Date().getDate();
                let m = new Date().getMonth();
                let y = new Date().getFullYear();

                if(d<10){
                    d = '0' + d;
                }
                if(m<10){
                    m = '0' + m;
                }
                return y+m+d;
            };


        });
})();





























