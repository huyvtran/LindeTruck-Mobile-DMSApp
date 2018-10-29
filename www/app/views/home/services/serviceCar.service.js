(function() {

    'use strict';

    /**
     * @ngdoc service
     * @name oinio.services:SCarService
     *
     * @description
     */
    angular
        .module('oinio.services')
        .service('SCarService', function($q, $filter, $log, LocalDataService, ConnectionMonitor, IonicLoadingService, LocalSyncService, SMARTSTORE_COMMON_SETTING) {

            let service = this;

            this.serviceCarSaveButton = function (serviceCar, images) {
                let deferred = $q.defer();
                let ret;
                let sids_childOrder = [];

                service.saveServiceCar(serviceCar).then(function (scSids) {
                    return service.saveAttachments(images,scSids);
                }).then(function (res) {
                    return service.synchronize();
                }).then(function () {
                    deferred.resolve('done');
                }).catch(function (error) {
                    deferred.reject(error);
                });

                return deferred.promise;
            }

            this.saveServiceCar = function (serviceCarItem) {
                console.log('current serviceCar:', serviceCarItem);
                var deferred = $q.defer();

                LocalDataService.createSObject('Service_Car__c').then(function(sobject) {
                    var newItem, adr;
                    var adrsToSave = [];

                    newItem = service.cloneObj(sobject);

                    newItem['CarNo'] = adr.CarNo__c;
                    newItem['GasCost'] = adr.GasCost__c;
                    newItem['SelfMileage'] = adr.SelfMileage__c;
                    newItem['DriveMileage'] = adr.DriveMileage__c;
                    newItem['GasMileage'] = adr.GasMileage__c;
                    newItem['OtherCost'] = adr.OtherCost__c;
                    newItem['Remark'] = adr.Remark__c;

                    console.log('newItem::' + newItem);

                    adrsToSave.push(newItem);
                    console.log('newItem::',newItem);


                    LocalDataService.saveSObjects('Service_Car__c', adrsToSave).then(function(result) {
                        let arr_sids = [];
                        console.log('save result:::',result);
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

            this.saveImages2Attachments = function (images,sid) {
                console.log('saveImages2Attachments:: '+images);
                var deferred = $q.defer();
                let array_params = [];

                var param = new Object();
                param.contentType = 'image/jpeg';
                param.parentObjectType = 'Service_Car__c';

                for (var i=0;i<images.length;i++){
                    param.body = images[i];
                    param.parentSoupEntryId = sid[0];
                    array_params.push(param);
                }
                console.log('array_params：：',array_params);
                deferred.resolve(array_params);

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





























