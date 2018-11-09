(function() {

    'use strict';

    /**
     * @ngdoc service
     * @name oinio.services:ProcurementInfoService
     *
     * @description
     */
    angular
        .module('oinio.services')
        .service('ProcurementInfoService', function($q, $filter, LocalDataService, ConnectionMonitor, IonicLoadingService, LocalSyncService, SMARTSTORE_COMMON_SETTING) {

            let service = this;

            this.ProcurementInfoSaveButton = function (ProcurementInfo, SupplierInfoSoupId, ProcurementItemInfos) {
                var deferred = $q.defer();

                service.saveProcurementInfo(ProcurementInfo, SupplierInfoSoupId).then(function (piSids) {
                    return service.saveProcurementItemInfo(piSids, ProcurementItemInfos );
                }).then(function (res) {
                    return service.synchronize();
                }).then(function () {
                    console.log('execute sucess !');
                    deferred.resolve('done');
                }).catch(function (error) {
                    console.log('execute error:::', error);
                    deferred.reject(error);
                });
                return deferred.promise;
            }

            this.saveProcurementInfo = function (ProcurementInfo, SupplierInfoSoupId) {
                console.log('current ProcurementInfo:::', ProcurementInfo);
                var deferred = $q.defer();
                var piObj;
                piObj = ProcurementInfo;

                LocalDataService.createSObject('Procurement_Information__c', piObj.recordType).then(function(sobject) {
                    var newItem;
                    var piObjsToSave = [];

                    newItem = service.cloneObj(sobject);

                    newItem['Delivery_Date__c'] = piObj.Delivery_Date__c;//计划日期(Date)
                    newItem['Supplier_Information__c_sid'] = SupplierInfoSoupId;//供应商信息(lookUp)
                    newItem['Procurement_Description__c'] = piObj.Procurement_Description__c;//采购描述
                    //newItem['Service_Order_Overview__c'] = piObj.Service_Order_Overview__c;//服务单
                    newItem['Status__c '] = piObj.Status__c ;//状态(picklist,需要api值)
                    newItem['Tax__c'] = piObj.Tax__c;//税率(picklist, 需要api值)
                    newItem['Revenue__c'] = Number(piObj.Revenue__c);//订单收入(Number)
                    newItem['Price_without_Tax__c'] = Number(piObj.Price_without_Tax__c);//采购价格(Number)
                    newItem['Profit__c'] = Number(piObj.Profit__c);//利润率(Number,不带百分比)
                    newItem['Remarks__c'] = piObj.Remarks__c;//采购备注

                    console.log('newItem::',newItem);
                    piObjsToSave.push(newItem);



                    LocalDataService.saveSObjects('Procurement_Information__c', piObjsToSave).then(function(result) {
                        let arr_sids = [];
                        console.log('save result:::',result);
                        if (!result){
                            console.log('save error!');
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
                        console.log('procurement info save sucess soup id:::',arr_sids);
                        deferred.resolve(arr_sids);
                    }, function (error) {
                        console.log(error);
                        deferred.reject(error);
                    });

                }, angular.noop);

                return deferred.promise;
            }

            this.saveProcurementItemInfo = function (sids, ServiceMaterials) {
                var deferred = $q.defer();

                LocalDataService.createSObject('Procurement_Item_Information__c').then(function(sobject) {
                    var piiObjsToSave = [];

                    for (var i=0;i<ServiceMaterials.length;i++) {
                        var newItem;
                        newItem = service.cloneObj(sobject);
                        newItem['Name'] =  ServiceMaterials[i].Item_Code__c;//Name (非页面字段)
                        newItem['Item_Code__c'] =  ServiceMaterials[i].Item_Code__c;//编号
                        newItem['Required_Quantity__c'] =  Number(ServiceMaterials[i].Required_Quantity__c);//数量(Number)
                        newItem['Item_Description__c'] =  ServiceMaterials[i].Item_Description__c;//描述
                        newItem['Factory__c'] =  ServiceMaterials[i].Factory__c;//工厂
                        newItem['Unite_Price__c'] =  Number(ServiceMaterials[i].Unite_Price__c);//净价(Number)
                        newItem['Procurement_Information__c_sid'] = sids[0];
                        piiObjsToSave.push(newItem);
                    }

                    LocalDataService.saveSObjects('Procurement_Item_Information__c', piiObjsToSave).then(function(result) {
                        let arr_sids = [];
                        console.log('Procurement Item Info save result:::',result);
                        if (!result){
                            console.log("Procurement Item Info save error!");
                            deferred.reject('Failed to get result.');
                            return;
                        }
                        for (var i=0;i<result.length;i++){
                            if (result[i].success){
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
                        console.log('Procurement Item Info soup id:::',arr_sids);
                        deferred.resolve(arr_sids);
                    }, function (error) {
                        console.log('Procurement Item Info error:::', error);
                    });

                }, angular.noop);

                return deferred.promise;
            }

            this.querySupplierInformation = function (codeOrName) {
                var deferred = $q.defer();

                if(codeOrName == '' || codeOrName == null){
                    deferred.reject('Search string can not be null!');
                }else{
                    var sql = "select {Supplier_Information__c:_soup}\
                         from {Supplier_Information__c}\
                         where {Supplier_Information__c:Name} like '%"+codeOrName+"%'\
                         or {Supplier_Information__c:Supplier_Code__c} like '%"+codeOrName+"%'\
                         order by {Supplier_Information__c:_soupEntryId}";
                    console.log('current query sql:::', sql);

                    var querySuInfo= navigator.smartstore.buildSmartQuerySpec(sql, SMARTSTORE_COMMON_SETTING.PAGE_SIZE_FOR_ALL);
                    navigator.smartstore.runSmartQuery(querySuInfo, function (cursor) {
                        var results = [];
                        if (cursor && cursor.currentPageOrderedEntries && cursor.currentPageOrderedEntries.length) {
                            angular.forEach(cursor.currentPageOrderedEntries, function (entry) {
                                var result = new Object();
                                result['Name'] = entry[0].Name;
                                result['Province__c'] = entry[0].Province__c;
                                result['City__c'] = entry[0].City__c;
                                result['Address__c'] = entry[0].Address__c;
                                result['Post_Code__c'] = entry[0].Post_Code__c;
                                result['Telephone__c'] = entry[0].Telephone__c;
                                result['FAX__c'] = entry[0].FAX__c;
                                result._soupEntryId = entry[0]._soupEntryId;
                                results.push(result);
                            });
                        }
                        console.log('Supplier Information results:::', results);
                        deferred.resolve(results);
                    }, function (err) {
                        console.error(err);
                        deferred.reject(err);
                    });
                }
                return deferred.promise;
            }

            this.queryServiceMaterial = function (materialName) {
                var deferred = $q.defer();

                if(materialName == '' || materialName == null){
                    deferred.reject('Search string can not be null!');
                }else{
                    var sql = "select {parts__c:_soup}\
                         from {parts__c}\
                         where {parts__c:Name} like '%"+materialName+"%'\
                    order by {parts__c:_soupEntryId}";
                    console.log('current query sql:::', sql);

                    var querySmInfo= navigator.smartstore.buildSmartQuerySpec(sql, SMARTSTORE_COMMON_SETTING.PAGE_SIZE_FOR_ALL);
                    navigator.smartstore.runSmartQuery(querySmInfo, function (cursor) {
                        var results = [];
                        if (cursor && cursor.currentPageOrderedEntries && cursor.currentPageOrderedEntries.length) {
                            angular.forEach(cursor.currentPageOrderedEntries, function (entry) {
                                var result = new Object();
                                result['Name'] = entry[0].Name;
                                result['parts_description__c'] = entry[0].parts_description__c;
                                result['Factory__c'] = entry[0].Factory__c;
                                result['Cost_Price__c'] = entry[0].Cost_Price__c;
                                result._soupEntryId = entry[0]._soupEntryId;
                                results.push(result);
                            });
                        }
                        console.log('Service Material results:::', results);
                        deferred.resolve(results);
                    }, function (err) {
                        console.error(err);
                        deferred.reject(err);
                    });
                }
                return deferred.promise;
            }

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

            this.cloneObj = function (obj) {
                var newObj = new Object();
                if(obj.RecordTypeId != null && obj.RecordTypeId != '') {
                    newObj['RecordTypeId'] = obj.RecordTypeId;
                    newObj['RecordTypeId_sid'] = obj.RecordTypeId_sid;
                    newObj['RecordTypeId_type'] = 'RecordType';
                }
                return newObj;
            };


        });
})();





























