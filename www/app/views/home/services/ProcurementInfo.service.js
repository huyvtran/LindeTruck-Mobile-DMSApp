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

            this.querySupplierInformation = function (codeOrName) {
                var deferred = $q.defer();

                if(codeOrName == '' || codeOrName == null){
                    deferred.reject('Search string can not be null!');
                }else{
                    var sql = "select {Supplier_Information__c:_soup}\
                         from {Supplier_Information__c}\
                         where {Supplier_Information__c:Name} like '%"+codeOrName+"%'\
                         or {Supplier_Information__c:Supplier_Code__c} like '%"+codeOrName+"%'\
                         order by {Supplier_Information__c:_soupEntryId} desc limit 1";
                    console.log('current query sql:::', sql);

                    var querySuInfo= navigator.smartstore.buildSmartQuerySpec(sql, SMARTSTORE_COMMON_SETTING.PAGE_SIZE_FOR_ALL);
                    navigator.smartstore.runSmartQuery(querySpec, function (cursor) {
                        var result = new Object();
                        if (cursor && cursor.currentPageOrderedEntries && cursor.currentPageOrderedEntries.length) {
                            angular.forEach(cursor.currentPageOrderedEntries, function (entry) {
                                result['Province__c'] = entry[0].Province__c;
                                result['City__c'] = entry[0].City__c;
                                result['Address__c'] = entry[0].Address__c;
                                result['Post_Code__c'] = entry[0].Post_Code__c;
                                result['Telephone__c'] = entry[0].Telephone__c;
                                result['FAX__c'] = entry[0].FAX__c;
                                result._soupEntryId = entry[0]._soupEntryId;
                            });
                        }
                        deferred.resolve(result);
                    }, function (err) {
                        console.error(err);
                        deferred.reject(err);
                    });
                }
                return deferred.promise;
            }

            /*
            this.queryServiceMaterial = function (materialName) {
                var deferred = $q.defer();

                if(codeOrName == '' || codeOrName == null){
                    deferred.reject('Search string can not be null!');
                }else{
                    var sql = "select {Supplier_Information__c:_soup}\
                         from {Supplier_Information__c}\
                         where {Supplier_Information__c:Name} like '%"+codeOrName+"%'\
                         or {Supplier_Information__c:Supplier_Code__c} like '%"+codeOrName+"%'
                    order by {Supplier_Information__c:_soupEntryId} desc limit 1";
                    console.log('current query sql:::', sql);

                    var querySuInfo= navigator.smartstore.buildSmartQuerySpec(sql, SMARTSTORE_COMMON_SETTING.PAGE_SIZE_FOR_ALL);
                    navigator.smartstore.runSmartQuery(querySpec, function (cursor) {
                        var result = new Object();
                        if (cursor && cursor.currentPageOrderedEntries && cursor.currentPageOrderedEntries.length) {
                            angular.forEach(cursor.currentPageOrderedEntries, function (entry) {
                                result['Province__c'] = entry[0].Province__c;
                                result['City__c'] = entry[0].City__c;
                                result['Address__c'] = entry[0].Address__c;
                                result['Post_Code__c'] = entry[0].Post_Code__c;
                                result['Telephone__c'] = entry[0].Telephone__c;
                                result['FAX__c'] = entry[0].FAX__c;
                                result._soupEntryId = entry[0]._soupEntryId;
                            });
                        }
                        deferred.resolve(result);
                    }, function (err) {
                        console.error(err);
                        deferred.reject(err);
                    });
                }
                return deferred.promise;
            }
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





























